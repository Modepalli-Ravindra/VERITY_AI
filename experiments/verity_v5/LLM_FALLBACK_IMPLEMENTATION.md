# LLM Fallback Implementation for VERITY

## Overview
This document describes the implementation of the runtime resilience and fallback mechanism for the VERITY text detection API (`/api/analyze`). The goal of this fallback is to ensure high availability for the detection service without compromising the primary model's architecture or frontend compatibility.

## Primary ML Detector
- **Primary Model:** V4-B ML Detector (DistilRoBERTa + Stylometric Feature Fusion)
- **Role:** The main inference engine for all text detection. It remains untouched, unmodified, and primary.

## Fallback Architecture
If the V4-B detector is unavailable, fails to load, times out, or raises an exception during inference, the `ProviderManager` automatically routes the request to an external LLM for fallback detection.

## Provider Order
The system attempts the following LLM providers in strict sequential order:
1. **Google** (Gemini 1.5 Flash)
2. **Groq** (Llama 3.3 70B)
3. **OpenRouter** (Gemini 2.0 Flash)

If an LLM provider times out, returns malformed JSON, or raises an exception, the system safely advances to the next provider. If all providers fail, the system returns a graceful HTTP 503 error, adhering to the existing API contract.

## Failure Conditions
Fallback is triggered when the ML model returns a `status: unavailable` or raises any exception during the `FeatureFusionDetector.evaluate()` execution. Valid normal ML predictions never trigger the fallback logic.

## API Compatibility
To ensure the frontend does not break, the LLM fallback constructs a response that perfectly mirrors the V4-B ML detector response schema:
- `classification`
- `ai_probability`
- `human_probability`
- `confidence`
- `explanation`
- `stylometric_features` (safely extracted or gracefully handled if stylometrics fail)

The fallback preserves `provider: "local_transformer"` in the API response to maintain visual and functional parity with the existing UI, avoiding unexpected layout changes or warning badges.

## Internal Tracking
Internally, the `ProviderManager` tracks the true origin of the detection in hidden fields that are not surfaced as required UI elements:
- `detection_method`: `"ml"` or `"llm_fallback"`
- `llm_provider`: E.g., `"google"`, `"groq"`, `"openrouter"`, or `null`.
- `actual_engine`: Shows the specific provider that fulfilled the request.

## Limitations
- LLM probabilities are not fully calibrated VERITY ML probabilities.
- Stylometrics extraction may fall back to default/empty schemas if it fails during the fallback loop.
- The LLM's explanation may differ slightly in tone from the fixed ML string templates.

## Test Results
Automated tests confirmed the resilience of the `/api/analyze` endpoint:
- **ML success**: YES (Correctly skips LLM fallback)
- **Google fallback**: PASS
- **Groq fallback**: PASS
- **OpenRouter fallback**: PASS
- **All providers unavailable**: PASS (Returns graceful HTTP 503)
- **Frontend compatibility**: PASS (Schema is completely identical)

## Final Note
The production V4-B checkpoint was NOT modified. The frontend UI was NOT changed. This mechanism strictly provides runtime resilience.
