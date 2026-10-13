from fastapi import APIRouter, HTTPException, Request, Depends, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, Dict, Any
from backend.ml.fusion_model import FeatureFusionDetector
from backend.services.llm_providers import LLMProviderService
from backend.services.provider_manager import ProviderManager
from backend.services.document_parser import DocumentParser
from backend.api.auth import get_current_user
from backend.ml.experimental.v5_inference import V5InferenceService
import logging
from slowapi import Limiter
from slowapi.util import get_remote_address

logger = logging.getLogger("verity.router")
limiter = Limiter(key_func=get_remote_address)
router = APIRouter()

class TextAnalysisRequest(BaseModel):
    text: str
    detailed: bool = False

class HumanizeRequest(BaseModel):
    text: str
    provider: Optional[str] = "auto"
    tone: Optional[str] = "natural"
    mode: Optional[str] = None

@router.get("/health")
def health_check():
    return {"status": "ok", "service": "VERITY AI/ML Service"}

@router.get("/providers")
def get_providers():
    return {"providers": LLMProviderService.get_available_providers()}

@router.get("/transformer-status")
def get_transformer_status():
    from backend.ml.transformer_model import TransformerModelManager
    return TransformerModelManager.get_status()

@router.get("/llm-status")
def get_llm_status():
    from backend.services.llm_provider import LLMRateLimiter
    return LLMRateLimiter.get_status()

@router.get("/benchmark-status")
def get_benchmark_status():
    from backend.ml.benchmarking import EngineBenchmarker
    return EngineBenchmarker.get_status()

@router.post("/benchmark")
@limiter.limit("5/minute")
async def run_benchmark(request: Request, user=Depends(get_current_user)):
    from backend.ml.benchmarking import EngineBenchmarker
    results = await EngineBenchmarker.run_benchmark()
    return results

