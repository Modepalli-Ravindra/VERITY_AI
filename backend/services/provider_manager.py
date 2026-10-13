import os
import logging
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv
from fastapi import HTTPException

from backend.ml.stylometrics import StylometricExtractor
from backend.ml.fusion_model import FeatureFusionDetector
from backend.ml.text_chunking import chunk_text
from backend.services.llm_provider import (
    PROVIDERS_MAP,
    BaseLLMProvider,
    LLMRateLimiter
)

load_dotenv()

logger = logging.getLogger("verity.provider_manager")


class ProviderManager:
    """
    Orchestrates VERITY AI Text Detection using the primary trained VERITY PyTorch classifier
    (DistilRoBERTa + 20-D Stylometrics Fusion).
    """

    DEFAULT_FALLBACK_ORDER: List[str] = ["google", "nvidia", "groq", "openrouter"]
    _cache: Dict[str, Any] = {}

    @classmethod
    def get_primary_model_name(cls) -> str:
        return os.getenv("VERITY_PRIMARY_MODEL", os.getenv("VERITY_TRANSFORMER_MODEL", "distilroberta-base"))

    @classmethod
    def is_fallback_enabled(cls) -> bool:
        val = os.getenv("VERITY_FALLBACK_ENABLED", "false").strip().lower()
        return val in ("true", "1", "yes")

    @classmethod
    def get_fallback_provider_setting(cls) -> str:
        return os.getenv("VERITY_FALLBACK_PROVIDER", "auto").strip().lower()

    @classmethod
    def _get_ordered_providers(cls) -> List[BaseLLMProvider]:
        setting = cls.get_fallback_provider_setting()
        all_names = list(cls.DEFAULT_FALLBACK_ORDER)

        if setting != "auto" and setting in PROVIDERS_MAP:
            order = [setting] + [p for p in all_names if p != setting]
        else:
            order = LLMRateLimiter.get_rotated_provider_order(all_names)

        ready_providers: List[BaseLLMProvider] = []
        for name in order:
            if name in PROVIDERS_MAP:
                provider = PROVIDERS_MAP[name]
                if provider.is_available() and LLMRateLimiter.is_ready(name):
                    ready_providers.append(provider)

        return ready_providers

    @classmethod
    async def analyze(cls, text: str, detailed: bool = False) -> Dict[str, Any]:
        """
        Executes AI text analysis using the trained VERITY detector.
        If the trained detector is unavailable or fails, falls back to external LLM providers
        in order: Google -> Groq -> OpenRouter.
        """
        # Instant cache check
        cache_key = f"{detailed}:{hash(text)}"
        if cache_key in cls._cache:
            cached_data = dict(cls._cache[cache_key])
            cached_data["cached"] = True
            return cached_data

        from backend.ml.benchmarking import EngineBenchmarker

        selected_engine = EngineBenchmarker.get_selected_engine()
        logger.info(f"[ProviderManager] Routing request to engine: '{selected_engine}'")

        # ----------------------------------------------------------------------
        # PATH 1: Local Trained VERITY Classifier
        # ----------------------------------------------------------------------
        if selected_engine == "local_transformer":
            logger.info("[VERITY] Detection method: ML")
            res = cls._try_local_transformer(text)
            
            if res and res.get("status") == "success":
                engine_name = res.get("detection_engine", "local_transformer")
                ai_p = float(res.get("ai_probability", 0.5))

                if ai_p >= 0.85:
                    r_level = "Critical Risk"
                    r_color = "#EF4444"
                    r_desc = "Extreme probability of synthetic text generation with high structural uniformity."
                elif ai_p >= 0.65:
                    r_level = "Elevated Risk"
                    r_color = "#F59E0B"
                    r_desc = "Substantial AI generation markers detected across vocabulary and syntactic patterns."
                elif ai_p >= 0.40:
                    r_level = "Moderate / Mixed"
                    r_color = "#EAB308"
                    r_desc = "Mixed signals: possible human-AI co-writing or heavy automated paraphrasing."
                else:
                    r_level = "Low Risk"
                    r_color = "#A3E635"
                    r_desc = "Natural stylometric variance and human burstiness patterns verified."

                from backend.services.verification_service import VerificationService
                provenance = VerificationService.create_provenance_record(
                    text=text,
                    classification=res.get("classification", "Likely Human Written"),
                    ai_probability=ai_p,
                    model_version=engine_name
                )

                from backend.services.monitoring_service import MonitoringService
                MonitoringService.get_instance().record_request("analyze", latency_ms=80.0)

                res.update({
                    "selected_engine": selected_engine,
                    "actual_engine": engine_name,
                    "fallback_reason": res.get("fallback_reason"),
                    "detection_method": "ml",
                    "llm_provider": None,
                    "verification_id": provenance["verification_id"],
                    "provenance": provenance,
                    "risk_scoring": {
                        "risk_level": r_level,
                        "risk_color": r_color,
                        "risk_score": int(ai_p * 100),
                        "assessment": r_desc
                    }
                })
                
                if detailed:
                    chunks = chunk_text(text)[:6]
                    segments = []
                    for chunk in chunks:
                        chunk_res = cls._try_local_transformer(chunk)
                        if chunk_res and chunk_res.get("status") == "success":
                            segments.append({
                                "text": chunk,
                                "ai_probability": chunk_res.get("ai_probability"),
                                "human_probability": chunk_res.get("human_probability"),
                                "classification": chunk_res.get("classification")
                            })
                    if not segments and len(text.strip()) >= 50:
                        segments.append({
                            "text": text,
                            "ai_probability": res.get("ai_probability"),
                            "human_probability": res.get("human_probability"),
                            "classification": res.get("classification")
                        })
                    res["segments"] = segments

                if len(cls._cache) > 1000:
                    cls._cache.pop(next(iter(cls._cache)))
                cls._cache[cache_key] = res

                return res

            logger.warning("[VERITY] ML detector failed")
            
            # --- FALLBACK LOGIC ---
            if cls.is_fallback_enabled():
                fallback_providers = ["google", "groq", "openrouter"]
                for fallback_name in fallback_providers:
                    if fallback_name in PROVIDERS_MAP:
                        provider_cls = PROVIDERS_MAP[fallback_name]
                        if provider_cls.is_available() and LLMRateLimiter.is_ready(fallback_name):
                            try:
                                logger.info(f"[VERITY] Falling back to {fallback_name.capitalize()}")
                                llm_result = await provider_cls.analyze_text(text, timeout=5.0, retries=0)
                                if llm_result:
                                    logger.info(f"[VERITY] Detection method: LLM fallback")
                                    logger.info(f"[VERITY] Provider: {fallback_name.capitalize()}")
                                    
                                    # Attempt to get stylometrics, but don't crash if it fails
                                    try:
                                        stylometrics = StylometricExtractor.extract_features(text)
                                    except Exception as e:
                                        logger.warning(f"Stylometrics extraction failed during fallback: {e}")
                                        stylometrics = None
                                    
                                    return {
                                        "classification": llm_result["classification"],
                                        "ai_probability": llm_result["ai_probability"],
                                        "human_probability": llm_result["human_probability"],
                                        "confidence": llm_result["confidence"],
                                        "explanation": llm_result["explanation"],
                                        "stylometric_features": stylometrics,
                                        "provider": "local_transformer", # Keep original API contract
                                        "status": "success",
                                        "semantic_available": True,
                                        "detection_engine": "local_transformer",
                                        "selected_engine": selected_engine,
                                        "actual_engine": fallback_name,
                                        "fallback_reason": "ML detector failed, used LLM fallback",
                                        "detection_method": "llm_fallback",
                                        "llm_provider": fallback_name
                                    }
                            except Exception as e:
                                logger.warning(f"Fallback provider '{fallback_name}' exception: {e}")
            
            # If fallback is disabled or all fallbacks fail, or none were available
            if res and res.get("status") == "unavailable":
                raise HTTPException(
                    status_code=503,
                    detail="VERITY trained ML detector model is unavailable. Please execute backend/ml/train_verity.py first."
                )

            raise HTTPException(
                status_code=500,
                detail="VERITY local classifier failed during execution."
            )

        # ----------------------------------------------------------------------
        # PATH 2: External LLM Provider (ONLY if explicitly configured by benchmark selection)
        # ----------------------------------------------------------------------
        else:
            if selected_engine in PROVIDERS_MAP:
                provider_cls = PROVIDERS_MAP[selected_engine]
                if provider_cls.is_available() and LLMRateLimiter.is_ready(selected_engine):
                    try:
                        llm_result = await provider_cls.analyze_text(text, timeout=5.0, retries=1)
                        if llm_result:
                            stylometrics = StylometricExtractor.extract_features(text)
                            return {
                                "classification": llm_result["classification"],
                                "ai_probability": llm_result["ai_probability"],
                                "human_probability": llm_result["human_probability"],
                                "confidence": llm_result["confidence"],
                                "explanation": llm_result["explanation"],
                                "stylometric_features": stylometrics,
                                "provider": selected_engine,
                                "status": "success",
                                "semantic_available": True,
                                "detection_engine": selected_engine,
                                "selected_engine": selected_engine,
                                "actual_engine": selected_engine,
                                "fallback_reason": None,
                                "detection_method": "llm_fallback",
                                "llm_provider": selected_engine
                            }
                    except Exception as e:
                        logger.warning(f"Selected external provider '{selected_engine}' exception: {e}")

            # Fallback to local trained transformer
            local_res = cls._try_local_transformer(text)
            if local_res and local_res.get("status") == "success":
                local_res.update({
                    "selected_engine": selected_engine,
                    "actual_engine": "local_transformer",
                    "fallback_reason": f"External provider '{selected_engine}' failed at runtime",
                    "detection_method": "ml",
                    "llm_provider": None
                })
                return local_res

            raise HTTPException(
                status_code=503,
                detail=f"Engine '{selected_engine}' and trained VERITY detector are both unavailable."
            )

    @classmethod
    def _try_local_transformer(cls, text: str) -> Dict[str, Any]:
        """
        Runs prediction through trained FeatureFusionDetector (V2) or V5 ModernBERT.
        Explicitly tracks and exposes selected model vs active model with observable fallback.
        """
        model_name = cls.get_primary_model_name().lower()
        if "modernbert" in model_name or "v5" in model_name:
            try:
                from backend.ml.experimental.v5_inference import V5InferenceService
                service = V5InferenceService.get_instance()
                res = service.analyze(text)
                
                try:
                    stylo = StylometricExtractor.extract_features(text)
                except Exception:
                    stylo = None

                ai_prob = float(res["ai_probability"])
                diff = abs(ai_prob - res.get("threshold", 0.70))
                confidence = "High" if diff >= 0.25 else ("Medium" if diff >= 0.12 else "Low")

                return {
                    "classification": res["predicted_class"],
                    "ai_probability": ai_prob,
                    "human_probability": round(1.0 - ai_prob, 4),
                    "confidence": confidence,
                    "explanation": f"VERITY {res['model_version']} deep semantic-stylometric analysis ({confidence} confidence)",
                    "stylometric_features": stylo,
                    "provider": "local_transformer",
                    "status": "success",
                    "semantic_available": True,
                    "detection_engine": res["model_version"],
                    "model_version": res["model_version"],
                    "selected_model": "ModernBERT-V5",
                    "active_model": "ModernBERT-V5",
                    "fallback_reason": None,
                    "threshold": float(res.get("threshold", 0.70))
                }
            except Exception as e:
                logger.warning(f"V5 ModernBERT evaluation exception: {e}. Executing verified rollback to DistilRoBERTa-V2.")
                v2_res = FeatureFusionDetector.evaluate(text)
                if v2_res and v2_res.get("status") == "success":
                    v2_res.update({
                        "selected_model": "ModernBERT-V5",
                        "active_model": "DistilRoBERTa-V2",
                        "detection_engine": "DistilRoBERTa-V2 (Rollback)",
                        "fallback_reason": f"ModernBERT V5 unavailable: {str(e)}. Safe rollback to V2 activated.",
                        "threshold": float(v2_res.get("threshold", v2_res.get("locked_threshold", 0.50)))
                    })
                    return v2_res

        try:
            v2_res = FeatureFusionDetector.evaluate(text)
            if v2_res and v2_res.get("status") == "success":
                v2_res.update({
                    "selected_model": "DistilRoBERTa-V2",
                    "active_model": "DistilRoBERTa-V2",
                    "detection_engine": "DistilRoBERTa-V2",
                    "model_version": "V2",
                    "threshold": float(v2_res.get("threshold", v2_res.get("locked_threshold", 0.50)))
                })
            return v2_res
        except Exception as e:
            logger.warning(f"Local Transformer evaluation exception: {e}")
            return {
                "status": "unavailable",
                "error": str(e)
            }

    @classmethod
    async def analyze_document(
        cls,
        text: str,
        filename: str,
        file_type: str,
        detailed: bool = True
    ) -> Dict[str, Any]:
        """
        Processes long document text by bounded chunking, evaluates each chunk
        with the local detector, and computes aggregated document-level diagnostics.
        """
        from backend.ml.text_chunking import chunk_document_bounded

        chunks = chunk_document_bounded(text, max_chunk_chars=1500, min_chunk_chars=50, max_chunks=50)
        if not chunks:
            if len(text.strip()) >= 50:
                chunks = [text.strip()[:1500]]
            else:
                raise HTTPException(
                    status_code=400,
                    detail="Document text is too short for meaningful analysis (minimum 50 characters required)."
                )

        segments = []
        weighted_ai_sum = 0.0
        total_words = 0

        for idx, chunk in enumerate(chunks):
            chunk_words = max(1, len(chunk.split()))
            chunk_res = cls._try_local_transformer(chunk)
            if chunk_res and chunk_res.get("status") == "success":
                ai_p = float(chunk_res.get("ai_probability", 0.5))
                h_p = float(chunk_res.get("human_probability", round(1.0 - ai_p, 4)))
                classification = chunk_res.get("classification", "Likely Human Written")
                segments.append({
                    "segment_index": idx + 1,
                    "text": chunk,
                    "ai_probability": ai_p,
                    "human_probability": h_p,
                    "classification": classification,
                    "word_count": chunk_words
                })
                weighted_ai_sum += ai_p * chunk_words
                total_words += chunk_words

        if not segments:
            raise HTTPException(
                status_code=500,
                detail="Failed to evaluate document segments with the detector."
            )

        doc_ai_prob = round(weighted_ai_sum / max(1, total_words), 4)
        doc_human_prob = round(1.0 - doc_ai_prob, 4)

        # Model-specific calibrated threshold (0.70 for ModernBERT V5, 0.50 for DistilRoBERTa V2)
        active_model_setting = cls.get_primary_model_name().lower()
        if "modernbert" in active_model_setting or "v5" in active_model_setting:
            threshold = 0.70
        else:
            threshold = 0.50

        if doc_ai_prob >= threshold:
            doc_classification = "Likely AI Generated"
        else:
            doc_classification = "Likely Human Written"

        diff = abs(doc_ai_prob - threshold)
        if diff >= 0.25:
            confidence = "High"
        elif diff >= 0.12:
            confidence = "Medium"
        else:
            confidence = "Low"

        if doc_classification == "Likely AI Generated":
            explanation = (
                f"Multi-segment analysis across {len(segments)} sections of '{filename}' indicates "
                f"strong semantic and structural patterns consistent with AI generation ({confidence} confidence)."
            )
        else:
            explanation = (
                f"Multi-segment analysis across {len(segments)} sections of '{filename}' indicates "
                f"natural stylometric and semantic variations consistent with human authorship ({confidence} confidence)."
            )

        # Extract stylometrics on representative sample
        sample_for_stylo = text[:20000]
        try:
            stylometrics = StylometricExtractor.extract_features(sample_for_stylo)
        except Exception as e:
            logger.warning(f"Stylometrics extraction failed for document {filename}: {e}")
            stylometrics = None

        doc_word_count = len(text.split())
        doc_char_count = len(text)

        logger.info(
            f"[VERITY DIAGNOSTIC] analyze_document: filename='{filename}', file_type='{file_type}', "
            f"extracted_text_chars={doc_char_count}, extracted_text_words={doc_word_count}, "
            f"chunks_analyzed={len(segments)}, segments_words_sum={total_words}"
        )

        active_engine = segments[0].get("detection_engine", "local_transformer") if segments else "local_transformer"

        # Explainable Risk Scoring Matrix
        if doc_ai_prob >= 0.85:
            risk_level = "Critical Risk"
            risk_color = "#EF4444"
            risk_desc = "Extreme probability of synthetic text generation with high structural uniformity."
        elif doc_ai_prob >= 0.65:
            risk_level = "Elevated Risk"
            risk_color = "#F59E0B"
            risk_desc = "Substantial AI generation markers detected across vocabulary and syntactic patterns."
        elif doc_ai_prob >= 0.40:
            risk_level = "Moderate / Mixed"
            risk_color = "#EAB308"
            risk_desc = "Mixed signals: possible human-AI co-writing or heavy automated paraphrasing."
        else:
            risk_level = "Low Risk"
            risk_color = "#A3E635"
            risk_desc = "Natural stylometric variance and human burstiness patterns verified."

        from backend.services.verification_service import VerificationService
        provenance = VerificationService.create_provenance_record(
            text=text,
            classification=doc_classification,
            ai_probability=doc_ai_prob,
            model_version=active_engine,
            document_meta={
                "filename": filename,
                "file_type": file_type,
                "total_words": doc_word_count
            }
        )

        from backend.services.monitoring_service import MonitoringService
        MonitoringService.get_instance().record_request("analyze_document", latency_ms=100.0)

        result: Dict[str, Any] = {
            "classification": doc_classification,
            "ai_probability": doc_ai_prob,
            "human_probability": doc_human_prob,
            "threshold": threshold,
            "confidence": confidence,
            "explanation": explanation,
            "extracted_text": text,
            "segments": segments if detailed else [],
            "document_meta": {
                "filename": filename,
                "file_type": file_type,
                "total_words": doc_word_count,
                "total_characters": doc_char_count,
                "chunks_analyzed": len(segments)
            },
            "stylometric_features": stylometrics,
            "provider": "local_transformer",
            "status": "success",
            "semantic_available": True,
            "detection_engine": active_engine,
            "selected_engine": "local_transformer",
            "actual_engine": active_engine,
            "model_version": active_engine,
            "fallback_reason": segments[0].get("fallback_reason") if segments else None,
            "detection_method": "ml",
            "llm_provider": None,
            "verification_id": provenance["verification_id"],
            "provenance": provenance,
            "risk_scoring": {
                "risk_level": risk_level,
                "risk_color": risk_color,
                "risk_score": int(doc_ai_prob * 100),
                "assessment": risk_desc
            }
        }

        return result

