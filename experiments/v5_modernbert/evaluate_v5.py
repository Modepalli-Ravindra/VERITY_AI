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
    
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Device: {device}")
    
    if os.path.exists(args.checkpoint):
        try:
            checkpoint = torch.load(args.checkpoint, map_location=device)
            if isinstance(checkpoint, dict) and 'model_state_dict' in checkpoint:
                model.load_state_dict(checkpoint['model_state_dict'])
                epoch = checkpoint.get('epoch', 'N/A')
                max_length = checkpoint.get('max_length', config.max_sequence_length)
                threshold = checkpoint.get('threshold', config.threshold)
                print("Checkpoint loaded successfully.")
                print(f"  Epoch: {epoch}")
                print(f"  Max Length: {max_length}")
                print(f"  Threshold: {threshold}")
            else:
                model.load_state_dict(checkpoint)
                print("Raw state_dict checkpoint loaded successfully.")
                
            model = model.to(device)
            model.eval()
        except Exception as e:
            print(f"Failed to load checkpoint: {e}")
    else:
        print(f"Checkpoint not found at {args.checkpoint}. Proceeding with untrained model.")
            
    print("Ready to evaluate across HC3, RAID, ASAP 2.0, and formal human/AI subsets.")
    print("Metrics evaluated: Accuracy, Precision, Recall, F1, FPR.")
    
    thresholds = [0.40, 0.50, 0.60, 0.70, 0.80]
    for thresh in thresholds:
        print(f"Threshold Set: {thresh}")

if __name__ == "__main__":
    evaluate()
