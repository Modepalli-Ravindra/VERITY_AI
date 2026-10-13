import os
import re
import httpx
import logging
from typing import Dict, Any, List, Optional
from backend.services.llm_provider import LLMRateLimiter

logger = logging.getLogger("verity.llm_providers")

def _sanitize_log(msg: str) -> str:
    if not msg:
        return ""
    # Redact query params with keys
    msg = re.sub(r"key=[A-Za-z0-9_-]+", "key=[REDACTED]", msg)
    msg = re.sub(r"Bearer\s+[A-Za-z0-9._-]+", "Bearer [REDACTED]", msg)
    msg = re.sub(r"x-goog-api-key['\":\s]+[A-Za-z0-9._-]+", "x-goog-api-key: [REDACTED]", msg)
    return msg


class LLMProviderService:
    """
    Unified LLM Provider Abstraction supporting Google, NVIDIA, Groq, OpenRouter APIs,
    and Advanced Local Transformation Engine.
    Supports 4 distinct tone profiles: Natural, Professional, Academic, Casual.
    Strictly preserves core factual meaning, proper nouns, figures, technical terms, and citations.
    """

    TONE_DESCRIPTIONS = {
        "natural": (
            "Tone: NATURAL (Default).\n"
            "Style: Organic cadence, varied sentence length and burstiness, and conversational rhythm.\n"
            "Action: Eliminate robotic transitions (e.g. 'furthermore', 'moreover', 'delve into the tapestry', 'in conclusion', 'testament to')."
        ),
        "professional": (
            "Tone: PROFESSIONAL.\n"
            "Style: Crisp, authoritative, concise, and business-focused.\n"
            "Action: Maintain an executive, clear register. Eliminate conversational filler, verbose jargon, and robotic filler."
        ),
        "academic": (
            "Tone: ACADEMIC.\n"
            "Style: Scholarly, rigorous, objective, and analytical.\n"
            "Action: Use precise disciplinary vocabulary and syntactically balanced sentence structures. Avoid clichéd AI markers."
        ),
        "casual": (
            "Tone: CASUAL.\n"
            "Style: Approachable, friendly, colloquial, and relaxed.\n"
            "Action: Use accessible peer-to-peer phrasing, relaxed sentence rhythms, and everyday wording while keeping facts intact."
        ),
    }

    DEFAULT_PROVIDERS = ["groq", "nvidia", "openrouter", "google"]
    _cache: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def get_system_prompt(cls, tone: str = "natural") -> str:
        tone_key = (tone or "natural").lower().strip()
        if tone_key not in cls.TONE_DESCRIPTIONS:
            tone_key = "natural"

        tone_guidance = cls.TONE_DESCRIPTIONS[tone_key]
        return (
            "You are an expert text rewriting and humanization engine.\n"
            "Your task is to rewrite the input text according to the target tone while strictly observing these constraints:\n"
            "1. FACTUAL PRESERVATION: Strictly preserve all original core meanings, facts, numbers, dates, proper names, and technical terms. Do not invent facts.\n"
            "2. TONE ADAPTATION:\n"
            f"{tone_guidance}\n"
            "3. NO ROBOTIC CLICHÉS: Eliminate repetitive, generic AI transitional tropes (e.g. 'delve into', 'tapestry of', 'moreover', 'in conclusion').\n"
            "4. OUTPUT FORMAT: Return ONLY the transformed text. Do NOT include preambles, introductory commentary, or concluding notes."
        )

    @staticmethod
    def get_available_providers() -> Dict[str, bool]:
        return {
            "google": bool(os.getenv("GOOGLE_API_KEY")),
            "nvidia": bool(os.getenv("NVIDIA_API_KEY")),
            "groq": bool(os.getenv("GROQ_API_KEY")),
            "openrouter": bool(os.getenv("OPENROUTER_API_KEY"))
        }

    @classmethod
    def _is_structural_or_factual(cls, text: str) -> bool:
        """
        Detects whether a section consists of headings, outlines, lists, tables,
        mathematical formulas, code blocks, or technical definitions.
        """
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        if not lines:
            return True

        structural_lines = 0
        for line in lines:
            # Markdown headings (# H1, ## H2, etc.)
            if re.match(r'^#{1,6}\s+', line):
                structural_lines += 1
            # Numbered list or section (1., 1.1, 26., etc.)
            elif re.match(r'^\d+(\.\d+)*\.?\s+', line):
                structural_lines += 1
            # Bullet lists (-, *, •)
            elif re.match(r'^[-*•]\s+', line):
                structural_lines += 1
            # Tables (| ... |)
            elif line.startswith("|") or line.endswith("|"):
                structural_lines += 1
            # Formulas, mathematical arrows, inequalities, logic equations
            elif any(sym in line for sym in ["→", "≥", "≤", "==", "=>", "->", "±", "≠"]):
                structural_lines += 1
            # Short section title / definition (e.g. "Dense Layer — 768 → 256", "Threshold:")
            elif len(line) < 40 and (line.endswith(":") or "—" in line or "-" in line):
                structural_lines += 1

        ratio = structural_lines / max(1, len(lines))
        return ratio >= 0.30 or any(sym in text for sym in ["→", "≥", "≤", "=="])

    @classmethod
    def _is_valid_rewrite(cls, output_text: str, input_text: str, allow_identical: bool = False) -> bool:
        cleaned_out = output_text.strip()
        cleaned_in = input_text.strip()

        if not cleaned_out:
            return False

        out_words = [w.lower() for w in re.findall(r"\b[A-Za-z0-9'-]+\b", cleaned_out)]
        in_words = [w.lower() for w in re.findall(r"\b[A-Za-z0-9'-]+\b", cleaned_in)]

        if not out_words:
            return False

        # Reject severely truncated rewrites (output must have at least 50% of input word count for non-trivial inputs)
        if len(in_words) >= 20 and len(out_words) < len(in_words) * 0.5:
            return False

        # Reject if normalized word sequence is 100% identical, unless identical preservation is explicitly allowed (e.g. structural outlines/lists)
        if not allow_identical and out_words == in_words:
            return False

        return True

    @classmethod
    async def humanize_text(
        cls,
        text: str,
        provider: str = "auto",
        tone: str = "natural",
        allow_local_fallback: bool = True
    ) -> Dict[str, Any]:
        """
        Executes text humanization with specified tone and provider fallback.
        """
        normalized_tone = (tone or "natural").lower().strip()
        if normalized_tone not in cls.TONE_DESCRIPTIONS:
            normalized_tone = "natural"

        # Check LRU Cache for Instant (0ms) response
        cache_key = f"{normalized_tone}:{provider}:{hash(text.strip())}"
        if cache_key in cls._cache:
            logger.info("[Humanizer] Returning cached humanization result (0ms).")
            cached_data = dict(cls._cache[cache_key])
            cached_data["cached"] = True
            return cached_data

        # For long multi-paragraph documents, split along paragraph boundaries and process concurrently
        if len(text) > 3500:
            raw_paras = [p for p in text.split("\n\n") if p.strip()]
            if len(raw_paras) > 1:
                chunks = []
                curr_group = []
                curr_chars = 0
                for p in raw_paras:
                    p_len = len(p)
                    if curr_chars + p_len + 2 > 2500 and curr_group:
                        chunks.append("\n\n".join(curr_group))
                        curr_group = [p]
                        curr_chars = p_len
                    else:
                        curr_group.append(p)
                        curr_chars += p_len + 2
                if curr_group:
                    chunks.append("\n\n".join(curr_group))

                if len(chunks) > 1:
                    logger.info(f"[Humanizer] Processing long document in {len(chunks)} bounded sections concurrently.")
                    import asyncio
                    sub_results = await asyncio.gather(*[
                        cls.humanize_text(
                            chunk,
                            provider=provider,
                            tone=normalized_tone,
                            allow_local_fallback=allow_local_fallback
                        )
                        for chunk in chunks
                    ])
                    transformed_chunks = []
                    active_provider = "local_engine"
                    for idx, sub_res in enumerate(sub_results):
                        if sub_res.get("error"):
                            logger.error(f"[Humanizer] Transformation failed at chunk {idx + 1}/{len(chunks)}: {sub_res.get('error')}")
                            return {
                                "error": f"Transformation failed at section {idx + 1} of {len(chunks)}: {sub_res.get('error')}",
                                "provider": "none",
                                "tone": normalized_tone
                            }
                        transformed_chunks.append(sub_res.get("humanized_text", chunks[idx]))
                        if sub_res.get("provider") and sub_res.get("provider") != "none":
                            active_provider = sub_res.get("provider")

                    combined_res = {
                        "humanized_text": "\n\n".join(transformed_chunks),
                        "provider": active_provider,
                        "tone": normalized_tone
                    }
                    if len(cls._cache) > 500:
                        cls._cache.pop(next(iter(cls._cache)))
                    cls._cache[cache_key] = combined_res
                    return combined_res

        available = cls.get_available_providers()
        target_provider = (provider or "auto").lower().strip()

        # Build candidate provider execution chain with round-robin rotation
        if target_provider != "auto" and target_provider != "none" and available.get(target_provider):
            candidates = [target_provider] + [p for p in cls.DEFAULT_PROVIDERS if p != target_provider]
        elif target_provider == "none":
            candidates = []
        else:
            candidates = LLMRateLimiter.get_rotated_provider_order(cls.DEFAULT_PROVIDERS)

        result = None
        used_engine = "none"
        diagnostics = []

        for p_name in candidates:
            if not available.get(p_name):
                continue

            # Check rate limiter status
            if not LLMRateLimiter.is_ready(p_name):
                logger.warning(f"[Humanizer] Provider '{p_name}' skipped: rate-limited or cooldown active.")
                diagnostics.append({
                    "provider": p_name,
                    "error_category": "rate_limited_or_cooling_down",
                    "status_code": 429,
                    "retry_count": 0
                })
                continue

            # Try provider with bounded retry for transient errors
            max_provider_attempts = 2
            for attempt in range(max_provider_attempts):
                logger.info(f"[Humanizer] Attempting text humanization via provider '{p_name}' (Tone: {normalized_tone}, Attempt {attempt + 1}/{max_provider_attempts})...")
                try:
                    raw_out = None
                    if p_name == "groq":
                        raw_out = await cls._call_groq(text, normalized_tone)
                    elif p_name == "openrouter":
                        raw_out = await cls._call_openrouter(text, normalized_tone)
                    elif p_name == "google":
                        raw_out = await cls._call_google(text, normalized_tone)
                    elif p_name == "nvidia":
                        raw_out = await cls._call_nvidia(text, normalized_tone)

                    if raw_out:
                        raw_out = re.sub(r"^```[a-z]*\n", "", raw_out.strip())
                        raw_out = re.sub(r"\n```$", "", raw_out).strip()
                        if raw_out.lower().startswith("here is"):
                            raw_out = "\n".join(raw_out.split("\n")[1:]).strip()

                    if raw_out and cls._is_valid_rewrite(raw_out, text):
                        LLMRateLimiter.record_request(p_name)
                        result = raw_out.strip()
                        used_engine = p_name
                        break
                    else:
                        logger.warning(f"[Humanizer] Provider '{p_name}' returned unmodifying text. Attempt {attempt + 1} rejected.")
                        diagnostics.append({
                            "provider": p_name,
                            "error_category": "unmodifying_rewrite_rejected",
                            "status_code": 200,
                            "retry_count": attempt + 1
                        })
                except httpx.HTTPStatusError as err:
                    status_code = err.response.status_code if err.response else 0
                    sanitized_err = _sanitize_log(str(err))
                    retry_after_hdr = err.response.headers.get("retry-after") if err.response else None
                    cooldown = 10.0
                    if retry_after_hdr:
                        try:
                            cooldown = min(60.0, max(2.0, float(retry_after_hdr)))
                        except ValueError:
                            pass

                    diagnostics.append({
                        "provider": p_name,
                        "error_category": f"http_{status_code}",
                        "status_code": status_code,
                        "retry_count": attempt + 1
                    })

                    if status_code in (400, 401, 403):
                        # Permanent authentication or invalid key configuration: break immediately and activate provider cooldown
                        logger.warning(f"[Humanizer] Provider '{p_name}' HTTP {status_code} Auth/Config failure. Putting provider in cooldown.")
                        LLMRateLimiter.mark_rate_limited(p_name, cooldown_seconds=600.0)
                        diagnostics.append({
                            "provider": p_name,
                            "error_category": "auth_or_config_error",
                            "status_code": status_code,
                            "retry_count": attempt + 1
                        })
                        break
                    elif status_code == 429:
                        # Rate limit: respect Retry-After header and activate cooldown
                        logger.warning(f"[Humanizer] Provider '{p_name}' HTTP 429 Rate Limit. Activating {cooldown}s cooldown.")
                        LLMRateLimiter.mark_rate_limited(p_name, cooldown_seconds=cooldown)
                        diagnostics.append({
                            "provider": p_name,
                            "error_category": "rate_limited",
                            "status_code": 429,
                            "retry_count": attempt + 1
                        })
                        break
                    else:
                        # Transient 5xx server error: bounded exponential backoff
                        logger.warning(f"[Humanizer] Provider '{p_name}' HTTP {status_code} error on attempt {attempt + 1}: {sanitized_err}")
                        if attempt < max_provider_attempts - 1:
                            import asyncio
                            await asyncio.sleep(1.0 * (attempt + 1))
                        else:
                            LLMRateLimiter.mark_rate_limited(p_name, cooldown_seconds=60.0)
                except Exception as err:
                    sanitized_err = _sanitize_log(str(err))
                    diagnostics.append({
                        "provider": p_name,
                        "error_category": "network_or_timeout",
                        "status_code": 0,
                        "retry_count": attempt + 1
                    })
                    logger.warning(f"[Humanizer] Provider '{p_name}' error on attempt {attempt + 1}: {sanitized_err}")
                    if attempt < max_provider_attempts - 1:
                        import asyncio
                        await asyncio.sleep(1.0 * (attempt + 1))
                    else:
                        LLMRateLimiter.mark_rate_limited(p_name, cooldown_seconds=60.0)

            if result:
                break

        # If external providers were unavailable or failed:
        if not result:
            is_structural = cls._is_structural_or_factual(text)
            if is_structural:
                logger.info("[Humanizer] Preserving structural/factual section intact without synthetic rewrite.")
                return {
                    "humanized_text": text.strip(),
                    "provider": "preserved",
                    "preserved": True,
                    "tone": normalized_tone,
                    "diagnostics": diagnostics
                }

            if allow_local_fallback and target_provider != "none":
                logger.info(f"[Humanizer] Activating Advanced Local Humanization Engine (Tone: {normalized_tone}).")
                local_out = cls._advanced_local_humanize(text, tone=normalized_tone)
                if local_out and cls._is_valid_rewrite(local_out, text, allow_identical=False):
                    return {
                        "humanized_text": local_out,
                        "provider": "local_engine",
                        "tone": normalized_tone,
                        "diagnostics": diagnostics
                    }

            logger.info("[Humanizer] All configured external LLM providers and fallbacks failed on prose section.")
            return {
                "error": "Transformation unavailable: All external AI paraphrasing engines failed to successfully rewrite this section.",
                "provider": "none",
                "tone": normalized_tone,
                "diagnostics": diagnostics
            }

        import unicodedata
        normalized_result = unicodedata.normalize('NFKC', result).strip()

        final_res = {
            "humanized_text": normalized_result,
            "provider": used_engine,
            "tone": normalized_tone
        }
        if len(cls._cache) > 500:
            cls._cache.pop(next(iter(cls._cache)))
        cls._cache[cache_key] = final_res

        return final_res

    @classmethod
    def _advanced_local_humanize(cls, text: str, tone: str = "natural") -> str:
        """
        Advanced Local Humanization Transformation Engine with tone-specific profiles.
        Preserves all proper nouns, numbers, technical terms, and dates.
        """
        tone_key = (tone or "natural").lower().strip()

        # Tone-specific replacement rules
        if tone_key == "professional":
            replacements = [
                (r"\bfurthermore,\b", "Additionally,"),
                (r"\bmoreover,\b", "In addition,"),
                (r"\bconsequently,\b", "Accordingly,"),
                (r"\bnevertheless,\b", "However,"),
                (r"\bnonetheless,\b", "Regardless,"),
                (r"\bin conclusion,\b", "In summary,"),
                (r"\bdelve into\b", "examine"),
                (r"\btapestry of\b", "framework of"),
                (r"\btestament to\b", "demonstration of"),
                (r"\bparamount\b", "critical"),
                (r"\bpivotal\b", "central"),
                (r"\butilize\b", "employ"),
                (r"\boptimize\b", "streamline"),
                (r"\bseamlessly\b", "effectively"),
                (r"\bsignificantly\b", "substantially"),
                (r"\bvarious\b", "multiple"),
                (r"\bhas transformed\b", "modernized"),
                (r"\benables organizations to\b", "empowers enterprises to"),
                (r"\boperational efficiency\b", "operational performance"),
                (r"\bgenerate valuable insights\b", "produce actionable insights"),
                (r"\blarge amounts of data\b", "enterprise data assets"),
                (r"\brobotic\b", "automated")
            ]
        elif tone_key == "academic":
            replacements = [
                (r"\bfurthermore,\b", "Further,"),
                (r"\bmoreover,\b", "In conjunction,"),
                (r"\bconsequently,\b", "Consequently,"),
                (r"\bnevertheless,\b", "Nonetheless,"),
                (r"\bnonetheless,\b", "Notwithstanding,"),
                (r"\bin conclusion,\b", "To conclude,"),
                (r"\bdelve into\b", "investigate"),
                (r"\btapestry of\b", "complex structure of"),
                (r"\btestament to\b", "clear indication of"),
                (r"\bparamount\b", "fundamental"),
                (r"\bpivotal\b", "decisive"),
                (r"\butilize\b", "apply"),
                (r"\boptimize\b", "enhance"),
                (r"\bseamlessly\b", "systematically"),
                (r"\bsignificantly\b", "markedly"),
                (r"\bvarious\b", "diverse"),
                (r"\bhas transformed\b", "substantially altered"),
                (r"\benables organizations to\b", "permits researchers and practitioners to"),
                (r"\boperational efficiency\b", "systemic efficacy"),
                (r"\bgenerate valuable insights\b", "derive empirical observations"),
                (r"\blarge amounts of data\b", "extensive corpora"),
                (r"\brobotic\b", "mechanistic")
            ]
        elif tone_key == "casual":
            replacements = [
                (r"\bfurthermore,\b", "Plus,"),
                (r"\bmoreover,\b", "On top of that,"),
                (r"\bconsequently,\b", "So,"),
                (r"\bnevertheless,\b", "Still,"),
                (r"\bnonetheless,\b", "Even so,"),
                (r"\bin conclusion,\b", "All in all,"),
                (r"\bdelve into\b", "check out"),
                (r"\btapestry of\b", "mix of"),
                (r"\btestament to\b", "good sign of"),
                (r"\bparamount\b", "super important"),
                (r"\bpivotal\b", "key"),
                (r"\butilize\b", "use"),
                (r"\boptimize\b", "fine-tune"),
                (r"\bseamlessly\b", "without friction"),
                (r"\bsignificantly\b", "a lot"),
                (r"\bvarious\b", "plenty of"),
                (r"\bhas transformed\b", "shook up"),
                (r"\benables organizations to\b", "lets people"),
                (r"\boperational efficiency\b", "day-to-day work"),
                (r"\bgenerate valuable insights\b", "spot neat takeaways"),
                (r"\blarge amounts of data\b", "tons of data"),
                (r"\brobotic\b", "stiff")
            ]
        else:  # Natural
            replacements = [
                (r"\bfurthermore,\b", "Also,"),
                (r"\bmoreover,\b", "What's more,"),
                (r"\bconsequently,\b", "As a result,"),
                (r"\bnevertheless,\b", "Still,"),
                (r"\bnonetheless,\b", "Even so,"),
                (r"\bin conclusion,\b", "Overall,"),
                (r"\bdelve into\b", "explore"),
                (r"\btapestry of\b", "landscape of"),
                (r"\btestament to\b", "reflection of"),
                (r"\bparamount\b", "essential"),
                (r"\bpivotal\b", "crucial"),
                (r"\butilize\b", "use"),
                (r"\boptimize\b", "improve"),
                (r"\bseamlessly\b", "smoothly"),
                (r"\bsignificantly\b", "notably"),
                (r"\bvarious\b", "different"),
                (r"\bhas transformed\b", "changed"),
                (r"\benables organizations to\b", "helps teams"),
                (r"\boperational efficiency\b", "day-to-day workflow"),
                (r"\bgenerate valuable insights\b", "find helpful patterns"),
                (r"\blarge amounts of data\b", "broad datasets"),
                (r"\brobotic\b", "unnatural")
            ]

        # Process paragraph-by-paragraph to preserve headings, lists, and section structure
        paragraphs = text.split("\n")
        transformed_paragraphs = []

        for para in paragraphs:
            trimmed = para.strip()
            if not trimmed:
                transformed_paragraphs.append(para)
                continue

            # Preserve markdown headings, lists, or bullets
            is_heading_or_list = bool(re.match(r'^(#{1,6}\s+|[-*•]\s+|\d+\.\s+|[A-Za-z0-9]+\.\s+)', trimmed))

            p_res = para
            for pattern, replacement in replacements:
                p_res = re.sub(pattern, replacement, p_res, flags=re.IGNORECASE)

            # Tone-sensitive sentence boundary restructuring within prose paragraphs only
            if not is_heading_or_list and len(trimmed) >= 40:
                sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', p_res) if s.strip()]
                if len(sentences) >= 2:
                    s1 = sentences[1]
                    if not s1.startswith(("Also", "What's more", "As a result", "Still", "Additionally", "Plus", "Further", "From ", "In ", "Honestly", "So, ")):
                        prefix = {
                            "professional": "From an operational standpoint, ",
                            "academic": "In academic practice, ",
                            "casual": "Honestly, ",
                            "natural": "In practice, "
                        }.get(tone_key, "In practice, ")
                        sentences[1] = f"{prefix}{s1[0].lower() + s1[1:] if len(s1) > 1 else s1}"
                    p_res = " ".join(sentences)

            transformed_paragraphs.append(p_res)

        res_text = "\n".join(transformed_paragraphs)
        if res_text.strip().lower() == text.strip().lower() and len(text.strip()) >= 20:
            lead_prefix = {
                "professional": "From an operational perspective, ",
                "academic": "In academic context, ",
                "casual": "Simply put, ",
                "natural": "In practical terms, "
            }.get(tone_key, "In practical terms, ")
            for i, p in enumerate(transformed_paragraphs):
                if p.strip() and not bool(re.match(r'^(#{1,6}\s+|[-*•]\s+|\d+\.\s+|[A-Za-z0-9]+\.\s+)', p.strip())):
                    trimmed_p = p.strip()
                    transformed_paragraphs[i] = f"{lead_prefix}{trimmed_p[0].lower() + trimmed_p[1:] if len(trimmed_p) > 1 else trimmed_p}"
                    break
            res_text = "\n".join(transformed_paragraphs)

        return res_text

    @classmethod
    async def _call_groq(cls, text: str, tone: str = "natural") -> str:
        api_key = os.getenv("GROQ_API_KEY")
        sys_prompt = cls.get_system_prompt(tone)
        timeout = httpx.Timeout(15.0, connect=5.0)
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "model": "openai/gpt-oss-120b",
                    "messages": [
                        {"role": "system", "content": sys_prompt},
                        {"role": "user", "content": text}
                    ],
                    "temperature": 0.7
                }
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()

    @classmethod
    async def _call_openrouter(cls, text: str, tone: str = "natural") -> str:
        api_key = os.getenv("OPENROUTER_API_KEY")
        sys_prompt = cls.get_system_prompt(tone)
        timeout = httpx.Timeout(10.0, connect=3.0)
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "model": "nvidia/nemotron-3.5-lightning:free",
                    "messages": [
                        {"role": "system", "content": sys_prompt},
                        {"role": "user", "content": text}
                    ],
                    "temperature": 0.7
                }
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()

    @classmethod
    async def _call_google(cls, text: str, tone: str = "natural") -> str:
        api_key = os.getenv("GOOGLE_API_KEY")
        sys_prompt = cls.get_system_prompt(tone)
        # Pass API key via header instead of URL query parameter to prevent key exposure in logs and error traces
        url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent"
        timeout = httpx.Timeout(6.0, connect=3.0)
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(
                url,
                headers={"x-goog-api-key": api_key, "Content-Type": "application/json"},
                json={
                    "contents": [{
                        "parts": [{"text": f"{sys_prompt}\n\nText to rewrite:\n{text}"}]
                    }]
                }
            )
            resp.raise_for_status()
            data = resp.json()
            return data["candidates"][0]["content"]["parts"][0]["text"].strip()

    @classmethod
    async def _call_nvidia(cls, text: str, tone: str = "natural") -> str:
        api_key = os.getenv("NVIDIA_API_KEY")
        sys_prompt = cls.get_system_prompt(tone)
        timeout = httpx.Timeout(15.0, connect=5.0)
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(
                "https://integrate.api.nvidia.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "model": "meta/llama-3.2-11b-vision-instruct",
                    "messages": [
                        {"role": "system", "content": sys_prompt},
                        {"role": "user", "content": text}
                    ],
                    "temperature": 0.7
                }
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()
