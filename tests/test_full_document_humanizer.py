import io
import sys
import unittest
from pathlib import Path
from fastapi.testclient import TestClient
import docx

root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.app.main import app
from backend.api.auth import get_current_user
from backend.services.llm_providers import LLMProviderService
from backend.ml.text_chunking import chunk_document_bounded


class FakeUser:
    def __init__(self, uid: str = "test-doc-user"):
        self.id = uid
        self.email = "test@verity.ai"


class TestFullDocumentHumanizer(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        app.dependency_overrides[get_current_user] = lambda: FakeUser()
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        app.dependency_overrides.clear()

    def test_01_long_docx_analysis_returns_full_extracted_text(self):
        """
        Verify that analyzing a multi-chunk DOCX returns the complete extracted_text
        so the frontend can transfer the entire document to Adversarial Rewrite.
        """
        doc = docx.Document()
        doc.add_heading("Executive Summary of Machine Learning", level=1)
        
        paragraphs = [
            f"Section {i}: Deep transformer architectures optimize natural language representations. "
            f"Furthermore, researchers delve into stylometric variances including type-token ratio. "
            f"Consequently, organizations utilize these empirical signals to detect generative provenance."
            for i in range(1, 15)
        ]
        for p in paragraphs:
            doc.add_paragraph(p)

        buf = io.BytesIO()
        doc.save(buf)
        file_bytes = buf.getvalue()

        files = {
            "file": (
                "enterprise_report.docx",
                file_bytes,
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            )
        }
        response = self.client.post("/api/analyze-file", files=files, data={"detailed": "true"})
        self.assertEqual(response.status_code, 200)
        data = response.json()

        # Check extracted_text is returned and complete
        self.assertIn("extracted_text", data)
        extracted = data["extracted_text"]
        self.assertGreater(len(extracted), 2000)
        self.assertIn("Section 1:", extracted)
        self.assertIn("Section 14:", extracted)
        self.assertIn("Executive Summary of Machine Learning", extracted)

        # Check document metadata
        self.assertEqual(data["document_meta"]["filename"], "enterprise_report.docx")
        self.assertEqual(data["document_meta"]["file_type"], "DOCX")
        self.assertGreaterEqual(data["document_meta"]["chunks_analyzed"], 2)

    def test_02_structure_and_paragraph_preservation_in_humanization(self):
        """
        Verify that humanization preserves headings, lists, and multi-paragraph order,
        without collapsing into a single run-on paragraph or two lines.
        """
        document_text = (
            "# Main Architecture Overview\n\n"
            "Furthermore, it is imperative to delve into the tapestry of AI models in order to analyze their capabilities. "
            "Consequently, organizations optimize their operational efficiency seamlessly.\n\n"
            "## Key Objectives\n\n"
            "- 1. Utilize robust stylometric metrics across all documents.\n"
            "- 2. Seamlessly transform robotic prose into human flow.\n\n"
            "In conclusion, modern natural language systems significantly alter our day-to-day workflow. "
            "Moreover, empirical validation remains paramount for reliable deployments."
        )

        response = self.client.post("/api/humanize", json={
            "text": document_text,
            "tone": "professional"
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("humanized_text", data)
        out = data["humanized_text"]

        # Headings and lists preserved
        self.assertIn("Main Architecture Overview", out)
        self.assertIn("Key Objectives", out)

        # Multi-paragraph structure preserved (not flattened into two lines)
        out_paragraphs = [p for p in out.split("\n\n") if p.strip()]
        self.assertGreaterEqual(len(out_paragraphs), 3)

        # Word count consistency (concise rewrites acceptable, but not severe truncation)
        in_words = len(document_text.split())
        out_words = len(out.split())
        self.assertGreater(out_words, int(in_words * 0.60))
        self.assertLess(out_words, int(in_words * 1.40))

    def test_03_short_text_humanization_across_all_tones(self):
        """
        Verify that short-text humanization continues to work correctly across all tones.
        """
        short_text = (
            "Furthermore, the model delves into complex stylometric variations. "
            "Consequently, teams optimize efficiency seamlessly."
        )

        for target_tone in ["natural", "professional", "academic", "casual"]:
            response = self.client.post("/api/humanize", json={
                "text": short_text,
                "tone": target_tone
            })
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["tone"], target_tone)
            self.assertIn("humanized_text", data)
            self.assertGreater(len(data["humanized_text"]), 40)
            # Must not be identical to robotic input
            self.assertNotEqual(data["humanized_text"].strip(), short_text.strip())

    def test_04_truncated_response_rejection(self):
        """
        Verify that _is_valid_rewrite rejects truncated outputs (e.g. only 2 words for a long input).
        """
        full_text = (
            "Furthermore, modern enterprise systems require deep neural networks to synthesize complex "
            "information from diverse data sources. Consequently, data science teams spend substantial "
            "effort fine-tuning hyperparameters to avoid overfitting."
        )
        # 2-line or 2-word truncation
        truncated_out = "In practice, yes."

        is_valid = LLMProviderService._is_valid_rewrite(truncated_out, full_text)
        self.assertFalse(is_valid, "Should reject severely truncated rewrite")

        # Full rewrite
        valid_out = LLMProviderService._advanced_local_humanize(full_text, tone="natural")
        is_valid_real = LLMProviderService._is_valid_rewrite(valid_out, full_text)
        self.assertTrue(is_valid_real, "Should accept proper rewrite")

    def test_05_long_document_payload_support(self):
        """
        Verify that documents > 15,000 characters are accepted and processed
        without hitting the previous 15k character payload limit.
        """
        # Generate ~18,000 characters
        paragraphs = [
            f"Paragraph {i}: Deep neural networks optimize natural language processing tasks across distributed computing clusters. "
            f"Furthermore, stylometric analysis investigates character burstiness, part-of-speech distributions, and lexical richness. "
            f"Consequently, organizations deploy automated evaluation frameworks to ensure consistent model governance."
            for i in range(1, 45)
        ]
        long_doc = "\n\n".join(paragraphs)
        self.assertGreater(len(long_doc), 15000)

        response = self.client.post("/api/humanize", json={
            "text": long_doc,
            "tone": "natural"
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("humanized_text", data)
        out = data["humanized_text"]

        # Word count consistency and multi-paragraph structure
        in_words = len(long_doc.split())
        out_words = len(out.split())
        self.assertGreater(out_words, int(in_words * 0.75))
        self.assertGreater(len(out), 12000)
        self.assertIn("distributed computing clusters", out)
        self.assertIn("model governance", out)
    def test_06_7784_word_document_preserves_full_text_and_distinguishes_segments(self):
        """
        CRITICAL REGRESSION TEST:
        Assert that analyzing a 7,784-word document (like Final guide.docx) preserves the
        complete 7,784 words (57,902 characters) in extracted_text, and that the 50 evaluated
        analysis chunks (~904 words) are NEVER confused with the full document text.
        """
        final_guide_path = Path("C:/Users/user/OneDrive/Desktop/Final guide.docx")
        if final_guide_path.exists():
            with open(final_guide_path, "rb") as f:
                file_bytes = f.read()
            filename = "Final guide.docx"
        else:
            # Synthetic 7,784-word DOCX generator
            doc = docx.Document()
            target_words = 7784
            words_added = 0
            idx = 1
            while words_added < target_words:
                p_text = (
                    f"Paragraph {idx}: Advanced artificial intelligence systems generate sophisticated text "
                    f"exhibiting distinctive structural nuances. Stylometric analysis evaluates syntactic patterns, "
                    f"vocabulary distribution, and sentence burstiness across diverse contexts. "
                )
                p_words = len(p_text.split())
                if words_added + p_words > target_words:
                    remaining = target_words - words_added
                    p_text = " ".join(p_text.split()[:remaining])
                doc.add_paragraph(p_text)
                words_added += len(p_text.split())
                idx += 1
            buf = io.BytesIO()
            doc.save(buf)
            file_bytes = buf.getvalue()
            filename = "synthetic_7784_words.docx"

        files = {
            "file": (
                filename,
                file_bytes,
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            )
        }
        response = self.client.post("/api/analyze-file", files=files, data={"detailed": "true"})
        self.assertEqual(response.status_code, 200)
        data = response.json()

        # 1. Document metadata assertions
        meta = data.get("document_meta", {})
        self.assertEqual(meta.get("chunks_analyzed"), 50)
        self.assertEqual(meta.get("total_words"), 7784)

        # 2. Complete extracted text assertions
        self.assertIn("extracted_text", data)
        extracted_text = data["extracted_text"]
        extracted_words = len(extracted_text.split())
        self.assertEqual(extracted_words, 7784)
        if filename == "Final guide.docx":
            self.assertEqual(len(extracted_text), 57902)

        # 3. Segments distinction assertions
        segments = data.get("segments", [])
        self.assertEqual(len(segments), 50)
        segments_total_words = sum(len(s["text"].split()) for s in segments)
        if filename == "Final guide.docx":
            self.assertEqual(segments_total_words, 904)

        # Strict assertion: Segments and full extracted document are NOT interchangeable
        self.assertNotEqual(
            extracted_words,
            segments_total_words,
            "CRITICAL: Full extracted text word count must not match sampled segments word count."
        )
        self.assertGreater(
            extracted_words,
            segments_total_words * 5,
            "CRITICAL: Full document (7,784 words) must be vastly larger than sampled segments (904 words)."
        )

    def test_07_section_9_structural_formula_preservation(self):
        """
        Verify the exact Section 9 failure pattern from Final guide.docx:
        transliterated Telugu-English notes, mathematical arrows (→, ≥),
        dense formulas (256 + 64 = 320-D), and numbered section outlines.
        Must be preserved intact without data loss, marked as preserved: True.
        """
        import asyncio
        sec9_sample = (
            "Output ga 768-dimensional semantic vector generate chestundhi.\n\n"
            "768-D Vector\n\n"
            "Vector ante information ni numerical values form lo represent cheyyadam.\n\n"
            "Ikkada:\n\n"
            "DistilRoBERTa → 768-D vector\n\n"
            "Ee 768 values text yokka semantic/contextual information ni represent chestayi.\n\n"
            "Dense Layer — 768 → 256\n\n"
            "Threshold ante final decision teesukune cutoff point.\n\n"
            "If: AI Probability ≥ 0.70 → AI Generated\n\n"
            "26. MODEL EVOLUTION\n\n"
            "27. V1 — DISTILROBERTA"
        )
        # Verify structural detection
        is_struct = LLMProviderService._is_structural_or_factual(sec9_sample)
        self.assertTrue(is_struct, "Section 9 must be detected as structural/factual content")

        # Execute humanization with provider='none' to trigger fallback handling
        res = asyncio.run(LLMProviderService.humanize_text(
            sec9_sample,
            provider="none",
            tone="natural",
            allow_local_fallback=True
        ))
        self.assertIn("humanized_text", res)
        self.assertTrue(res.get("preserved", False), "Structural section must be explicitly marked as preserved")
        self.assertEqual(res.get("provider"), "preserved")
        self.assertIn("768-dimensional semantic vector", res["humanized_text"])
        self.assertIn("AI Probability ≥ 0.70", res["humanized_text"])
        self.assertIn("26. MODEL EVOLUTION", res["humanized_text"])

    def test_08_provider_http_401_403_immediate_cooldown(self):
        """
        Verify that HTTP 401 or 403 authentication failures immediately put the
        provider into cooldown (600s) without futile retries.
        """
        import asyncio
        from unittest.mock import patch
        import httpx
        from backend.services.llm_provider import LLMRateLimiter

        req = httpx.Request("POST", "https://api.groq.com/openai/v1/chat/completions")
        resp_401 = httpx.Response(401, request=req, text="Unauthorized: Invalid API Key")

        with patch("backend.services.llm_providers.LLMProviderService._call_groq", side_effect=httpx.HTTPStatusError("401", request=req, response=resp_401)), \
             patch.object(LLMProviderService, "get_available_providers", return_value={"groq": True, "openrouter": False, "google": False, "nvidia": False}):
            LLMRateLimiter._cooldown_until.pop("groq", None)
            res = asyncio.run(LLMProviderService.humanize_text(
                "Furthermore, artificial intelligence optimizes operational efficiency.",
                provider="groq",
                tone="natural",
                allow_local_fallback=True
            ))
            # Must activate cooldown
            self.assertTrue(LLMRateLimiter.is_rate_limited("groq"))
            # Must successfully fall back to local engine
            self.assertIn("humanized_text", res)

    def test_09_provider_http_429_retry_after_cooldown(self):
        """
        Verify that HTTP 429 Rate Limit respects Retry-After headers and activates cooldown.
        """
        import asyncio
        from unittest.mock import patch
        import httpx
        from backend.services.llm_provider import LLMRateLimiter

        req = httpx.Request("POST", "https://openrouter.ai/api/v1/chat/completions")
        resp_429 = httpx.Response(429, request=req, headers={"retry-after": "45"}, text="Rate limit exceeded")

        with patch("backend.services.llm_providers.LLMProviderService._call_openrouter", side_effect=httpx.HTTPStatusError("429", request=req, response=resp_429)), \
             patch.object(LLMProviderService, "get_available_providers", return_value={"groq": False, "openrouter": True, "google": False, "nvidia": False}):
            LLMRateLimiter._cooldown_until.pop("openrouter", None)
            res = asyncio.run(LLMProviderService.humanize_text(
                "Moreover, the system delves into deep data synthesis seamlessly.",
                provider="openrouter",
                tone="professional",
                allow_local_fallback=True
            ))
            self.assertTrue(LLMRateLimiter.is_rate_limited("openrouter"))
            self.assertIn("humanized_text", res)

    def test_10_provider_timeout_and_transient_failure_handling(self):
        """
        Verify that timeout errors trigger bounded retries with backoff and then
        fall back cleanly without producing empty or truncated output.
        """
        import asyncio
        from unittest.mock import patch
        import httpx

        req = httpx.Request("POST", "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent")

        with patch("backend.services.llm_providers.LLMProviderService._call_google", side_effect=httpx.ReadTimeout("Timeout connecting to server", request=req)), \
             patch.object(LLMProviderService, "get_available_providers", return_value={"groq": False, "openrouter": False, "google": True, "nvidia": False}):
            res = asyncio.run(LLMProviderService.humanize_text(
                "Furthermore, our data analytics framework utilizes predictive algorithms.",
                provider="google",
                tone="natural",
                allow_local_fallback=True
            ))
            self.assertIn("humanized_text", res)
            self.assertGreater(len(res["humanized_text"]), 20)

    def test_11_prose_section_safe_halt_on_all_providers_failure(self):
        """
        Verify that if all external providers fail on a prose section and local fallback
        is disabled, the system halts safely with an actionable error and does NOT
        silently lose text or fabricate success.
        """
        import asyncio
        prose_text = (
            "Natural language processing has undergone significant evolution over the past decade. "
            "Engineers and researchers develop foundational models capable of general understanding."
        )
        res = asyncio.run(LLMProviderService.humanize_text(
            prose_text,
            provider="none",
            tone="natural",
            allow_local_fallback=False
        ))
        self.assertIn("error", res)
        self.assertIn("All external AI paraphrasing engines failed", res["error"])
        self.assertEqual(res["provider"], "none")

    def test_12_modernbert_runtime_selection_and_v2_fallback(self):
        """
        Verify that ModernBERT V5 is loaded when VERITY_PRIMARY_MODEL=modernbert,
        and that if ModernBERT fails, it safely falls back to DistilRoBERTa V2.
        """
        from backend.services.provider_manager import ProviderManager
        import os

        # Verify active selection
        os.environ["VERITY_PRIMARY_MODEL"] = "modernbert"
        res = ProviderManager._try_local_transformer("This is a verified test sample for model routing.")
        self.assertIn(res.get("status"), ["success", "unavailable"])
        if res.get("status") == "success":
            self.assertIn(res.get("active_model"), ["ModernBERT-V5", "DistilRoBERTa-V2"])
            self.assertIn(res.get("selected_model"), ["ModernBERT-V5"])

        # Test rollback when ModernBERT raises an exception
        from unittest.mock import patch
        with patch("backend.ml.experimental.v5_inference.V5InferenceService.get_instance", side_effect=RuntimeError("Mocked ModernBERT load failure")):
            fallback_res = ProviderManager._try_local_transformer("This is a test sample for fallback verification.")
            if fallback_res.get("status") == "success":
                self.assertEqual(fallback_res.get("active_model"), "DistilRoBERTa-V2")
                self.assertIn("Rollback", fallback_res.get("detection_engine", ""))
                self.assertIn("Safe rollback to V2 activated", fallback_res.get("fallback_reason", ""))

    def test_13_complete_transfer_and_output_integrity_7784_words(self):
        """
        Verify that the full 7,784-word document (Final guide.docx):
        1. Breaks into exactly 24 sequential chunks (< 2500 chars each).
        2. Section 9 (chunk index 8) is identified as structural/factual content and safely preserved.
        3. All 24 sections maintain original ordering, headings, and paragraph boundaries.
        4. Reconstructed full output has zero missing sections and preserves overall word count integrity.
        """
        import asyncio
        final_guide_path = Path("C:/Users/user/OneDrive/Desktop/Final guide.docx")
        if not final_guide_path.exists():
            self.skipTest("Final guide.docx not available on system")

        doc = docx.Document(str(final_guide_path))
        full_text = "\n\n".join(p.text for p in doc.paragraphs if p.text.strip())
        in_words = len(full_text.split())
        self.assertEqual(in_words, 7784)
        self.assertEqual(len(full_text), 57920) # 57,902 characters without CRLF variances

        # Exact frontend chunking logic
        paragraphs = [p.strip() for p in full_text.split("\n\n") if p.strip()]
        chunks = []
        curr = []
        curr_chars = 0
        for p in paragraphs:
            p_len = len(p)
            if curr_chars + p_len + 2 > 2500 and curr:
                chunks.append("\n\n".join(curr))
                curr = [p]
                curr_chars = p_len
            else:
                curr.append(p)
                curr_chars += p_len + 2
        if curr:
            chunks.append("\n\n".join(curr))

        self.assertEqual(len(chunks), 24, "Final guide.docx must produce exactly 24 chunks")

        # Process each chunk sequentially
        transformed_chunks = []
        preserved_count = 0

        from unittest.mock import patch
        with patch.object(LLMProviderService, "get_available_providers", return_value={"groq": False, "openrouter": False, "google": False, "nvidia": False}):
            for idx, chunk in enumerate(chunks):
                res = asyncio.run(LLMProviderService.humanize_text(
                    chunk,
                    provider="auto",
                    tone="natural",
                    allow_local_fallback=True
                ))
                self.assertIn("humanized_text", res, f"Chunk {idx + 1} must return humanized_text")
                if res.get("preserved", False):
                    preserved_count += 1
                transformed_chunks.append(res["humanized_text"])

        # Assertion: Exactly 24 chunks present
        self.assertEqual(len(transformed_chunks), 24)

        # Assertion: Section 9 was safely preserved intact
        sec9_transformed = transformed_chunks[8]
        self.assertIn("768-dimensional semantic vector", sec9_transformed)
        self.assertIn("AI Probability ≥ 0.70", sec9_transformed)
        self.assertIn("26. MODEL EVOLUTION", sec9_transformed)

        # Assertion: Full combined text integrity
        full_transformed = "\n\n".join(transformed_chunks)
        out_words = len(full_transformed.split())
        self.assertGreater(out_words, int(in_words * 0.85), "Output words must retain at least 85% of input words")
        self.assertLess(out_words, int(in_words * 1.15), "Output words must not artificially inflate beyond 115%")
        self.assertGreater(preserved_count, 0, "At least one structural section must be preserved")


if __name__ == "__main__":
    unittest.main()

