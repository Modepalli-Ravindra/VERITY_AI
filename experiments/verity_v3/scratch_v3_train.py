import os
import sys
import json
import csv
import math
import random
import time
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from transformers import AutoTokenizer, AutoModel, get_linear_schedule_with_warmup
from pathlib import Path

root_dir = Path(r"c:\Users\user\OneDrive\Desktop\VERITY")
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.ml.text_preprocessing import preprocess_text
from backend.ml.stylometrics import StylometricExtractor
from backend.ml.verity_model import VerityFusionClassifier

def set_seed(seed: int = 42):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)

class SimpleScaler:
    def __init__(self):
        self.mean = []
        self.std = []
    def fit(self, vectors):
        arr = np.array(vectors, dtype=np.float32)
        self.mean = np.mean(arr, axis=0).tolist()
        self.std = np.std(arr, axis=0).tolist()
    def transform(self, vector):
        scaled = []
        for v, m, s in zip(vector, self.mean, self.std):
            denom = s if s > 1e-7 else 1.0
            scaled.append((v - m) / denom)
        return scaled
    def to_dict(self):
        return {"mean": self.mean, "std": self.std}

class VerityV3Dataset(Dataset):
    def __init__(self, texts, labels, scaler, tokenizer, max_length=256):
        self.texts = [preprocess_text(t) for t in texts]
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_length = max_length

        from concurrent.futures import ThreadPoolExecutor
        def extract_single(t): return StylometricExtractor.get_vector(t)
        
        print("Extracting stylometric features...")
        with ThreadPoolExecutor(max_workers=8) as executor:
            raw_sty = list(executor.map(extract_single, self.texts, chunksize=500))
        self.scaled_sty = [scaler.transform(v) for v in raw_sty]

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        text = self.texts[idx]
        label = self.labels[idx]
        sty_vec = torch.tensor(self.scaled_sty[idx], dtype=torch.float32)
        enc = self.tokenizer(
            text, max_length=self.max_length, padding="max_length",
            truncation=True, return_tensors="pt"
        )
        return {
            "input_ids": enc["input_ids"].squeeze(0),
            "attention_mask": enc["attention_mask"].squeeze(0),
            "stylometric": sty_vec,
            "label": torch.tensor(label, dtype=torch.float32)
        }

class VerityFullEndToEndModel(nn.Module):
    def __init__(self, transformer_name="distilroberta-base"):
        super().__init__()
        self.transformer = AutoModel.from_pretrained(transformer_name)
        for param in self.transformer.parameters():
            param.requires_grad = False
            
        self.fusion_head = VerityFusionClassifier(
            semantic_dim=768, stylometric_dim=20, sem_proj_dim=256, sty_proj_dim=64
        )

    def extract_semantic_embedding(self, input_ids, attention_mask):
        outputs = self.transformer(input_ids=input_ids, attention_mask=attention_mask)
        last_hidden = outputs.last_hidden_state
        mask = attention_mask.unsqueeze(-1)
        sem_emb = (last_hidden * mask).sum(dim=1) / mask.sum(dim=1).clamp(min=1e-9)
        return sem_emb

    def forward(self, input_ids, attention_mask, stylometric_x):
        sem_emb = self.extract_semantic_embedding(input_ids, attention_mask)
        logits = self.fusion_head(sem_emb, stylometric_x)
        return logits

def evaluate(model, dataloader, device):
    model.eval()
    total_loss = 0.0
    criterion = nn.BCEWithLogitsLoss()
    with torch.no_grad():
        for batch in dataloader:
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            sty = batch["stylometric"].to(device)
            labels = batch["label"].to(device)
            logits = model(input_ids, attention_mask, sty)
            loss = criterion(logits, labels)
            total_loss += loss.item()
    return total_loss / len(dataloader)

