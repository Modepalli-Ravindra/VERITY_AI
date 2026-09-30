from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, Dict, Any
from backend.ml.fusion_model import FeatureFusionDetector
from backend.services.llm_providers import LLMProviderService
from backend.services.provider_manager import ProviderManager
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()

class TextAnalysisRequest(BaseModel):
    text: str

class HumanizeRequest(BaseModel):
    text: str
    provider: Optional[str] = "auto"

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
async def run_benchmark(request: Request):
    from backend.ml.benchmarking import EngineBenchmarker
    results = await EngineBenchmarker.run_benchmark()
    return results

@router.post("/analyze")
@limiter.limit("20/minute")
async def analyze_text(req: TextAnalysisRequest, request: Request):
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    if len(req.text) > 20000:
        raise HTTPException(status_code=400, detail="Text length exceeds 20,000 character limit.")
    
    result = await ProviderManager.analyze(req.text)
    return result

@router.post("/humanize")
@limiter.limit("15/minute")
async def humanize_text(req: HumanizeRequest, request: Request):
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    if len(req.text) > 15000:
        raise HTTPException(status_code=400, detail="Text length exceeds 15,000 character limit.")

    res = await LLMProviderService.humanize_text(req.text, req.provider or "auto")
    return res

@router.post("/recheck")
async def recheck_text(req: TextAnalysisRequest):
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    
    result = await ProviderManager.analyze(req.text)
    return result

