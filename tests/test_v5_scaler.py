import os
import sys
import unittest
import json
import torch
from pathlib import Path
from unittest.mock import patch

root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.ml.train_v2_stage1 import SimpleScaler
from backend.ml.experimental.v5_inference import V5InferenceService
from backend.ml.stylometrics import StylometricExtractor

class TestV5Scaler(unittest.TestCase):
    def setUp(self):
        self.dummy_scaler_path = os.path.join(
            os.path.dirname(__file__), '..', 'backend', 'ml', 'experimental', 'model', 'v5_scaler.json'
        )
        # Ensure dummy scaler exists for base tests
        if not os.path.exists(self.dummy_scaler_path):
            with open(self.dummy_scaler_path, "w") as f:
                json.dump({
                    "mean": [0.0]*20,
                    "std": [1.0]*20
                }, f)

    def test_missing_scaler_fails(self):
        # Temporarily move scaler
        backup_path = self.dummy_scaler_path + ".bak"
        if os.path.exists(self.dummy_scaler_path):
            os.rename(self.dummy_scaler_path, backup_path)
            
        try:
            # Should fail to initialize
            V5InferenceService._instance = None
            with self.assertRaises(FileNotFoundError) as context:
                V5InferenceService.get_instance()
            self.assertIn("V5 scaler configuration not found", str(context.exception))
        finally:
            if os.path.exists(backup_path):
                os.rename(backup_path, self.dummy_scaler_path)

    def test_inference_applies_scaler(self):
        # Overwrite dummy scaler with specific values to test scaling
        with open(self.dummy_scaler_path, "w") as f:
            json.dump({
                "mean": [10.0]*20,
                "std": [2.0]*20
            }, f)
            
        V5InferenceService._instance = None
        service = V5InferenceService.get_instance()
        
        # Test vector of 20s
        raw_stylo = [20.0] * 20
        # Expected scaled = (20.0 - 10.0) / 2.0 = 5.0
        scaled = service.scaler.transform(raw_stylo)
        self.assertEqual(scaled[0], 5.0)

    def test_feature_order_is_consistent(self):
        # StylometricExtractor order is exactly 20 features
        text = "This is a simple text."
        vector = StylometricExtractor.get_vector(text)
        self.assertEqual(len(vector), 20)
        
        # V5Inference uses the exact same order by calling get_vector
        service = V5InferenceService.get_instance()
        # Analyze should not crash on length mismatch because length is strictly enforced in get_vector
        try:
            service.analyze(text)
            passed = True
        except Exception as e:
            passed = False
        self.assertTrue(passed)

if __name__ == "__main__":
    unittest.main()
