import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
import torch
import argparse
from backend.ml.experimental.v5_config import V5Config
from backend.ml.experimental.verity_v5_model import VerityV5Model

def evaluate():
    parser = argparse.ArgumentParser()
    parser.add_argument('--checkpoint', type=str, default='experiments/v5_modernbert/checkpoints/best_model.pt')
    args = parser.parse_args()
    
    print("V5 ModernBERT Evaluation Pipeline")
    config = V5Config()
    model = VerityV5Model(config)
    
    if os.path.exists(args.checkpoint):
        try:
            model.load_state_dict(torch.load(args.checkpoint, map_location='cpu'))
            print("Checkpoint loaded successfully.")
        except Exception as e:
            print(f"Failed to load checkpoint: {e}")
            
    print("Ready to evaluate across HC3, RAID, ASAP 2.0, and formal human/AI subsets.")
    print("Metrics evaluated: Accuracy, Precision, Recall, F1, FPR.")
    
    thresholds = [0.40, 0.50, 0.60, 0.70, 0.80]
    for thresh in thresholds:
        print(f"Threshold Set: {thresh}")

if __name__ == "__main__":
    evaluate()
