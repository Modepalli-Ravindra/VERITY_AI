import os
import sys
import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional

import torch

root_dir = Path(__file__).resolve().parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.ml.stylometrics import StylometricExtractor
from backend.ml.verity_model import VerityFusionClassifier

logger = logging.getLogger("verity.fusion_model")


class SimpleScaler:
    def __init__(self):
        self.mean = []
        self.std = []

    def load_dict(self, d: Dict[str, Any]):
        self.mean = d["mean"]
        self.std = d["std"]

    def transform(self, vector: list[float]) -> list[float]:
        scaled = []
        for v, m, s in zip(vector, self.mean, self.std):
            denom = s if s > 1e-7 else 1.0
            scaled.append((v - m) / denom)
        return scaled


class FeatureFusionDetector:
    """
    Trained Real ML VERITY Detector:
    Fuses 768-D Transformer (DistilRoBERTa) semantic representation with
    20-D Stylometric features into a learned 320-D representation, evaluated
    by a trained PyTorch Binary Classification Head at a strictly locked validation threshold.
    """

    _cached_model: Optional[VerityFusionClassifier] = None
    _cached_scaler: Optional[SimpleScaler] = None
    _cached_threshold: float = 0.50
    _cached_config: Optional[Dict[str, Any]] = None
    _is_model_available: Optional[bool] = None

    @classmethod
    def get_active_model_dir(cls) -> str:
        v4b_dir = os.path.join(root_dir, "experiments", "verity_v4", "v4b", "model")
        v2_dir = os.path.join(root_dir, "backend", "models", "verity_detector_v2")
        v1_dir = os.path.join(root_dir, "backend", "models", "verity_detector")
        
        v4b_model = os.path.join(v4b_dir, "best_model.pt")
        if os.path.exists(v4b_model):
            return v4b_dir
            
        v2_model = os.path.join(v2_dir, "best_model.pt")
        v2_config = os.path.join(v2_dir, "config.json")
        v2_scaler = os.path.join(v2_dir, "stylometric_scaler.json")
        
        if os.path.exists(v2_model) and os.path.exists(v2_config) and os.path.exists(v2_scaler):
            return v2_dir
        return v1_dir

    @classmethod
    def is_trained_model_available(cls) -> bool:
        """
        Checks if trained PyTorch model weights, configuration, and feature scaler exist.
        """
        model_dir = cls.get_active_model_dir()
        model_path = os.path.join(model_dir, "best_model.pt")
        config_path = os.path.join(model_dir, "config.json")
        scaler_path = os.path.join(model_dir, "stylometric_scaler.json")

        return (
            os.path.exists(model_path)
            and os.path.exists(config_path)
            and os.path.exists(scaler_path)
        )

    @classmethod
    def load_detector(cls) -> bool:
        if cls._cached_model is not None and cls._cached_scaler is not None:
            return True

        if not cls.is_trained_model_available():
            cls._is_model_available = False
            return False

        try:
            model_dir = cls.get_active_model_dir()
            model_path = os.path.join(model_dir, "best_model.pt")
            config_path = os.path.join(model_dir, "config.json")
            scaler_path = os.path.join(model_dir, "stylometric_scaler.json")

            with open(config_path, "r", encoding="utf-8") as f:
                cls._cached_config = json.load(f)

            with open(scaler_path, "r", encoding="utf-8") as f:
                scaler_dict = json.load(f)

            scaler = SimpleScaler()
            scaler.load_dict(scaler_dict)
            cls._cached_scaler = scaler

            cls._cached_threshold = float(cls._cached_config.get("selected_threshold", 0.50))

            device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            model = VerityFusionClassifier(
                semantic_dim=cls._cached_config.get("semantic_dim", 768),
                stylometric_dim=cls._cached_config.get("stylometric_dim", 20),
                sem_proj_dim=cls._cached_config.get("sem_proj_dim", 256),
                sty_proj_dim=cls._cached_config.get("sty_proj_dim", 64)
            ).to(device)

            model.load_state_dict(torch.load(model_path, map_location=device))
            model.eval()

            cls._cached_model = model
            cls._is_model_available = True
            logger.info(f"Loaded trained VERITY detector successfully. Locked Threshold: {cls._cached_threshold:.2f}")
            return True
        except Exception as e:
            logger.error(f"Failed to load trained VERITY detector: {e}")
            cls._is_model_available = False
            return False

    @classmethod
    def evaluate(cls, text: str) -> Dict[str, Any]:
        """
        Evaluates input text using the trained PyTorch VERITY Fusion Classifier.
        Returns strict error response if trained model is unavailable.
        """
        if not cls.load_detector():
            return {
                "status": "unavailable",
                "error": "Trained VERITY detector model is currently unavailable. Please run backend/ml/train_verity.py first.",
                "code": 503,
                "detection_engine": "unavailable"
            }

        from backend.ml.text_preprocessing import preprocess_text
        from backend.ml.transformer_model import TransformerModelManager

        clean_text = preprocess_text(text)

        # Extract 20-D stylometric features
        raw_sty_vector = StylometricExtractor.get_vector(clean_text)
        scaled_sty_vector = cls._cached_scaler.transform(raw_sty_vector)

        # Extract 768-D semantic features via DistilRoBERTa
        transformer_features = TransformerModelManager.extract_features(clean_text)
        sem_vector = transformer_features.get("embedding_sample", [0.0] * 768)

        if len(sem_vector) != 768:
            sem_vector = sem_vector + [0.0] * (768 - len(sem_vector))
            sem_vector = sem_vector[:768]

        device = next(cls._cached_model.parameters()).device
        sem_tensor = torch.tensor([sem_vector], dtype=torch.float32, device=device)
        sty_tensor = torch.tensor([scaled_sty_vector], dtype=torch.float32, device=device)

        with torch.no_grad():
            logit = cls._cached_model(sem_tensor, sty_tensor)
            ai_prob = float(torch.sigmoid(logit).cpu().item())

        ai_prob = round(ai_prob, 4)
        human_prob = round(1.0 - ai_prob, 4)
        threshold = cls._cached_threshold

        if ai_prob >= threshold:
            classification = "Likely AI Generated"
        else:
            classification = "Likely Human Written"

        diff = abs(ai_prob - threshold)
        if diff >= 0.25:
            confidence = "High"
        elif diff >= 0.12:
            confidence = "Medium"
        else:
            confidence = "Low"

        stylometrics_full = StylometricExtractor.extract_features(text)

        if classification == "Likely AI Generated":
            explanation = f"Analysis indicates strong semantic and structural patterns consistent with AI generation ({confidence} confidence)."
        else:
            explanation = f"Analysis indicates natural variations in stylometrics and semantics consistent with human writing ({confidence} confidence)."

        return {
            "classification": classification,
            "ai_probability": ai_prob,
            "human_probability": human_prob,
            "confidence": confidence,
            "explanation": explanation,
            "stylometric_features": stylometrics_full,
            "detection_engine": "local_transformer",
            "provider": "local_transformer",
            "status": "success",
            "semantic_available": True,
            "locked_threshold": threshold
        }

    @classmethod
    def evaluate_with_transformer(cls, text: str, transformer_features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Alias for evaluate() for backwards compatibility.
        """
        return cls.evaluate(text)
