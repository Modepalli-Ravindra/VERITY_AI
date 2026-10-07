import os
import sys
import torch
import time
import json
from transformers import AutoTokenizer

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from backend.ml.experimental.v5_config import V5Config
from backend.ml.experimental.verity_v5_model import VerityV5Model
from backend.ml.stylometrics import StylometricExtractor

def verify():
    ckpt_path = "backend/ml/experimental/model/best_model.pt"
    if not os.path.exists(ckpt_path):
        print(f"File not found: {ckpt_path}")
        return
        
    print(f"Loading checkpoint from {ckpt_path} with map_location='cpu'...")
    checkpoint = torch.load(ckpt_path, map_location="cpu")
    
    print("\n--- 1. Checkpoint Structure ---")
    if isinstance(checkpoint, dict):
        print(f"Keys: {list(checkpoint.keys())}")
        print(f"Epoch: {checkpoint.get('epoch', 'N/A')}")
        print(f"Threshold: {checkpoint.get('threshold', 'N/A')}")
        print(f"Max Length: {checkpoint.get('max_length', 'N/A')}")
        print(f"Config keys: {list(checkpoint.get('config', {}).keys()) if 'config' in checkpoint else 'N/A'}")
        state_dict = checkpoint.get("model_state_dict", checkpoint)
    else:
        print("Checkpoint is a raw state_dict")
        state_dict = checkpoint
        
    print(f"State Dict Parameter Count: {len(state_dict.keys())}")
    
    print("\n--- 2. Architecture Verification ---")
    config = V5Config()
    model = VerityV5Model(config)
    
    # ModernBERT embedding -> 768
    print(f"ModernBERT hidden size: {config.semantic_dimension} (expected 768)")
    print(f"Semantic projection: {config.semantic_dimension} -> {config.semantic_projection_dimension} (expected 768 -> 256)")
    print(f"Stylometric projection: {config.stylometric_dimension} -> {config.stylometric_projection_dimension} (expected 20 -> 64)")
    
    expected_fusion_dim = config.semantic_projection_dimension + config.stylometric_projection_dimension
    print(f"Fusion dimension: {config.semantic_projection_dimension} + {config.stylometric_projection_dimension} -> {expected_fusion_dim} (expected 320)")
    
    print("\nState Dict shape matches:")
    for key, tensor in state_dict.items():
        if "sem_proj" in key or "sty_proj" in key or "classifier" in key:
            print(f"  {key}: {tensor.shape}")
            
    # Load state dict
    try:
        model.load_state_dict(state_dict)
        print("\nCheckpoint loaded into V5 architecture successfully.")
    except Exception as e:
        print(f"\nFailed to load checkpoint: {e}")
        return
        
    model.eval()
    
    print("\n--- 3. Real Inference Test ---")
    text = "Artificial intelligence represents a significant advancement in computer science, enabling machines to perform tasks that typically require human cognitive functions."
    
    tokenizer = AutoTokenizer.from_pretrained(config.transformer_name)
    tokens = tokenizer(text, max_length=config.max_sequence_length, padding='max_length', truncation=True, return_tensors='pt')
    
    try:
        stylo = StylometricExtractor.get_vector(text)
        if len(stylo) != 20: stylo = [0.0] * 20
    except:
        stylo = [0.0] * 20
        
    stylo_tensor = torch.tensor(stylo, dtype=torch.float32).unsqueeze(0)
    
    start_time = time.time()
    with torch.no_grad():
        logits = model(tokens['input_ids'], tokens['attention_mask'], stylo_tensor)
        prob = torch.sigmoid(logits).item()
        
    inf_time = (time.time() - start_time) * 1000
    
    threshold = checkpoint.get("threshold", config.threshold) if isinstance(checkpoint, dict) else config.threshold
    predicted_class = "AI" if prob >= threshold else "Human"
    
    print(f"Text: '{text}'")
    print(f"AI Probability: {prob:.4f}")
    print(f"Predicted Class: {predicted_class} (threshold: {threshold})")
    print(f"Inference Time: {inf_time:.2f} ms")

if __name__ == "__main__":
    verify()
