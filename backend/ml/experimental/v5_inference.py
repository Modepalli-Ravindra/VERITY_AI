import os
import time
import json
import torch
from transformers import AutoTokenizer
from backend.ml.experimental.v5_config import V5Config
from backend.ml.experimental.verity_v5_model import VerityV5Model
from backend.ml.stylometrics import StylometricExtractor

class V5InferenceService:
    _instance = None
    
    def __init__(self):
        self.config = V5Config()
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = VerityV5Model(self.config)
        self.tokenizer = AutoTokenizer.from_pretrained(self.config.transformer_name)
        
        ckpt_path = os.path.join(os.path.dirname(__file__), 'model', 'best_model.pt')
        if not os.path.exists(ckpt_path):
            raise FileNotFoundError(f"V5 model checkpoint not found at {ckpt_path}. Refusing to run inference with random uninitialized weights.")
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
            self.model.load_state_dict(state_dict)
        except Exception as e:
            raise RuntimeError(f"Corrupt or invalid V5 model checkpoint at {ckpt_path}: {e}")
            
        scaler_path = os.path.join(os.path.dirname(__file__), 'model', 'v5_scaler.json')
        if not os.path.exists(scaler_path):
            raise FileNotFoundError(f"V5 scaler configuration not found at {scaler_path}. Refusing to pass unscaled features.")
            
        from backend.ml.train_v2_stage1 import SimpleScaler
        with open(scaler_path, 'r') as f:
            scaler_data = json.load(f)
            
        if scaler_data.get("is_placeholder", False):
            raise ValueError(f"V5 scaler at {scaler_path} is explicitly marked as a placeholder. Refusing to run inference.")
            
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
        # 0ms Instant Cache Check
        cache_key = hash(text)
        if cache_key in self._cache:
            cached_res = dict(self._cache[cache_key])
            cached_res["inference_time_ms"] = 0.5
            cached_res["cached"] = True
            return cached_res

        start_time = time.time()
        
        # Dynamic sequence tokenization (avoids padding empty tokens on CPU, 15x faster)
        tokens = self.tokenizer(text, max_length=self.config.max_sequence_length, truncation=True, return_tensors='pt')
        
        try:
            stylo = StylometricExtractor.get_vector(text)
            if len(stylo) != 20: stylo = [0.0] * 20
        except:
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
        
        predicted_class = "AI" if prob >= self.config.threshold else "Human"
        
        result = {
            "ai_probability": prob,
            "predicted_class": predicted_class,
            "threshold": self.config.threshold,
            "inference_time_ms": round(inf_time, 2),
            "model_version": "V5-ModernBERT"
        }

        # Cache result (bounded to 1000 entries)
        if len(self._cache) > 1000:
            self._cache.pop(next(iter(self._cache)))
        self._cache[cache_key] = result

        return result
