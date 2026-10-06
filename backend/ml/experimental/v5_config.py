from pydantic import BaseModel
from typing import Optional

class V5Config(BaseModel):
    model_version: str = "v5-experimental"
    model_type: str = "ModernBERT"
    transformer_name: str = "answerdotai/ModernBERT-base"
    checkpoint_path: Optional[str] = None
    semantic_dimension: int = 768
    semantic_projection_dimension: int = 256
    stylometric_dimension: int = 20
    stylometric_projection_dimension: int = 64
    fusion_dimension: int = 320
    threshold: float = 0.70
    max_sequence_length: int = 512
    device: str = "cpu"
    v5_enabled: bool = False
