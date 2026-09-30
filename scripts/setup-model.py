import os
import sys
from pathlib import Path

# Ensure project root is in python path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from dotenv import load_dotenv
load_dotenv(ROOT_DIR / ".env")

def main():
    print("VERITY ML MODEL SETUP", flush=True)
    print("---------------------", flush=True)
    
    # 1. Check Dependencies
    try:
        import torch
        import transformers
    except ImportError as e:
        print(f"Error: Required ML dependencies are missing ({str(e)}).", flush=True)
        print("Please run: pip install -r backend/requirements.txt", flush=True)
        sys.exit(1)

    model_name = os.getenv("VERITY_TRANSFORMER_MODEL", "distilroberta-base")
    device = "cuda" if torch.cuda.is_available() else "cpu"

    print(f"Model: {model_name}", flush=True)
    print(f"Device: {device.upper()}", flush=True)
    print("Downloading model...", flush=True)

    try:
        from backend.ml.transformer_model import TransformerModelManager
        
        # Load and cache model
        model, tokenizer = TransformerModelManager.load_model()
        print("Model downloaded successfully.", flush=True)
        print("Tokenizer verified.", flush=True)

        # Test inference pass
        result = TransformerModelManager.run_inference_test("Testing VERITY model setup.")
        emb_dim = result["features"]["embedding_dim"]
        print(f"Inference test passed.", flush=True)
        print("VERITY Transformer model is ready.", flush=True)
        sys.exit(0)

    except Exception as err:
        print("\nSetup Failed!", flush=True)
        print(f"Error: {str(err)}", flush=True)
        print("\nTroubleshooting:", flush=True)
        print("1. If this is a first-time setup, ensure active internet access to download weights from HuggingFace.", flush=True)
        print("2. Check that disk space has at least 1 GB available.", flush=True)
        sys.exit(1)

if __name__ == "__main__":
    main()
