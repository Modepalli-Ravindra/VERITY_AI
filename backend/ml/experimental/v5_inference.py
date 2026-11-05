import os
import time
import json
import logging

try:
    import torch
    from transformers import AutoTokenizer
except ImportError:
    torch = None
    AutoTokenizer = None

from backend.ml.experimental.v5_config import V5Config
from backend.ml.experimental.verity_v5_model import VerityV5Model
from backend.ml.stylometrics import StylometricExtractor

logger = logging.getLogger("verity.v5_inference")

class V5InferenceService:
    _instance = None
    _download_started = False
    
    def __init__(self):
        if torch is None or AutoTokenizer is None:
            raise RuntimeError("PyTorch and Transformers are required to run V5 inference.")

        self.config = V5Config()
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        # 1. Check local model checkpoint
        ckpt_path = os.path.join(os.path.dirname(__file__), 'model', 'best_model.pt')
        if not os.path.exists(ckpt_path):
            raise FileNotFoundError(f"V5 model checkpoint not found at {ckpt_path}. Refusing to run inference with random uninitialized weights.")
        
        scaler_path = os.path.join(os.path.dirname(__file__), 'model', 'v5_scaler.json')
        if not os.path.exists(scaler_path):
            raise FileNotFoundError(f"V5 scaler configuration not found at {scaler_path}. Refusing to pass unscaled features.")

        # 2. Check if ModernBERT is available in local cache or needs background loading
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(self.config.transformer_name, local_files_only=True)
            self.model = VerityV5Model(self.config, local_files_only=True)
        except Exception as load_err:
            if not V5InferenceService._download_started:
                import threading
                V5InferenceService._download_started = True

                def _bg_download_v5():
                    try:
                        logger.info("Starting background synchronization of ModernBERT weights...")
                        from transformers import AutoModel, AutoTokenizer
                        AutoTokenizer.from_pretrained(self.config.transformer_name)
                        AutoModel.from_pretrained(self.config.transformer_name)
                        logger.info("ModernBERT weights synchronized and cached successfully!")
                        V5InferenceService._instance = None
                    except Exception as err:
                        logger.warning(f"ModernBERT background sync error: {err}")
                    finally:
                        V5InferenceService._download_started = False

                t = threading.Thread(target=_bg_download_v5, daemon=True, name="modernbert-loader")
                t.start()

            raise RuntimeError(f"ModernBERT weights not locally cached ({load_err}). Background download initiated.")

        # 3. Load checkpoint state dict into fusion head
        try:
            checkpoint = torch.load(ckpt_path, map_location=self.device)
            if isinstance(checkpoint, dict):
                state_dict = checkpoint.get('model_state_dict', checkpoint)
                if 'threshold' in checkpoint:
                    self.config.threshold = checkpoint['threshold']
                if 'max_length' in checkpoint:
                    self.config.max_sequence_length = checkpoint['max_length']
            else:
                state_dict = checkpoint

            if any(k.startswith("fusion_head.") for k in state_dict.keys()):
                self.model.load_state_dict(state_dict, strict=False)
            else:
                self.model.fusion_head.load_state_dict(state_dict, strict=False)
        except Exception as e:
            raise RuntimeError(f"Failed to load V5 model weights: {e}")
            
        from backend.ml.train_v2_stage1 import SimpleScaler
        with open(scaler_path, 'r') as f:
            scaler_data = json.load(f)
            
        if scaler_data.get("is_placeholder", False):
            raise ValueError(f"V5 scaler at {scaler_path} is explicitly marked as a placeholder.")
            
        self.scaler = SimpleScaler()
        self.scaler.mean = scaler_data['mean']
        self.scaler.std = scaler_data['std']
            
        self.model.to(self.device)
        self.model.eval()
        self._cache = {}
        
    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
        
    def analyze(self, text: str):
        if torch is None:
            raise RuntimeError("PyTorch is not available for inference.")
        
        cache_key = hash(text)
        if cache_key in self._cache:
            cached_res = dict(self._cache[cache_key])
            cached_res["inference_time_ms"] = 0.5
            cached_res["cached"] = True
            return cached_res

        start_time = time.time()
        tokens = self.tokenizer(text, max_length=self.config.max_sequence_length, truncation=True, return_tensors='pt')
        
        try:
            stylo = StylometricExtractor.get_vector(text)
            if len(stylo) != 20: stylo = [0.0] * 20
        except Exception:
            stylo = [0.0] * 20
            
        stylo_scaled = self.scaler.transform(stylo)
        stylo_tensor = torch.tensor(stylo_scaled, dtype=torch.float32).unsqueeze(0)
        
        with torch.inference_mode():
            logits = self.model(tokens['input_ids'].to(self.device), tokens['attention_mask'].to(self.device), stylo_tensor.to(self.device))
            raw_prob = torch.sigmoid(logits).item()
            import math
            if math.isnan(raw_prob) or math.isinf(raw_prob):
                raise ValueError("V5 model output produced non-finite probability value.")
            prob = max(0.0, min(1.0, float(raw_prob)))
            
        inf_time = (time.time() - start_time) * 1000
        
        predicted_class = "Likely AI Generated" if prob >= self.config.threshold else "Likely Human Written"
        
        result = {
            "ai_probability": prob,
            "predicted_class": predicted_class,
            "classification": predicted_class,
            "threshold": self.config.threshold,
            "inference_time_ms": round(inf_time, 2),
            "model_version": "ModernBERT-V5"
        }

        if len(self._cache) > 1000:
            self._cache.pop(next(iter(self._cache)))
        self._cache[cache_key] = result

        return result