@router.post("/analyze")
@limiter.limit("20/minute")
async def analyze_text(req: TextAnalysisRequest, request: Request, user=Depends(get_current_user)):
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    if len(req.text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Text is too short for meaningful analysis (minimum 50 characters required).")
    if len(req.text) > 100000:
        raise HTTPException(status_code=400, detail="Text length exceeds 100,000 character limit.")
    
    if len(req.text) > 20000:
        result = await ProviderManager.analyze_document(
            text=req.text,
            filename="document.txt",
            file_type="txt",
            detailed=req.detailed
        )
        return result

    result = await ProviderManager.analyze(req.text, detailed=req.detailed)
    return result

@router.post("/analyze-file")
@limiter.limit("15/minute")
async def analyze_file(
    request: Request,
    file: UploadFile = File(...),
    detailed: bool = Form(True),
    user=Depends(get_current_user)
):
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file provided.")

    try:
        file_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read uploaded file: {str(e)}")

    extracted_text, file_type = DocumentParser.extract_text(file_bytes, file.filename)
    logger.info(
        f"[VERITY DIAGNOSTIC] analyze-file extracted: filename='{file.filename}', "
        f"file_type='{file_type}', chars={len(extracted_text)}, words={len(extracted_text.split())}"
    )
    result = await ProviderManager.analyze_document(
        text=extracted_text,
        filename=file.filename,
        file_type=file_type,
        detailed=detailed
    )
    return result

@router.post("/humanize")
@limiter.limit("60/minute")
async def humanize_text(req: HumanizeRequest, request: Request, user=Depends(get_current_user)):
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    if len(req.text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Text is too short (minimum 50 characters required).")
    if len(req.text) > 100000:
        raise HTTPException(status_code=400, detail="Text length exceeds 100,000 character limit.")

    # Map tone and backward-compatible mode
    selected_tone = req.tone or "natural"
    if req.mode and (not req.tone or req.tone == "natural"):
        mode_map = {
            "balanced": "natural",
            "formal": "professional",
            "academic": "academic",
            "casual": "casual"
        }
        selected_tone = mode_map.get(req.mode.lower(), selected_tone)

    res = await LLMProviderService.humanize_text(
        text=req.text,
        provider=req.provider or "auto",
        tone=selected_tone
    )
    return res

@router.post("/recheck")
@limiter.limit("20/minute")
async def recheck_text(req: TextAnalysisRequest, request: Request, user=Depends(get_current_user)):
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    if len(req.text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Text is too short for meaningful analysis (minimum 50 characters required).")
    if len(req.text) > 100000:
        raise HTTPException(status_code=400, detail="Text length exceeds 100,000 character limit.")
    
    if len(req.text) > 20000:
        result = await ProviderManager.analyze_document(
            text=req.text,
            filename="recheck_document.txt",
            file_type="txt",
            detailed=False
        )
        return result

    result = await ProviderManager.analyze(req.text)
    return result

@router.post("/experimental/v5/analyze")
@limiter.limit("20/minute")
async def analyze_v5(req: TextAnalysisRequest, request: Request, user=Depends(get_current_user)):
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    if len(req.text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Text is too short for meaningful analysis (minimum 50 characters required).")
    if len(req.text) > 20000:
        raise HTTPException(status_code=400, detail="Text length exceeds 20,000 character limit.")
        
    try:
        service = V5InferenceService.get_instance()
        return service.analyze(req.text)
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=f"Experimental V5 model is unavailable: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail="Experimental V5 inference engine encountered an error.")

class ModelSelectionRequest(BaseModel):
    model: str  # 'distilroberta-base' or 'modernbert'

@router.get("/models")
def get_model_registry():
    import os
    from backend.services.provider_manager import ProviderManager
    active = ProviderManager.get_primary_model_name()
    return {
        "active_model": active,
        "available_models": [
            {
                "id": "distilroberta-base",
                "name": "VERITY DistilRoBERTa V2 + Stylometrics",
                "version": "V2 Production",
                "architecture": "DistilRoBERTa (768-D) + 20-D Stylometric Fusion -> 320-D Classifier",
                "checkpoint": "backend/models/verity_detector_v2/best_model.pt",
                "status": "active" if "modernbert" not in active.lower() and "v5" not in active.lower() else "standby",
                "threshold": 0.50,
                "in_domain_f1": 1.0,
                "out_of_domain_f1": 0.875,
                "latency_cpu_ms": 496.0
            },
            {
                "id": "modernbert",
                "name": "VERITY ModernBERT V5 + Stylometrics",
                "version": "V5 Advanced",
                "architecture": "ModernBERT-base (768-D, 1024 seq) + 20-D Stylometric Fusion -> 320-D Classifier",
                "checkpoint": "backend/ml/experimental/model/best_model.pt",
                "status": "active" if ("modernbert" in active.lower() or "v5" in active.lower()) else "standby",
                "threshold": 0.70,
                "in_domain_f1": 0.998,
                "out_of_domain_f1": 0.645,
                "latency_cpu_ms": 2500.0,
                "notice": "Trained on HC3 in-domain dataset. Evaluated on RAID 20K."
            }
        ],
        "rollback_target": "distilroberta-base"
    }

@router.post("/models/select")
def select_model(req: ModelSelectionRequest, user=Depends(get_current_user)):
    import os
    selected = req.model.strip().lower()
    if selected in ["modernbert", "v5", "v5-modernbert"]:
        # Validate that V5 checkpoint and scaler are loadable before switching
        try:
            from backend.ml.experimental.v5_inference import V5InferenceService
            V5InferenceService.get_instance()
            os.environ["VERITY_PRIMARY_MODEL"] = "modernbert"
            return {"status": "success", "active_model": "modernbert", "message": "Primary detection engine switched to ModernBERT V5."}
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Cannot switch to ModernBERT V5: {str(e)}")
    elif selected in ["distilroberta-base", "v2", "v4b", "default"]:
        os.environ["VERITY_PRIMARY_MODEL"] = "distilroberta-base"
        return {"status": "success", "active_model": "distilroberta-base", "message": "Primary detection engine set to DistilRoBERTa V2."}
    else:
        raise HTTPException(status_code=400, detail=f"Unknown model identifier '{req.model}'. Supported: 'distilroberta-base', 'modernbert'.")

@router.get("/monitoring")
def get_monitoring_metrics():
    from backend.services.monitoring_service import MonitoringService
    return MonitoringService.get_instance().get_metrics()

@router.get("/datasets")
def get_datasets():
    from backend.services.monitoring_service import MonitoringService
    return MonitoringService.get_dataset_registry()

@router.get("/verify/{verification_id}")
def verify_record(verification_id: str):
    from backend.services.verification_service import VerificationService
    record = VerificationService.get_public_verification(verification_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Verification record '{verification_id}' not found.")
    return record

class FingerprintRequest(BaseModel):
    original_text: str
    transformed_text: str

@router.post("/transformation/fingerprint")
def get_transformation_fingerprint(req: FingerprintRequest):
    if not req.original_text or not req.transformed_text:
        raise HTTPException(status_code=400, detail="Both original_text and transformed_text are required.")
    from backend.services.verification_service import VerificationService
    return VerificationService.compute_transformation_fingerprint(req.original_text, req.transformed_text)

class IntelligenceGraphRequest(BaseModel):
    document_name: str
    analysis_result: Dict[str, Any]
    humanized_result: Optional[Dict[str, Any]] = None
    verification_id: Optional[str] = None

@router.post("/intelligence-graph")
def get_intelligence_graph(req: IntelligenceGraphRequest):
    from backend.services.verification_service import VerificationService
    return VerificationService.generate_intelligence_graph(
        document_name=req.document_name,
        analysis_result=req.analysis_result,
        humanized_result=req.humanized_result,
        verification_id=req.verification_id
    )

