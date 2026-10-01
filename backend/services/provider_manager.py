import os
import logging
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv
from fastapi import HTTPException

from backend.ml.stylometrics import StylometricExtractor
from backend.ml.fusion_model import FeatureFusionDetector
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
    async def analyze(cls, text: str) -> Dict[str, Any]:
        """
        Executes AI text analysis using the trained VERITY detector.
        If the trained detector is unavailable or fails, falls back to external LLM providers
        in order: Google -> Groq -> OpenRouter.
        """
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
                res.update({
                    "selected_engine": selected_engine,
                    "actual_engine": "local_transformer",
                    "fallback_reason": None,
                    "detection_method": "ml",
                    "llm_provider": None
                })
                return res

            logger.warning("[VERITY] ML detector failed")
            
            # --- FALLBACK LOGIC ---
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
                                    stylometrics = {
                                        "sentence_length": 0.0,
                                        "vocabulary_diversity": 0.0,
                                        "punctuation_score": 0.0,
                                        "pos_features": {"nouns": 0, "verbs": 0, "adjectives": 0, "transitions": 0},
                                        "stylometric_summary": "Features unavailable in fallback mode.",
                                        "word_count": 0,
                                        "character_count": 0,
                                        "feature_vector": [0.0] * 20
                                    }
                                
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
            
            # If all fallbacks fail, or none were available, raise HTTP 503
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
        Runs prediction through trained FeatureFusionDetector.
        """
        try:
            return FeatureFusionDetector.evaluate(text)
        except Exception as e:
            logger.warning(f"Local Transformer evaluation exception: {e}")
            return {
                "status": "unavailable",
                "error": str(e)
            }
