import os
import sys
import unittest
import json
import io
import zipfile
import time
from pathlib import Path
from fastapi.testclient import TestClient

root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.app.main import app
from backend.api.auth import get_current_user
from backend.services.document_parser import DocumentParser
from backend.services.llm_providers import _sanitize_log, LLMProviderService
from backend.ml.fusion_model import FeatureFusionDetector
from backend.ml.experimental.v5_inference import V5InferenceService


class TestSlice4SecurityReliability(unittest.TestCase):
    """
    Automated regression and security verification suite for Slice 4:
    API security, file-upload defenses, ML reliability, provider resilience, and privacy.
    """

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.valid_token = "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0LXVzZXItMTIzIn0.signature"
        cls.headers = {"Authorization": cls.valid_token}

    def test_01_auth_consistency_across_all_endpoints(self):
        """All protected endpoints must reject unauthenticated requests with HTTP 401."""
        endpoints = [
            ("POST", "/api/analyze", {"text": "Machine learning testing text." * 4}),
            ("POST", "/api/recheck", {"text": "Machine learning testing text." * 4}),
            ("POST", "/api/humanize", {"text": "Machine learning testing text." * 4}),
            ("POST", "/api/benchmark", {}),
            ("POST", "/api/experimental/v5/analyze", {"text": "Machine learning testing text." * 4}),
        ]
        for method, path, payload in endpoints:
            with self.subTest(endpoint=path):
                if method == "POST":
                    resp = self.client.post(path, json=payload)
                    self.assertEqual(resp.status_code, 401, f"{path} did not reject unauthenticated access")

    def test_02_jwt_expiration_rejected(self):
        """Expired JWT tokens must be rejected with HTTP 401."""
        import base64
        # Payload with exp set to past timestamp (e.g. 1 hour ago)
        expired_payload = {"sub": "test-user-123", "exp": int(time.time()) - 3600}
        b64_payload = base64.b64encode(json.dumps(expired_payload).encode()).decode().rstrip("=")
        expired_token = f"Bearer eyJhbGciOiJIUzI1NiJ9.{b64_payload}.fake_signature"

        resp = self.client.post(
            "/api/analyze",
            headers={"Authorization": expired_token},
            json={"text": "Machine learning test with expired credentials." * 3}
        )
        self.assertEqual(resp.status_code, 401)
        self.assertIn("expired", resp.json().get("detail", "").lower())

    def test_03_jwt_malformed_token_secure_error(self):
        """Malformed JWT tokens must be rejected without leaking internal stack traces."""
        invalid_tokens = [
            "Bearer not-a-jwt",
            "Bearer invalid.payload-only",
            "Bearer part1.bad_base64!!!.part3",
            "Bearer eyJhbGciOiJIUzI1NiJ9.e30.signature"  # empty sub
        ]
        for tok in invalid_tokens:
            with self.subTest(token=tok):
                resp = self.client.post(
                    "/api/analyze",
                    headers={"Authorization": tok},
                    json={"text": "Machine learning token validation text." * 3}
                )
                self.assertEqual(resp.status_code, 401)
                detail = resp.json().get("detail", "")
                self.assertNotIn("Traceback", detail)
                self.assertNotIn("File \"", detail)

    def test_04_input_length_validation_bounds(self):
        """Endpoints must reject empty, too-short (<50 chars), and oversized (>20k chars) inputs."""
        # Too short
        resp = self.client.post("/api/recheck", headers=self.headers, json={"text": "Too short"})
        self.assertEqual(resp.status_code, 400)

        # Oversized
        oversized = "A" * 20001
        resp = self.client.post("/api/recheck", headers=self.headers, json={"text": oversized})
        self.assertEqual(resp.status_code, 400)
        self.assertIn("exceeds", resp.json().get("detail", "").lower())

        # V5 length checks
        resp = self.client.post("/api/experimental/v5/analyze", headers=self.headers, json={"text": "Short"})
        self.assertEqual(resp.status_code, 400)

    def test_05_docx_zip_bomb_entry_count_defense(self):
        """DocumentParser must reject DOCX archives containing excessive entries (>1000)."""
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w") as zf:
            for i in range(1005):
                zf.writestr(f"word/entry_{i}.xml", "<w:p/>")
        zip_bytes = buf.getvalue()

        from fastapi import HTTPException
        with self.assertRaises(HTTPException) as cm:
            DocumentParser._parse_docx(zip_bytes)
        self.assertEqual(cm.exception.status_code, 400)
        self.assertIn("excessive entry count", cm.exception.detail.lower())

    def test_06_docx_decompression_ratio_bomb_defense(self):
        """DocumentParser must reject DOCX archives with suspicious compression ratio (>100:1)."""
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", compression=zipfile.ZIP_DEFLATED) as zf:
            # High compression repetition (1MB of zeros compresses to ~1KB, ratio > 1000)
            zf.writestr("word/huge.xml", b"0" * (1024 * 1024 * 2))
        zip_bytes = buf.getvalue()

        from fastapi import HTTPException
        with self.assertRaises(HTTPException) as cm:
            DocumentParser._parse_docx(zip_bytes)
        self.assertEqual(cm.exception.status_code, 400)
        self.assertIn("decompression bomb", cm.exception.detail.lower())

    def test_07_docx_path_traversal_defense(self):
        """DocumentParser must reject DOCX archives containing path traversal entry names."""
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w") as zf:
            zf.writestr("../../../etc/passwd", "root:x:0:0")
        zip_bytes = buf.getvalue()

        from fastapi import HTTPException
        with self.assertRaises(HTTPException) as cm:
            DocumentParser._parse_docx(zip_bytes)
        self.assertEqual(cm.exception.status_code, 400)
        self.assertIn("path traversal", cm.exception.detail.lower())

    def test_08_pdf_excessive_page_count_defense(self):
        """DocumentParser must reject PDFs with page count exceeding 200 pages."""
        # Create a mock PDF with > 200 empty pages
        import pypdf
        writer = pypdf.PdfWriter()
        for _ in range(205):
            writer.add_blank_page(width=100, height=100)
        pdf_buf = io.BytesIO()
        writer.write(pdf_buf)
        pdf_bytes = pdf_buf.getvalue()

        from fastapi import HTTPException
        with self.assertRaises(HTTPException) as cm:
            DocumentParser._parse_pdf(pdf_bytes)
        self.assertEqual(cm.exception.status_code, 400)
        self.assertIn("exceeds maximum allowed limit of 200 pages", cm.exception.detail.lower())

    def test_09_ml_probability_validation_finite_bounds(self):
        """V2 detector evaluate must guarantee finite probabilities strictly within [0.0, 1.0]."""
        if not FeatureFusionDetector.is_trained_model_available():
            self.skipTest("V2 detector model artifacts not present.")

        sample = "Advanced machine learning text detection system evaluation with strict probability bounds."
        res = FeatureFusionDetector.evaluate(sample)
        ai_prob = res.get("ai_probability")
        hum_prob = res.get("human_probability")

        self.assertIsInstance(ai_prob, float)
        self.assertIsInstance(hum_prob, float)
        self.assertGreaterEqual(ai_prob, 0.0)
        self.assertLessEqual(ai_prob, 1.0)
        self.assertGreaterEqual(hum_prob, 0.0)
        self.assertLessEqual(hum_prob, 1.0)
        self.assertAlmostEqual(ai_prob + hum_prob, 1.0, places=3)

    def test_10_privacy_log_sanitization(self):
        """_sanitize_log must redact API keys, Bearer tokens, and secrets from log strings."""
        dirty_msg = (
            "Error connecting to https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSySecretKey123 "
            "with header Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.sensitive_payload.signature and x-goog-api-key: AIzaSySecretKey123"
        )
        clean_msg = _sanitize_log(dirty_msg)
        self.assertNotIn("AIzaSySecretKey123", clean_msg)
        self.assertNotIn("sensitive_payload", clean_msg)
        self.assertIn("[REDACTED]", clean_msg)

    def test_11_cors_allowed_origins_configuration(self):
        """CORS preflight should allow whitelisted localhost/InsForge origins and headers."""
        headers = {
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "authorization,content-type"
        }
        resp = self.client.options("/api/analyze", headers=headers)
        self.assertIn(resp.status_code, (200, 204))
        self.assertEqual(resp.headers.get("access-control-allow-origin"), "http://localhost:5173")


if __name__ == "__main__":
    unittest.main()
