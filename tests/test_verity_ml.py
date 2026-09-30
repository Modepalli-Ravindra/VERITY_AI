import os
import sys
import unittest
import json
from pathlib import Path
from fastapi.testclient import TestClient

root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.ml.text_preprocessing import preprocess_text
from backend.ml.stylometrics import StylometricExtractor
from backend.ml.fusion_model import FeatureFusionDetector
from backend.ml.transformer_model import TransformerModelManager
from backend.services.provider_manager import ProviderManager
from backend.app.main import app

class TestVerityMLV2Detector(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_01_nfkc_normalization(self):
        text_fullwidth = "Ｈｅｌｌｏ Ｗｏｒｌｄ！" # Fullwidth unicode
        normalized = preprocess_text(text_fullwidth)
        self.assertEqual(normalized, "Hello World!")

    def test_02_unicode_control_character_stripping(self):
        text_with_control = "Dangerous\x00Control\x07Chars\x1fCleaned\nPreserved line"
        cleaned = preprocess_text(text_with_control)
        self.assertNotIn("\x00", cleaned)
        self.assertNotIn("\x07", cleaned)
        self.assertNotIn("\x1f", cleaned)
        self.assertIn("Cleaned", cleaned)
        self.assertIn("Preserved line", cleaned)

    def test_03_tokenizer_parity(self):
        text = "VERITY AI text detector tokenizer test."
        _, tokenizer = TransformerModelManager.load_model()
        tokens = tokenizer.encode(preprocess_text(text), add_special_tokens=True)
        self.assertGreater(len(tokens), 0)

    def test_04_embedding_parity(self):
        text = "Robust cross-domain detection of machine generated text."
        feats = TransformerModelManager.extract_features(preprocess_text(text))
        vector = feats["embedding_sample"]
        self.assertEqual(len(vector), 768)
        self.assertEqual(feats["embedding_dim"], 768)

    def test_05_stylometric_extraction_parity(self):
        text = "The quick brown fox jumps over the lazy dog. Is this stylized? Absolutely!"
        clean_text = preprocess_text(text)
        vector = StylometricExtractor.get_vector(clean_text)
        features = StylometricExtractor.extract_features(clean_text)

        self.assertEqual(len(vector), 20)
        self.assertEqual(len(features["feature_vector"]), 20)
        self.assertEqual(features["word_count"], 13)

    def test_06_scaler_transform_parity(self):
        from backend.ml.train_v2_stage1 import SimpleScaler
        scaler = SimpleScaler()
        scaler.mean = [0.0] * 20
        scaler.std = [1.0] * 20
        vec = [5.0] * 20
        scaled = scaler.transform(vec)
        self.assertEqual(scaled, vec)

    def test_07_checkpoint_loading_and_availability(self):
        available = FeatureFusionDetector.is_trained_model_available()
        self.assertIsInstance(available, bool)

    def test_08_sigmoid_probability_bounds(self):
        if not FeatureFusionDetector.is_trained_model_available():
            self.skipTest("Trained VERITY V2 model artifacts not present.")

        sample_text = "Machine learning models require systematic validation."
        res = FeatureFusionDetector.evaluate(sample_text)
        self.assertEqual(res["status"], "success")
        self.assertGreaterEqual(res["ai_probability"], 0.0)
        self.assertLessEqual(res["ai_probability"], 1.0)
        self.assertAlmostEqual(res["ai_probability"] + res["human_probability"], 1.0, places=3)

    def test_09_locked_threshold_classification(self):
        if not FeatureFusionDetector.is_trained_model_available():
            self.skipTest("Trained VERITY V2 model artifacts not present.")

        sample_text = "Standard evaluation test text."
        res = FeatureFusionDetector.evaluate(sample_text)
        prob = res["ai_probability"]
        thresh = res["locked_threshold"]
        expected_label = "Likely AI Generated" if prob >= thresh else "Likely Human Written"
        self.assertEqual(res["classification"], expected_label)

    def test_10_api_analyze_endpoint(self):
        response = self.client.post("/api/analyze", json={"text": "Artificial intelligence model evaluation via FastAPI."})
        if not FeatureFusionDetector.is_trained_model_available():
            self.assertEqual(response.status_code, 503)
        else:
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIn("ai_probability", data)
            self.assertIn("human_probability", data)
            self.assertEqual(data["detection_engine"], "local_transformer")

    def test_11_api_recheck_endpoint(self):
        response = self.client.post("/api/recheck", json={"text": "Verifying detector consistency across multiple endpoint invocations."})
        if not FeatureFusionDetector.is_trained_model_available():
            self.assertEqual(response.status_code, 503)
        else:
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIn("classification", data)

    def test_12_model_unavailable_returns_503(self):
        orig_check = FeatureFusionDetector.is_trained_model_available
        orig_cached = FeatureFusionDetector._cached_model
        FeatureFusionDetector._cached_model = None
        FeatureFusionDetector.is_trained_model_available = classmethod(lambda cls: False)

        try:
            res = FeatureFusionDetector.evaluate("Testing model missing scenario.")
            self.assertEqual(res["status"], "unavailable")
            self.assertEqual(res["code"], 503)
        finally:
            FeatureFusionDetector.is_trained_model_available = orig_check
            FeatureFusionDetector._cached_model = orig_cached

if __name__ == "__main__":
    unittest.main()
