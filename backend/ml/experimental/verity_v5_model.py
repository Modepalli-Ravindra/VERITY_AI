try:
    import torch
    import torch.nn as nn
    _ModuleBase = nn.Module
except ImportError:
    torch = None
    nn = None
    _ModuleBase = object

from backend.ml.verity_model import VerityFusionClassifier
from backend.ml.experimental.modernbert_encoder import ModernBERTEncoder
from backend.ml.experimental.v5_config import V5Config

class VerityV5Model(_ModuleBase):
    """
    Isolated V5 Experimental Model Architecture using ModernBERT.
    Reuses the 320-D fusion architecture but uses ModernBERT as the semantic encoder.
    """
    def __init__(self, config: V5Config, local_files_only: bool = False):
        if nn is not None:
            super().__init__()
            self.config = config
            self.encoder = ModernBERTEncoder(config, local_files_only=local_files_only)
            
            # Reuse existing stable fusion classifier
            self.fusion_head = VerityFusionClassifier(
                semantic_dim=config.semantic_dimension,
                stylometric_dim=config.stylometric_dimension,
                sem_proj_dim=config.semantic_projection_dimension,
                sty_proj_dim=config.stylometric_projection_dimension
            )

    def forward(self, input_ids, attention_mask, stylometric_x):
        sem_emb = self.encoder(input_ids, attention_mask)
        logits = self.fusion_head(sem_emb, stylometric_x)
        return logits
