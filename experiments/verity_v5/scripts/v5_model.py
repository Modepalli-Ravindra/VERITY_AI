import torch
import torch.nn as nn
from typing import Dict, Any

class VerityV5FusionClassifier(nn.Module):
    """
    Experimental V5 Neural Feature Fusion Detector Architecture.
    Fuses:
    - 768-D Transformer Semantic Representation
    - 20-D Stylometric Features
    - 12-D NLP Linguistic Features
    """
    def __init__(self, semantic_dim: int = 768, stylometric_dim: int = 20, nlp_dim: int = 12, 
                 sem_proj_dim: int = 256, sty_proj_dim: int = 64, nlp_proj_dim: int = 64):
        super().__init__()
        self.semantic_dim = semantic_dim
        self.stylometric_dim = stylometric_dim
        self.nlp_dim = nlp_dim
        
        self.semantic_proj = nn.Sequential(
            nn.Linear(semantic_dim, sem_proj_dim),
            nn.BatchNorm1d(sem_proj_dim),
            nn.ReLU(),
            nn.Dropout(0.2)
        )
        
        self.stylometric_proj = nn.Sequential(
            nn.Linear(stylometric_dim, sty_proj_dim),
            nn.BatchNorm1d(sty_proj_dim),
            nn.ReLU(),
            nn.Dropout(0.2)
        )
        
        self.nlp_proj = nn.Sequential(
            nn.Linear(nlp_dim, nlp_proj_dim),
            nn.BatchNorm1d(nlp_proj_dim),
            nn.ReLU(),
            nn.Dropout(0.2)
        )
        
        fused_dim = sem_proj_dim + sty_proj_dim + nlp_proj_dim # 256 + 64 + 64 = 384-D
        self.classifier = nn.Sequential(
            nn.Linear(fused_dim, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, 1)
        )

    def forward(self, semantic_x: torch.Tensor, stylometric_x: torch.Tensor, nlp_x: torch.Tensor) -> torch.Tensor:
        sem_feat = self.semantic_proj(semantic_x)
        sty_feat = self.stylometric_proj(stylometric_x)
        nlp_feat = self.nlp_proj(nlp_x)
        fused = torch.cat([sem_feat, sty_feat, nlp_feat], dim=-1)
        logits = self.classifier(fused)
        return logits.squeeze(-1)

from transformers import AutoModel

class VerityV5FullModel(nn.Module):
    def __init__(self, transformer_name="distilroberta-base", fusion_classifier=None):
        super().__init__()
        self.transformer = AutoModel.from_pretrained(transformer_name)
        for param in self.transformer.parameters():
            param.requires_grad = False
            
        if fusion_classifier is not None:
            self.fusion_head = fusion_classifier
        else:
            self.fusion_head = VerityV5FusionClassifier()

    def extract_semantic_embedding(self, input_ids, attention_mask):
        outputs = self.transformer(input_ids=input_ids, attention_mask=attention_mask)
        last_hidden = outputs.last_hidden_state
        mask = attention_mask.unsqueeze(-1)
        sem_emb = (last_hidden * mask).sum(dim=1) / mask.sum(dim=1).clamp(min=1e-9)
        return sem_emb

    def forward(self, input_ids, attention_mask, stylometric_x, nlp_x):
        sem_emb = self.extract_semantic_embedding(input_ids, attention_mask)
        logits = self.fusion_head(sem_emb, stylometric_x, nlp_x)
        return logits
