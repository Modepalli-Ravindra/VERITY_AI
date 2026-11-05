import os
import sys
import logging
from typing import Dict, Any, Tuple, Optional
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("verity.transformer")

class TransformerModelManager:
    """
    Singleton Manager for HuggingFace Transformer Model Infrastructure.
    Handles lazy loading, in-memory caching, CPU/CUDA auto-detection,
    and long-text chunking representation extraction.
    """
    _instance: Optional['TransformerModelManager'] = None
    _model = None
    _tokenizer = None
    _device: str = "cpu"
    _model_name: str = "distilroberta-base"
    _is_loaded: bool = False
    _load_error: Optional[str] = None
    _download_started: bool = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(TransformerModelManager, cls).__new__(cls)
        return cls._instance

    @classmethod
    def get_model_name(cls) -> str:
        name = os.getenv("VERITY_TRANSFORMER_MODEL", "distilroberta-base").strip()
        if name.lower() in ("modernbert", "v5"):
            return "answerdotai/ModernBERT-base"
        if name.lower() in ("distilroberta", "roberta", "distilroberta-v2", "v2"):
            return "distilroberta-base"
        return name or "distilroberta-base"

    @classmethod
    def get_device(cls) -> str:
        try:
            import torch
            return "cuda" if torch.cuda.is_available() else "cpu"
        except ImportError:
            return "cpu"

    @classmethod
    def load_model(cls) -> Tuple[Any, Any]:
        """
        Lazily loads and caches the HuggingFace Transformer model and tokenizer.
        Guarantees single initialization and in-memory caching.
        """
        if cls._is_loaded and cls._model is not None and cls._tokenizer is not None:
            return cls._model, cls._tokenizer

        model_name = cls.get_model_name()
        cls._model_name = model_name
        device = cls.get_device()
        cls._device = device

        logger.info(f"Initializing Transformer Model: {model_name} on device: {device}")

        try:
            import torch
            from transformers import AutoTokenizer, AutoModel

            # 1. First attempt fast local disk load (0ms if already cached)
            try:
                tokenizer = AutoTokenizer.from_pretrained(model_name, local_files_only=True)
                model = AutoModel.from_pretrained(model_name, local_files_only=True)
                model.to(device)
                model.eval()

                cls._model = model
                cls._tokenizer = tokenizer
                cls._is_loaded = True
                cls._load_error = None

                logger.info(f"Successfully loaded and cached {model_name} from local storage.")
                return model, tokenizer
            except Exception:
                pass

            # 2. Try loading tokenizer
            tokenizer = AutoTokenizer.from_pretrained(model_name)
            cls._tokenizer = tokenizer

            # 3. Check if download is already in progress in background
            if not cls._download_started:
                import threading
                cls._download_started = True

                def _bg_download():
                    try:
                        logger.info(f"Starting background download of transformer model '{model_name}'...")
                        m = AutoModel.from_pretrained(model_name)
                        m.to(device)
                        m.eval()
                        cls._model = m
                        cls._is_loaded = True
                        cls._load_error = None
                        logger.info(f"Background download of '{model_name}' completed and cached successfully!")
                    except Exception as err:
                        logger.warning(f"Background download of '{model_name}' encountered an error: {err}")
                        cls._download_started = False

                t = threading.Thread(target=_bg_download, daemon=True, name="hf-model-loader")
                t.start()

            raise RuntimeError(
                f"Transformer model '{model_name}' weights are currently synchronizing in background. Main model will activate once loaded."
            )

        except Exception as e:
            error_msg = f"Transformer model '{model_name}' status: {str(e)}"
            cls._load_error = error_msg
            logger.info(error_msg)
            raise RuntimeError(error_msg) from e

    @classmethod
    def get_status(cls) -> Dict[str, Any]:
        return {
            "model_name": cls.get_model_name(),
            "device": cls.get_device(),
            "is_loaded": cls._is_loaded,
            "load_error": cls._load_error,
            "torch_available": cls._check_torch_installed()
        }

    @classmethod
    def _check_torch_installed(cls) -> bool:
        try:
            import torch
            import transformers
            return True
        except ImportError:
            return False

    @classmethod
    def extract_features(cls, text: str, max_length: int = 512) -> Dict[str, Any]:
        """
        Extracts 768-D contextual semantic representation vector.
        Uses exact attention-mask mean pooling matching training (train_verity.py).
        """
        model, tokenizer = cls.load_model()
        import torch

        if not text.strip():
            return {
                "embedding_dim": 768,
                "embedding_sample": [0.0] * 768,
                "model_name": cls._model_name,
                "device": cls._device
            }

        with torch.inference_mode():
            inputs = tokenizer(
                text,
                max_length=max_length,
                padding="max_length",
                truncation=True,
                return_tensors="pt"
            ).to(cls._device)
            
            outputs = model(**inputs)
            last_hidden = outputs.last_hidden_state
            mask = inputs['attention_mask'].unsqueeze(-1)
            
            # Exact mean pooling matching training extraction
            final_emb = (last_hidden * mask).sum(dim=1) / mask.sum(dim=1).clamp(min=1e-9)
            vector = final_emb.squeeze(0).cpu().numpy().tolist()

            return {
                "embedding_dim": len(vector),
                "embedding_sample": vector,
                "model_name": cls._model_name,
                "device": cls._device
            }

    @classmethod
    def run_inference_test(cls, sample_text: str = "VERITY transformer model setup test.") -> Dict[str, Any]:
        model, tokenizer = cls.load_model()
        features = cls.extract_features(sample_text)
        return {
            "status": "success",
            "input_text": sample_text,
            "features": features
        }
