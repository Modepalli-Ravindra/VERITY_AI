import os
import sys
import asyncio
from typing import Dict, Any, Optional
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.services.provider_manager import ProviderManager
from backend.services.llm_provider import PROVIDERS_MAP, LLMRateLimiter
from fastapi import HTTPException

# Store original methods to restore them later
orig_try_local_transformer = ProviderManager._try_local_transformer

orig_execute = {}
for name, p in PROVIDERS_MAP.items():
    orig_execute[name] = p._execute_request

async def test_fallback():
    print("Starting LLM Fallback Tests...")
    
    # Enable all fallback providers for testing by overriding is_available
    orig_is_available = {}
    for name, p in PROVIDERS_MAP.items():
        orig_is_available[name] = p.is_available
        p.is_available = classmethod(lambda cls: True)
    
    # Clean rate limits
    LLMRateLimiter._cooldown_until = {}

    def mock_local_success(text: str) -> Dict[str, Any]:
        return {
            "status": "success",
            "classification": "Likely AI Generated",
            "ai_probability": 0.95,
            "human_probability": 0.05,
            "confidence": "High",
            "explanation": "ML prediction",
        }
        
    def mock_local_failure(text: str) -> Dict[str, Any]:
        return {
            "status": "unavailable",
            "error": "Model not found"
        }

    async def mock_execute_success(text: str, timeout: float) -> Optional[Dict[str, Any]]:
        return {
            "classification": "Likely AI Generated",
            "ai_probability": 0.9,
            "human_probability": 0.1,
            "confidence": "High",
            "explanation": "LLM output"
        }
        
    async def mock_execute_failure(text: str, timeout: float) -> Optional[Dict[str, Any]]:
        raise Exception("Simulated timeout/failure")
        
    async def mock_execute_invalid_json(text: str, timeout: float) -> Optional[Dict[str, Any]]:
        from backend.services.llm_provider import parse_llm_json_response
        return parse_llm_json_response("This is not JSON") # Will return None
        
    def set_provider_mock(provider_name: str, mock_func):
        PROVIDERS_MAP[provider_name]._execute_request = classmethod(lambda cls, text, timeout: mock_func(text, timeout))

    # Test 1 & 8: ML success -> ML result returned, LLMs NOT called
    ProviderManager._try_local_transformer = classmethod(lambda cls, t: mock_local_success(t))
    # If LLMs are called, this will raise
    for p in PROVIDERS_MAP:
        set_provider_mock(p, mock_execute_failure)
    
    res1 = await ProviderManager.analyze("Test")
    assert res1["detection_method"] == "ml"
    assert res1["llm_provider"] is None
    print("Test 1 & 8 Passed: ML success")

    # Test 2: ML fails -> Google fallback
    ProviderManager._try_local_transformer = classmethod(lambda cls, t: mock_local_failure(t))
    set_provider_mock("google", mock_execute_success)
    
    res2 = await ProviderManager.analyze("Test")
    assert res2["detection_method"] == "llm_fallback"
    assert res2["llm_provider"] == "google"
    assert res2["actual_engine"] == "google"
    print("Test 2 Passed: ML load failure -> Google fallback")

    # Test 3 & 7: Google failure (timeout) -> Groq fallback
    set_provider_mock("google", mock_execute_failure)
    set_provider_mock("groq", mock_execute_success)
    
    res3 = await ProviderManager.analyze("Test")
    assert res3["detection_method"] == "llm_fallback"
    assert res3["llm_provider"] == "groq"
    print("Test 3 & 7 Passed: Google failure -> Groq fallback")

    # Test 4: Google + Groq failure -> OpenRouter fallback
    set_provider_mock("groq", mock_execute_failure)
    set_provider_mock("openrouter", mock_execute_success)
    
    res4 = await ProviderManager.analyze("Test")
    assert res4["detection_method"] == "llm_fallback"
    assert res4["llm_provider"] == "openrouter"
    print("Test 4 Passed: Google + Groq failure -> OpenRouter fallback")
    
    # Test 6: Invalid LLM JSON
    set_provider_mock("google", mock_execute_invalid_json)
    set_provider_mock("groq", mock_execute_invalid_json)
    set_provider_mock("openrouter", mock_execute_success) # Should fall through to here
    
    res6 = await ProviderManager.analyze("Test")
    assert res6["llm_provider"] == "openrouter"
    print("Test 6 Passed: Invalid LLM JSON -> next provider attempted")

    # Test 5: All providers failure -> HTTP 503
    set_provider_mock("openrouter", mock_execute_failure)
    try:
        await ProviderManager.analyze("Test")
        assert False, "Should have raised exception"
    except HTTPException as e:
        assert e.status_code == 503
        print("Test 5 Passed: All providers failure -> graceful error")
        
    print("All backend tests passed successfully!")

if __name__ == "__main__":
    asyncio.run(test_fallback())
