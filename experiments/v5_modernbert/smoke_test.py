import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
import torch
from backend.ml.experimental.v5_config import V5Config
from backend.ml.experimental.verity_v5_model import VerityV5Model

def run_smoke_test():
    print("Running V5 Smoke Test...")
    config = V5Config()
    
    # Force CPU for smoke test
    config.device = "cpu"
    
    model = VerityV5Model(config)
    
    # Dummy inputs
    bsz = 2
    seq_len = 32
    input_ids = torch.randint(0, 1000, (bsz, seq_len))
    attention_mask = torch.ones((bsz, seq_len))
    stylometric_x = torch.randn((bsz, config.stylometric_dimension))
    
    # Forward pass
    with torch.no_grad():
        logits = model(input_ids, attention_mask, stylometric_x)
        probs = torch.sigmoid(logits)
        
    print(f"Semantic Dim: {config.semantic_dimension}")
    print(f"Stylometric Dim: {config.stylometric_dimension}")
    print(f"Fusion Dim: {config.fusion_dimension}")
    print(f"Logits shape: {logits.shape}")
    print(f"Probs: {probs}")
    
    assert logits.shape == (bsz,), "Logits shape mismatch"
    print("Smoke test PASSED.")

if __name__ == "__main__":
    run_smoke_test()