def main():
    set_seed(42)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}")

    # 1. Load Data
    v3_train_path = os.path.join(root_dir, "experiments", "verity_v3", "v3_train.csv")
    texts, labels = [], []
    with open(v3_train_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            texts.append(row["text"])
            labels.append(int(row["label"]))
            
    # Train/Val Split (90/10) - subsample to 3000 due to CPU constraints
    data = list(zip(texts, labels))
    random.shuffle(data)
    data = data[:100]
    split_idx = int(len(data) * 0.9)
    train_data = data[:split_idx]
    val_data = data[split_idx:]
    
    train_texts, train_labels = zip(*train_data)
    val_texts, val_labels = zip(*val_data)
    
    # Class weights for BCEWithLogitsLoss (AI is class 1)
    # If humans (0) outnumber AI (1), pos_weight > 1
    num_human = sum(1 for l in train_labels if l == 0)
    num_ai = sum(1 for l in train_labels if l == 1)
    pos_weight = torch.tensor([num_human / num_ai]).to(device)
    print(f"Train Human: {num_human}, AI: {num_ai}, pos_weight: {pos_weight.item():.4f}")

    # 2. Scaler
    print("Fitting Scaler...")
    raw_sty_train = [StylometricExtractor.get_vector(preprocess_text(t)) for t in train_texts]
    scaler = SimpleScaler()
    scaler.fit(raw_sty_train)
    
    scaler_path = os.path.join(root_dir, "experiments", "verity_v3", "model", "stylometric_scaler.json")
    with open(scaler_path, "w", encoding="utf-8") as f:
        json.dump(scaler.to_dict(), f, indent=2)

    # 3. Datasets
    tokenizer = AutoTokenizer.from_pretrained("distilroberta-base")
    train_ds = VerityV3Dataset(train_texts, train_labels, scaler, tokenizer)
    val_ds = VerityV3Dataset(val_texts, val_labels, scaler, tokenizer)
    
    train_loader = DataLoader(train_ds, batch_size=64, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=64, shuffle=False)

    # 4. Model
    model = VerityFullEndToEndModel("distilroberta-base").to(device)
    
    # 5. Train
    optimizer = torch.optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=1e-3, weight_decay=0.01)
    epochs = 2
    total_steps = len(train_loader) * epochs
    scheduler = get_linear_schedule_with_warmup(optimizer, num_warmup_steps=int(total_steps*0.1), num_training_steps=total_steps)
    criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight)

    best_val_loss = float("inf")
    best_model_path = os.path.join(root_dir, "experiments", "verity_v3", "model", "best_model.pt")
    
    for epoch in range(1, epochs + 1):
        model.train()
        total_loss = 0
        for step, batch in enumerate(train_loader, 1):
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            sty = batch["stylometric"].to(device)
            lbls = batch["label"].to(device)

            optimizer.zero_grad()
            logits = model(input_ids, attention_mask, sty)
            loss = criterion(logits.squeeze(-1) if logits.dim() > 1 else logits, lbls)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            scheduler.step()

            total_loss += loss.item()
            if step % 10 == 0:
                print(f"Epoch {epoch} Step {step}/{len(train_loader)} Loss {loss.item():.4f}")
                sys.stdout.flush()
                
        val_loss = evaluate(model, val_loader, device)
        print(f"Epoch {epoch} Train Loss: {total_loss/len(train_loader):.4f} Val Loss: {val_loss:.4f}")
        
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            torch.save(model.fusion_head.state_dict(), best_model_path)
            print("  -> Saved new best model")

    # Config
    config_dict = {
        "model_name": "distilroberta-base",
        "semantic_dim": 768,
        "stylometric_dim": 20,
        "sem_proj_dim": 256,
        "sty_proj_dim": 64,
        "selected_threshold": 0.70,
        "training_stage": "v3_experiment",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    with open(os.path.join(root_dir, "experiments", "verity_v3", "model", "config.json"), "w") as f:
        json.dump(config_dict, f, indent=2)

if __name__ == "__main__":
    main()
