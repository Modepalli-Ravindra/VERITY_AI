import torch
import torch.nn as nn
from typing import Dict, Any

class VerityFusionClassifier(nn.Module):
    """
    Production Neural Feature Fusion Detector Architecture for VERITY.
    Fuses 768-dimensional Transformer Semantic Representations with
    20-dimensional Normalized Stylometric Feature Vectors into a joint
    320-dimensional representation for trained binary AI detection.
    """
    def __init__(self, semantic_dim: int = 768, stylometric_dim: int = 20, sem_proj_dim: int = 256, sty_proj_dim: int = 64):
        super().__init__()
        self.semantic_dim = semantic_dim
        self.stylometric_dim = stylometric_dim
        
        # 1. Semantic Projection Branch
        self.semantic_proj = nn.Sequential(
            nn.Linear(semantic_dim, sem_proj_dim),
            nn.BatchNorm1d(sem_proj_dim),
            nn.ReLU(),
            nn.Dropout(0.2)
        )
        
        # 2. Stylometric Projection Branch
        self.stylometric_proj = nn.Sequential(
            nn.Linear(stylometric_dim, sty_proj_dim),
            nn.BatchNorm1d(sty_proj_dim),
            nn.ReLU(),
            nn.Dropout(0.2)
        )
        
        # 3. Feature Fusion & Classification Head
        fused_dim = sem_proj_dim + sty_proj_dim  # 256 + 64 = 320-D
        self.classifier = nn.Sequential(
            nn.Linear(fused_dim, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, 1)
        )

    def forward(self, semantic_x: torch.Tensor, stylometric_x: torch.Tensor) -> torch.Tensor:
        sem_feat = self.semantic_proj(semantic_x)
        sty_feat = self.stylometric_proj(stylometric_x)
        fused = torch.cat([sem_feat, sty_feat], dim=-1)
        logits = self.classifier(fused)
        return logits.squeeze(-1)


class VerityTransformerOnlyClassifier(nn.Module):
    """
    Ablation Architecture A: Transformer Semantic Vector Only.
    """
    def __init__(self, semantic_dim: int = 768, sem_proj_dim: int = 256):
        super().__init__()
        self.semantic_proj = nn.Sequential(
            nn.Linear(semantic_dim, sem_proj_dim),
            nn.BatchNorm1d(sem_proj_dim),
            nn.ReLU(),
            nn.Dropout(0.2)
        )
        self.classifier = nn.Sequential(
            nn.Linear(sem_proj_dim, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, 1)
        )

    def forward(self, semantic_x: torch.Tensor, stylometric_x: torch.Tensor = None) -> torch.Tensor:
        sem_feat = self.semantic_proj(semantic_x)
        logits = self.classifier(sem_feat)
        return logits.squeeze(-1)


class VerityStylometricOnlyClassifier(nn.Module):
    """
    Ablation Architecture B: Stylometric Feature Vector Only.
    """
    def __init__(self, stylometric_dim: int = 20, sty_proj_dim: int = 64):
        super().__init__()
        self.stylometric_proj = nn.Sequential(
            nn.Linear(stylometric_dim, sty_proj_dim),
            nn.BatchNorm1d(sty_proj_dim),
            nn.ReLU(),
            nn.Dropout(0.2)
        )
        self.classifier = nn.Sequential(
            nn.Linear(sty_proj_dim, 32),
            nn.BatchNorm1d(32),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(32, 1)
        )

    def forward(self, stylometric_x: torch.Tensor, semantic_x: torch.Tensor = None) -> torch.Tensor:
        sty_feat = self.stylometric_proj(stylometric_x)
        logits = self.classifier(sty_feat)
        return logits.squeeze(-1)
