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
import argparse

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

class VerityV4Dataset(Dataset):
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

class VerityV4Model(nn.Module):
    def __init__(self, transformer_name="distilroberta-base", unfreeze_layers=1):
        super().__init__()
        self.transformer = AutoModel.from_pretrained(transformer_name)
        
        # Freeze everything first
        for param in self.transformer.parameters():
            param.requires_grad = False
            
        # Unfreeze the last N layers
        if unfreeze_layers > 0:
            layers = self.transformer.encoder.layer
            for i in range(len(layers) - unfreeze_layers, len(layers)):
                for param in layers[i].parameters():
                    param.requires_grad = True
                    
        self.fusion_head = VerityFusionClassifier(
            semantic_dim=768, stylometric_dim=20, sem_proj_dim=256, sty_proj_dim=64
        )
        
        # Initialize fusion head with V2 weights
        v2_path = os.path.join(root_dir, "backend", "models", "verity_detector_v2", "best_model.pt")
        if os.path.exists(v2_path):
            self.fusion_head.load_state_dict(torch.load(v2_path, map_location="cpu"))
            print("Loaded V2 Fusion Head Weights.")

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
            loss = criterion(logits.squeeze(-1) if logits.dim() > 1 else logits, labels)
            total_loss += loss.item()
    return total_loss / len(dataloader)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--unfreeze", type=int, default=1, help="Number of transformer layers to unfreeze (1 for V4-A, 2 for V4-B)")
    args = parser.parse_args()

    set_seed(42)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}")
    
    experiment_name = "v4a" if args.unfreeze == 1 else "v4b"
    save_dir = os.path.join(root_dir, "experiments", "verity_v4", experiment_name)
    os.makedirs(os.path.join(save_dir, "model"), exist_ok=True)

    # 1. Load Data (Use V3 training mix)
    v3_train_path = os.path.join(root_dir, "experiments", "verity_v3", "v3_train.csv")
    texts, labels = [], []
    with open(v3_train_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            texts.append(row["text"])
            labels.append(int(row["label"]))
            
    # Subsample for faster execution in this CPU environment
    data = list(zip(texts, labels))
    random.shuffle(data)
    data = data[:500]  # Minimal size just for script proof
    split_idx = int(len(data) * 0.9)
    train_data = data[:split_idx]
    val_data = data[split_idx:]
    
    train_texts, train_labels = zip(*train_data)
    val_texts, val_labels = zip(*val_data)
    
    num_human = sum(1 for l in train_labels if l == 0)
    num_ai = sum(1 for l in train_labels if l == 1)
    pos_weight = torch.tensor([num_human / (num_ai + 1e-5)]).to(device)
    print(f"Train Human: {num_human}, AI: {num_ai}, pos_weight: {pos_weight.item():.4f}")

    # 2. Scaler (Start with V2 scaler)
    print("Loading V2 Scaler...")
    v2_scaler_path = os.path.join(root_dir, "backend", "models", "verity_detector_v2", "stylometric_scaler.json")
    with open(v2_scaler_path) as f:
        v2_s = json.load(f)
    scaler = SimpleScaler()
    scaler.mean = v2_s["mean"]
    scaler.std = v2_s["std"]
    
    scaler_path = os.path.join(save_dir, "model", "stylometric_scaler.json")
    with open(scaler_path, "w", encoding="utf-8") as f:
        json.dump(scaler.to_dict(), f, indent=2)

    # 3. Datasets
    tokenizer = AutoTokenizer.from_pretrained("distilroberta-base")
    train_ds = VerityV4Dataset(train_texts, train_labels, scaler, tokenizer)
    val_ds = VerityV4Dataset(val_texts, val_labels, scaler, tokenizer)
    
    train_loader = DataLoader(train_ds, batch_size=8, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=8, shuffle=False)

    # 4. Model
    model = VerityV4Model("distilroberta-base", unfreeze_layers=args.unfreeze).to(device)
    
    # Differential Learning Rates
    transformer_params = []
    head_params = []
    for name, param in model.named_parameters():
        if not param.requires_grad:
            continue
        if "transformer" in name:
            transformer_params.append(param)
        else:
            head_params.append(param)
            
    optimizer = torch.optim.AdamW([
        {'params': transformer_params, 'lr': 1e-5},
        {'params': head_params, 'lr': 1e-3}
    ], weight_decay=0.01)
    
    epochs = 2
    total_steps = len(train_loader) * epochs
    scheduler = get_linear_schedule_with_warmup(optimizer, num_warmup_steps=int(total_steps*0.1), num_training_steps=total_steps)
    criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight)

    best_val_loss = float("inf")
    best_model_path = os.path.join(save_dir, "model", "best_model.pt")
    
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
            # Save the full model (head + transformer) since we finetuned the transformer!
            torch.save(model.state_dict(), best_model_path)
            print("  -> Saved new best model")

    # Config
    config_dict = {
        "model_name": "distilroberta-base",
        "semantic_dim": 768,
        "stylometric_dim": 20,
        "sem_proj_dim": 256,
        "sty_proj_dim": 64,
        "selected_threshold": 0.70,
        "training_stage": "v4_experiment",
        "unfrozen_layers": args.unfreeze,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    with open(os.path.join(save_dir, "model", "config.json"), "w") as f:
        json.dump(config_dict, f, indent=2)

if __name__ == "__main__":
    main()
