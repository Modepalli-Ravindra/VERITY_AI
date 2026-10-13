import sys
import unittest
import unicodedata
import asyncio
from pathlib import Path
from fastapi.testclient import TestClient

root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.app.main import app
from backend.api.auth import get_current_user
from backend.services.llm_providers import LLMProviderService


class FakeUser:
    def __init__(self, uid: str = "test-hum-user"):
        self.id = uid
        self.email = "test@verity.ai"


class TestHumanizerV2(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        app.dependency_overrides[get_current_user] = lambda: FakeUser()
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        app.dependency_overrides.clear()

    # -------------------------------------------------------------
    # 1. Tone Controls: Natural, Professional, Academic, Casual
    # -------------------------------------------------------------
    def test_01_tone_natural(self):
        input_text = (
            "Furthermore, it is paramount to delve into the tapestry of AI models. "
            "Moreover, this technology seamlessly generates valuable insights across broad datasets."
        )
        response = self.client.post("/api/humanize", json={
            "text": input_text,
            "tone": "natural"
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("humanized_text", data)
        self.assertEqual(data.get("tone"), "natural")
        self.assertNotEqual(data["humanized_text"].strip(), input_text.strip())

    def test_02_tone_professional(self):
        input_text = (
            "Furthermore, it is paramount to delve into the operational efficiency of enterprise workflows. "
            "Consequently, this enables organizations to generate valuable insights seamlessly."
        )
        response = self.client.post("/api/humanize", json={
            "text": input_text,
            "tone": "professional"
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("humanized_text", data)
        self.assertEqual(data.get("tone"), "professional")

    def test_03_tone_academic(self):
        input_text = (
            "Moreover, it is pivotal to delve into the theoretical framework of neural computation. "
            "In conclusion, these models optimize empirical performance across extensive datasets."
        )
        response = self.client.post("/api/humanize", json={
            "text": input_text,
            "tone": "academic"
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("humanized_text", data)
        self.assertEqual(data.get("tone"), "academic")

    def test_04_tone_casual(self):
        input_text = (
            "Furthermore, it is paramount to delve into the tapestry of everyday programming tools. "
            "Consequently, developers utilize these systems to optimize their workflow."
        )
        response = self.client.post("/api/humanize", json={
            "text": input_text,
            "tone": "casual"
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("humanized_text", data)
        self.assertEqual(data.get("tone"), "casual")

    # -------------------------------------------------------------
    # 2. Strict Factual, Numerical, and Named Term Preservation
    # -------------------------------------------------------------
    def test_05_preserves_facts_names_numbers_terms(self):
        input_text = (
            "Furthermore, in October 2024, Dr. Evelyn Vance utilized 47 specialized PyTorch algorithms "
            "at the Max Planck Institute to optimize model inference latency by 35%."
        )
        for target_tone in ["natural", "professional", "academic", "casual"]:
            response = self.client.post("/api/humanize", json={
                "text": input_text,
                "tone": target_tone
            })
            self.assertEqual(response.status_code, 200)
            data = response.json()
            out = unicodedata.normalize("NFKC", data["humanized_text"])

            # Key facts MUST be preserved across every tone
            self.assertIn("October 2024", out, f"Date lost in tone: {target_tone}")
            self.assertIn("Dr. Evelyn Vance", out, f"Name lost in tone: {target_tone}")
            self.assertTrue("47" in out or "forty-seven" in out.lower() or "forty‐seven" in out.lower(), f"Number lost in tone: {target_tone}")
            self.assertIn("PyTorch", out, f"Technical term lost in tone: {target_tone}")
            self.assertIn("Max Planck Institute", out, f"Entity lost in tone: {target_tone}")
            self.assertTrue("35%" in out or "35 %" in out, f"Percentage figure lost in tone: {target_tone}")

    # -------------------------------------------------------------
    # 3. Validation: Empty Input and Too-Short Input
    # -------------------------------------------------------------
    def test_06_empty_input_rejected(self):
        response = self.client.post("/api/humanize", json={"text": "   "})
        self.assertEqual(response.status_code, 400)
        self.assertIn("empty", response.json()["detail"].lower())

    def test_07_too_short_input_rejected(self):
        response = self.client.post("/api/humanize", json={"text": "Short sentence."})
        self.assertEqual(response.status_code, 400)
        self.assertIn("too short", response.json()["detail"].lower())

    # -------------------------------------------------------------
    # 4. Long Text Handling and Oversized Text
    # -------------------------------------------------------------
    def test_08_long_text_processing(self):
        paragraphs = [
            "Section 1: The introduction of transformer architectures revolutionized neural machine translation and sequential modeling in 2017.",
            "Section 2: Furthermore, self-attention mechanisms enable models to compute pairwise representations across arbitrary sequence positions efficiently.",
            "Section 3: Stylometric variance examines higher-order lexical features, including type-token ratio, stopword distribution, and punctuation frequency.",
            "Section 4: In modern NLP applications, adversarial paraphrasing seeks to perturb identifiable synthetic cadences without compromising technical facts.",
            "Section 5: Consequently, empirical benchmarks across diverse corpora demonstrate the resilience of dual-branch fusion architectures."
        ]
        long_text = "\n\n".join(paragraphs)
        self.assertGreater(len(long_text), 500)

        response = self.client.post("/api/humanize", json={
            "text": long_text,
            "tone": "professional"
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("humanized_text", data)
        self.assertGreater(len(data["humanized_text"]), 250)

    def test_09_oversized_text_rejected(self):
        oversized_text = "A" * 105000
        response = self.client.post("/api/humanize", json={"text": oversized_text})
        self.assertEqual(response.status_code, 400)
        self.assertIn("exceeds 100,000", response.json()["detail"])

    # -------------------------------------------------------------
    # 5. Provider Failure Handling
    # -------------------------------------------------------------
    def test_10_provider_failure_returns_error(self):
        async def run_failure():
            return await LLMProviderService.humanize_text(
                "Sample text for testing provider failure scenario in the pipeline.",
                provider="none",
                allow_local_fallback=False
            )

        res = asyncio.run(run_failure())
        self.assertIn("error", res)
        self.assertEqual(res["provider"], "none")

    # -------------------------------------------------------------
    # 6. Backward Compatibility (Legacy mode field)
    # -------------------------------------------------------------
    def test_11_legacy_mode_compatibility(self):
        input_text = (
            "Furthermore, it is imperative to delve into the tapestry of AI models in order to analyze their capabilities."
        )
        response = self.client.post("/api/humanize", json={
            "text": input_text,
            "mode": "Balanced"
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("humanized_text", data)
        self.assertEqual(data.get("tone"), "natural")


if __name__ == "__main__":
    unittest.main()
