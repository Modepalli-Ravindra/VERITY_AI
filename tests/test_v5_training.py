import os
import sys
import json
import subprocess
import unittest
import tempfile
from pathlib import Path

class TestV5TrainingLogic(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.train_data = os.path.join(self.temp_dir.name, "train.jsonl")
        self.val_data = os.path.join(self.temp_dir.name, "val.jsonl")
        self.output_dir = os.path.join(self.temp_dir.name, "output")
        
        # Create dummy HC3 format jsonl
        dummy_data = [
            {"human_answers": ["Human text one is here and it is human."], "chatgpt_answers": ["AI text one is here and it is AI."]},
            {"human_answers": ["Human text two is here and it is human."], "chatgpt_answers": ["AI text two is here and it is AI."]},
            {"human_answers": ["Human text three is here and it is human."], "chatgpt_answers": ["AI text three is here and it is AI."]}
        ]
        
        with open(self.train_data, "w") as f:
            for d in dummy_data:
                f.write(json.dumps(d) + "\n")
                
        with open(self.val_data, "w") as f:
            for d in dummy_data:
                f.write(json.dumps(d) + "\n")

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_training_loop_saves_best_and_metrics(self):
        root_dir = Path(__file__).resolve().parent.parent
        script_path = os.path.join(root_dir, "experiments", "v5_modernbert", "train_v5.py")
        
        cmd = [
            sys.executable, script_path,
            "--train_data", self.train_data,
            "--val_data", self.val_data,
            "--epochs", "2",
            "--batch_size", "2",
            "--gradient_accumulation_steps", "5",  # Purposely larger than batches to trigger incomplete grad acc step
            "--output_dir", self.output_dir,
            "--max_train_samples", "6",
            "--max_val_samples", "6"
        ]
        
        # Run training
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        # We expect successful completion
        if result.returncode != 0:
            print(result.stdout)
            print(result.stderr)
        self.assertEqual(result.returncode, 0, "Training script failed to run")
        
        # Verify artifacts
        metrics_file = os.path.join(self.output_dir, "training_results.json")
        self.assertTrue(os.path.exists(metrics_file), "training_results.json was not created")
        
        with open(metrics_file, "r") as f:
            metrics = json.load(f)
            
        self.assertIn("best_epoch", metrics)
        self.assertIn("best_f1", metrics)
        self.assertIn("auroc", metrics)
        
        # Verify AUROC was calculated (might be 0.0 or 1.0 depending on predictions, but must exist as float)
        self.assertIsInstance(metrics["auroc"], float)
        
        # Verify checkpoint exists
        ckpt_file = os.path.join(self.output_dir, "best_model.pt")
        self.assertTrue(os.path.exists(ckpt_file), "best_model.pt was not saved")
        
        # Verify scaler exists
        scaler_file = os.path.join(self.output_dir, "v5_scaler.json")
        self.assertTrue(os.path.exists(scaler_file), "v5_scaler.json was not saved")

    def test_singleton_batch_does_not_crash(self):
        root_dir = Path(__file__).resolve().parent.parent
        script_path = os.path.join(root_dir, "experiments", "v5_modernbert", "train_v5.py")
        
        # We have 6 total samples (3 human, 3 AI).
        # Using a batch size of 5 will leave 1 sample in the final batch.
        # Without drop_last=True, BatchNorm1d would crash during model.train().
        cmd = [
            sys.executable, script_path,
            "--train_data", self.train_data,
            "--val_data", self.val_data,
            "--epochs", "1",
            "--batch_size", "5",
            "--output_dir", self.output_dir,
            "--max_train_samples", "6",
            "--max_val_samples", "6"
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            print(result.stdout)
            print(result.stderr)
        self.assertEqual(result.returncode, 0, "Training crashed on singleton batch!")

if __name__ == "__main__":
    unittest.main()
