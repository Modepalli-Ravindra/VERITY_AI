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
        if os.path.exists(ckpt_path):
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
        
    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
        
    def analyze(self, text: str):
        start_time = time.time()
        
        tokens = self.tokenizer(text, max_length=self.config.max_sequence_length, padding='max_length', truncation=True, return_tensors='pt')
        
        try:
            stylo = StylometricExtractor.get_vector(text)
            if len(stylo) != 20: stylo = [0.0] * 20
        except:
            stylo = [0.0] * 20
            
        stylo_scaled = self.scaler.transform(stylo)
        stylo_tensor = torch.tensor(stylo_scaled, dtype=torch.float32).unsqueeze(0)
        
        with torch.no_grad():
            logits = self.model(tokens['input_ids'].to(self.device), tokens['attention_mask'].to(self.device), stylo_tensor.to(self.device))
            prob = torch.sigmoid(logits).item()
            
        inf_time = (time.time() - start_time) * 1000
        
        predicted_class = "AI" if prob >= self.config.threshold else "Human"
        
        return {
            "ai_probability": prob,
            "predicted_class": predicted_class,
            "threshold": self.config.threshold,
            "inference_time_ms": inf_time,
            "model_version": "V5-ModernBERT"
        }
