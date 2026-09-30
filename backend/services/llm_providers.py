import os
import httpx
import logging
from typing import Dict, Any, List
from backend.services.llm_provider import LLMRateLimiter

logger = logging.getLogger("verity.llm_providers")

class LLMProviderService:
    """
    Unified LLM Provider Abstraction supporting Google, NVIDIA, Groq, and OpenRouter APIs.
    Executes humanization and paraphrasing server-side using environment API keys with rate limiting,
    round-robin provider rotation, and automatic fallback.
    """

    HUMANIZER_SYSTEM_PROMPT = """You are an expert editor specializing in humanizing AI-generated text.
Your task is to rewrite the text to sound completely natural, engaging, and human-written while strictly adhering to these rules:
1. Preserve all original meanings, facts, numbers, dates, technical names, and citations.
2. Vary sentence structure, burstiness, and rhythm naturally.
3. Replace overly formal AI transition words (e.g. "moreover", "furthermore", "delve into the tapestry") with natural phrasing.
4. Return ONLY the humanized rewritten text. Do not include introductory or concluding commentary."""

    DEFAULT_PROVIDERS = ["google", "nvidia", "groq", "openrouter"]

    @staticmethod
    def get_available_providers() -> Dict[str, bool]:
        return {
            "google": bool(os.getenv("GOOGLE_API_KEY")),
            "nvidia": bool(os.getenv("NVIDIA_API_KEY")),
            "groq": bool(os.getenv("GROQ_API_KEY")),
            "openrouter": bool(os.getenv("OPENROUTER_API_KEY"))
        }

    @classmethod
    def _is_valid_rewrite(cls, output_text: str, input_text: str) -> bool:
        import re
        cleaned_out = output_text.strip()
        cleaned_in = input_text.strip()

        if not cleaned_out:
            return False

        out_words = [w.lower() for w in re.findall(r'\b[A-Za-z0-9\'-]+\b', cleaned_out)]
        in_words = [w.lower() for w in re.findall(r'\b[A-Za-z0-9\'-]+\b', cleaned_in)]

        if not out_words:
            return False

        # Reject only if normalized word sequence is 100% identical
        if out_words == in_words:
            return False

        return True

    @classmethod
    async def humanize_text(cls, text: str, provider: str = "auto") -> Dict[str, Any]:
        available = cls.get_available_providers()
        target_provider = provider.lower()

        # Build candidate provider execution chain with round-robin rotation
        if target_provider != "auto" and available.get(target_provider):
            candidates = [target_provider] + [p for p in cls.DEFAULT_PROVIDERS if p != target_provider]
        else:
            candidates = LLMRateLimiter.get_rotated_provider_order(cls.DEFAULT_PROVIDERS)

        result = None
        used_engine = "none"

        for p_name in candidates:
            if not available.get(p_name):
                continue

            # Check rate limiter status
            if not LLMRateLimiter.is_ready(p_name):
                logger.warning(f"[Humanizer] Provider '{p_name}' skipped: rate-limited or cooldown active.")
                continue

            logger.info(f"[Humanizer] Attempting text humanization via provider '{p_name}'...")
            try:
                raw_out = None
                if p_name == "groq":
                    raw_out = await cls._call_groq(text)
                elif p_name == "openrouter":
                    raw_out = await cls._call_openrouter(text)
                elif p_name == "google":
                    raw_out = await cls._call_google(text)
                elif p_name == "nvidia":
                    raw_out = await cls._call_nvidia(text)

                if raw_out:
                    import re
                    raw_out = re.sub(r'^```[a-z]*\n', '', raw_out.strip())
                    raw_out = re.sub(r'\n```$', '', raw_out).strip()
                    if raw_out.lower().startswith("here is"):
                        raw_out = '\n'.join(raw_out.split('\n')[1:]).strip()

                if raw_out and cls._is_valid_rewrite(raw_out, text):
                    LLMRateLimiter.record_request(p_name)
                    result = raw_out.strip()
                    used_engine = p_name
                    break
                else:
                    logger.warning(f"[Humanizer] Provider '{p_name}' returned unmodifying or invalid text. Trying next provider...")
            except httpx.HTTPStatusError as err:
                status_code = err.response.status_code if err.response else 0
                if status_code in (429, 403):
                    logger.warning(f"[Humanizer] Provider '{p_name}' returned HTTP {status_code} Rate Limit. Activating 60s cooldown.")
                    LLMRateLimiter.mark_rate_limited(p_name, cooldown_seconds=60.0)
                else:
                    logger.warning(f"[Humanizer] Provider '{p_name}' HTTP {status_code} error: {err}")
            except Exception as err:
                logger.warning(f"[Humanizer] Provider '{p_name}' error: {err}")

        # If external providers fail or return unchanged text, use Advanced Local Humanization Engine
        if not result:
            logger.info("[Humanizer] All configured external LLM providers failed or returned unmodifying text.")
            return {
                "error": "Humanization unavailable: All external AI paraphrasing engines failed to successfully rewrite the text.",
                "provider": "none"
            }

        return {
            "humanized_text": result,
            "provider": used_engine
        }

    @classmethod
    def _advanced_local_humanize(cls, text: str) -> str:
        """
        Advanced Local Humanization Transformation Engine.
        Varies sentence rhythm, removes AI jargon markers, restructures clauses,
        and applies human stylistic variations.
        """
        replacements = [
            (r"\bfurthermore,\b", "Also,"),
            (r"\bmoreover,\b", "What's more,"),
            (r"\bconsequently,\b", "As a result,"),
            (r"\bnevertheless,\b", "Still,"),
            (r"\bnonetheless,\b", "Even so,"),
            (r"\bin conclusion,\b", "Overall,"),
            (r"\bdelve into\b", "explore"),
            (r"\btestament to\b", "reflection of"),
            (r"\bparamount\b", "key"),
            (r"\bpivotal\b", "crucial"),
            (r"\butilize\b", "use"),
            (r"\boptimize\b", "improve"),
            (r"\bseamlessly\b", "smoothly"),
            (r"\bsignificantly\b", "notably"),
            (r"\bvarious\b", "different"),
            (r"\bhas transformed\b", "changed"),
            (r"\benables organizations to\b", "lets teams"),
            (r"\boperational efficiency\b", "day-to-day workflow"),
            (r"\bgenerate valuable insights\b", "find helpful patterns"),
            (r"\blarge amounts of data\b", "big datasets")
        ]

        import re
        res = text
        for pattern, replacement in replacements:
            res = re.sub(pattern, replacement, res, flags=re.IGNORECASE)

        # Clause structural shift if text contains multiple sentences
        sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', res) if s.strip()]
        if len(sentences) >= 2:
            # Reorder middle sentence phrasing to inject human burstiness
            s0 = sentences[0]
            s1 = sentences[1]
            if not s1.startswith(("Also", "What's more", "As a result", "Still")):
                sentences[1] = f"In practice, {s1[0].lower() + s1[1:] if len(s1) > 1 else s1}"
            res = " ".join(sentences)

        return res

    @classmethod
    async def _call_groq(cls, text: str) -> str:
        api_key = os.getenv("GROQ_API_KEY")
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "model": "openai/gpt-oss-120b",
                    "messages": [
                        {"role": "system", "content": cls.HUMANIZER_SYSTEM_PROMPT},
                        {"role": "user", "content": text}
                    ],
                    "temperature": 0.7
                }
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()

    @classmethod
    async def _call_openrouter(cls, text: str) -> str:
        api_key = os.getenv("OPENROUTER_API_KEY")
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "model": "google/gemini-2.5-flash",
                    "messages": [
                        {"role": "system", "content": cls.HUMANIZER_SYSTEM_PROMPT},
                        {"role": "user", "content": text}
                    ],
                    "temperature": 0.7
                }
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()

    @classmethod
    async def _call_google(cls, text: str) -> str:
        api_key = os.getenv("GOOGLE_API_KEY")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={api_key}"
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                url,
                json={
                    "contents": [{
                        "parts": [{"text": f"{cls.HUMANIZER_SYSTEM_PROMPT}\n\nText to humanize:\n{text}"}]
                    }]
                }
            )
            resp.raise_for_status()
            data = resp.json()
            return data["candidates"][0]["content"]["parts"][0]["text"].strip()

    @classmethod
    async def _call_nvidia(cls, text: str) -> str:
        api_key = os.getenv("NVIDIA_API_KEY")
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                "https://integrate.api.nvidia.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "model": "meta/llama2-70b",
                    "messages": [
                        {"role": "system", "content": cls.HUMANIZER_SYSTEM_PROMPT},
                        {"role": "user", "content": text}
                    ],
                    "temperature": 0.7
                }
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()

    @classmethod
    def _fallback_humanize(cls, text: str) -> str:
        replacements = {
            " furthermore,": " Also,",
            " moreover,": " What's more,",
            " consequently,": " As a result,",
            " nevertheless,": " Still,",
            " in conclusion,": " Overall,",
            " delve into": " explore",
            " testament to": " reflection of",
            " paramount": " key"
        }
        res = text
        for k, v in replacements.items():
            res = res.replace(k, v)
        return res
