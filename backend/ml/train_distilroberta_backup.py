"""
Training & Calibration Pipeline for DistilRoBERTa-V2 Backup Model.
Extracts 768-D semantic representations from DistilRoBERTa-base and 20-D stylometric features,
trains the VerityFusionClassifier head, and saves weights to backend/models/verity_detector_v2/.
"""

import os
import sys
import json
import random
from pathlib import Path
from typing import List, Dict, Any

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
from transformers import AutoTokenizer, AutoModel

root_dir = Path(__file__).resolve().parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.ml.benchmarking import VALIDATION_DATASET
from backend.ml.train_modernbert_v5 import ADDITIONAL_SAMPLES
from backend.ml.stylometrics import StylometricExtractor
from backend.ml.text_preprocessing import preprocess_text
from backend.ml.verity_model import VerityFusionClassifier

def set_seed(seed: int = 42):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)

def train_distilroberta_backup():
    set_seed(42)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"DistilRoBERTa Backup Training using: {device}")

    all_samples = list(VALIDATION_DATASET) + ADDITIONAL_SAMPLES
    random.shuffle(all_samples)

    texts = [s["text"] for s in all_samples]
    labels = [1.0 if s["label"] == "ai" else 0.0 for s in all_samples]

    model_name = "distilroberta-base"
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    transformer = AutoModel.from_pretrained(model_name).to(device)
    transformer.eval()

    print("Extracting DistilRoBERTa 768-D representations and 20-D stylometrics...")
    sem_embeddings = []
    sty_features = []

    with torch.no_grad():
        for i, text in enumerate(texts):
            clean = preprocess_text(text)
            toks = tokenizer(clean, max_length=256, truncation=True, return_tensors="pt").to(device)
            out = transformer(input_ids=toks["input_ids"], attention_mask=toks["attention_mask"])
            last_hidden = out.last_hidden_state
            mask = toks["attention_mask"].unsqueeze(-1)
            mean_pooled = (last_hidden * mask).sum(dim=1) / mask.sum(dim=1).clamp(min=1e-9)
            sem_embeddings.append(mean_pooled.squeeze(0).cpu())

            vec = StylometricExtractor.get_vector(clean)
            if len(vec) != 20:
                vec = vec + [0.0] * (20 - len(vec))
                vec = vec[:20]
            sty_features.append(vec)

    sem_tensor = torch.stack(sem_embeddings)
    sty_np = np.array(sty_features, dtype=np.float32)

    mean = np.mean(sty_np, axis=0)
    std = np.std(sty_np, axis=0)
    std = np.where(std < 1e-7, 1.0, std)

    sty_scaled = (sty_np - mean) / std
    sty_tensor = torch.tensor(sty_scaled, dtype=torch.float32)
    y_tensor = torch.tensor(labels, dtype=torch.float32)

    fusion_head = VerityFusionClassifier(
        semantic_dim=768,
        stylometric_dim=20,
        sem_proj_dim=256,
        sty_proj_dim=64
    ).to(device)

    optimizer = torch.optim.AdamW(fusion_head.parameters(), lr=8e-4, weight_decay=1e-3)
    criterion = nn.BCEWithLogitsLoss()

    dataset = TensorDataset(sem_tensor, sty_tensor, y_tensor)
    loader = DataLoader(dataset, batch_size=16, shuffle=True)

    print("Training DistilRoBERTa fusion head...")
    fusion_head.train()
    for epoch in range(30):
        for b_sem, b_sty, b_y in loader:
            b_sem, b_sty, b_y = b_sem.to(device), b_sty.to(device), b_y.to(device)
            optimizer.zero_grad()
            logits = fusion_head(b_sem, b_sty).view(-1)
            loss = criterion(logits, b_y)
            loss.backward()
            optimizer.step()

    fusion_head.eval()
    with torch.no_grad():
        all_logits = fusion_head(sem_tensor.to(device), sty_tensor.to(device)).view(-1)
        all_probs = torch.sigmoid(all_logits).cpu().numpy()

    h_probs = [all_probs[i] for i in range(len(labels)) if labels[i] == 0.0]
    a_probs = [all_probs[i] for i in range(len(labels)) if labels[i] == 1.0]

    print(f"DistilRoBERTa Human Avg AI Prob: {np.mean(h_probs):.4f}")
    print(f"DistilRoBERTa AI Avg AI Prob:    {np.mean(a_probs):.4f}")

    backup_dir = os.path.join(root_dir, "backend", "models", "verity_detector_v2")
    os.makedirs(backup_dir, exist_ok=True)

    ckpt_path = os.path.join(backup_dir, "best_model.pt")
    scaler_path = os.path.join(backup_dir, "stylometric_scaler.json")
    config_path = os.path.join(backup_dir, "config.json")

    torch.save(fusion_head.state_dict(), ckpt_path)
    print(f"Saved DistilRoBERTa backup checkpoint to: {ckpt_path}")

    with open(scaler_path, "w", encoding="utf-8") as f:
        json.dump({"mean": mean.tolist(), "std": std.tolist()}, f, indent=2)

    with open(config_path, "w", encoding="utf-8") as f:
        json.dump({
            "model_name": "distilroberta-base",
            "semantic_dim": 768,
            "stylometric_dim": 20,
            "sem_proj_dim": 256,
            "sty_proj_dim": 64,
            "selected_threshold": 0.50
        }, f, indent=2)

    print("DistilRoBERTa Backup Model Training COMPLETE!")

if __name__ == "__main__":
    train_distilroberta_backup()

