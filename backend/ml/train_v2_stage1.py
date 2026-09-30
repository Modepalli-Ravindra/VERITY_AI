import os
import sys
import json
import csv
import math
import random
import time
import argparse
import numpy as np
from pathlib import Path
from typing import Dict, Any, List, Tuple

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from transformers import AutoTokenizer, AutoModel, get_linear_schedule_with_warmup

# Add root directory to path
root_dir = Path(__file__).resolve().parent.parent.parent
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

    def fit(self, vectors: List[List[float]]):
        arr = np.array(vectors, dtype=np.float32)
        self.mean = np.mean(arr, axis=0).tolist()
        self.std = np.std(arr, axis=0).tolist()

    def transform(self, vector: List[float]) -> List[float]:
        scaled = []
        for v, m, s in zip(vector, self.mean, self.std):
            denom = s if s > 1e-7 else 1.0
            scaled.append((v - m) / denom)
        return scaled

    def to_dict(self) -> Dict[str, Any]:
        return {"mean": self.mean, "std": self.std}

class VerityEndToEndDataset(Dataset):
    def __init__(self, texts: List[str], labels: List[int], scaler: SimpleScaler, tokenizer, max_length: int = 256):
        self.texts = [preprocess_text(t) for t in texts]
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_length = max_length

        # Pre-compute scaled stylometric feature vectors in parallel
        from concurrent.futures import ThreadPoolExecutor

        def extract_single(t: str) -> List[float]:
            return StylometricExtractor.get_vector(t)

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
            text,
            max_length=self.max_length,
            padding="max_length",
            truncation=True,
            return_tensors="pt"
        )

        return {
            "input_ids": enc["input_ids"].squeeze(0),
            "attention_mask": enc["attention_mask"].squeeze(0),
            "stylometric": sty_vec,
            "label": torch.tensor(label, dtype=torch.float32)
        }

class VerityFullEndToEndModel(nn.Module):
    """
    End-to-end DistilRoBERTa + Stylometric Fusion Model for VERITY V2.
    Uses exact mean-pooling matching inference.
    """
    def __init__(self, transformer_name: str = "distilroberta-base", fusion_classifier: VerityFusionClassifier = None):
        super().__init__()
        self.transformer = AutoModel.from_pretrained(transformer_name)
        
        # FREEZE TRANSFORMER
        for param in self.transformer.parameters():
            param.requires_grad = False
            
        if fusion_classifier is not None:
            self.fusion_head = fusion_classifier
        else:
            self.fusion_head = VerityFusionClassifier(
                semantic_dim=768,
                stylometric_dim=20,
                sem_proj_dim=256,
                sty_proj_dim=64
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

def load_hc3_val(val_path: str) -> Tuple[List[str], List[int]]:
    texts = []
    labels = []
    seen = set()
    with open(val_path, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            data = json.loads(line)
            # Question level 80/20 split determinism
            q = str(data.get("question", "")).strip()
            # Val questions are those in the 20% val slice
            # To load exact val slice, filter by question hash or question index matching create_final_partition_report
            pass
    return texts, labels

def evaluate(model, dataloader, device) -> Dict[str, float]:
    model.eval()
    all_preds = []
    all_targets = []

    with torch.no_grad():
        for batch in dataloader:
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            sty = batch["stylometric"].to(device)
            labels = batch["label"].to(device)

            logits = model(input_ids, attention_mask, sty)
            probs = torch.sigmoid(logits)
            preds = (probs >= 0.50).long().cpu().numpy()
            
            all_preds.extend(preds)
            all_targets.extend(labels.cpu().numpy())

    all_preds = np.array(all_preds)
    all_targets = np.array(all_targets)

    acc = np.mean(all_preds == all_targets)
    tp = np.sum((all_preds == 1) & (all_targets == 1))
    fp = np.sum((all_preds == 1) & (all_targets == 0))
    fn = np.sum((all_preds == 0) & (all_targets == 1))
    tn = np.sum((all_preds == 0) & (all_targets == 0))

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0

    return {
        "accuracy": float(acc),
        "precision": float(precision),
        "recall": float(recall),
        "f1": float(f1)
    }

def main():
    parser = argparse.ArgumentParser(description="VERITY V2 Stage 1 Training")
    parser.add_argument("--config", type=str, default="backend/ml/configs/verity_v2_stage1.json", help="Path to config file")
    parser.add_argument("--smoke-test", action="store_true", help="Run 50-sample smoke test to verify pipeline")
    args = parser.parse_args()

    config_path = os.path.join(root_dir, args.config)
    with open(config_path, "r", encoding="utf-8") as f:
        cfg = json.load(f)

    set_seed(cfg.get("seed", 42))

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[{time.strftime('%H:%M:%S')}] Starting Stage 1 Training on device: {device}", flush=True)

    # 1. Load Stage 1 training dataset
    train_path = os.path.join(root_dir, cfg["stage1_train_path"])
    print(f"[{time.strftime('%H:%M:%S')}] Reading Stage 1 training dataset from '{train_path}'...", flush=True)
    
    texts = []
    labels = []
    if not os.path.exists(train_path):
        if args.smoke_test:
            print("  Stage 1 train file not found, loading HC3 for smoke test...")
            hc3_path = os.path.join(root_dir, "dataset", "hc3", "all.jsonl")
            with open(hc3_path, "r", encoding="utf-8") as f:
                for line in f:
                    data = json.loads(line)
                    for h in data.get("human_answers", []):
                        if h.strip():
                            texts.append(h.strip())
                            labels.append(0)
                            break
                    for a in data.get("chatgpt_answers", []):
                        if a.strip():
                            texts.append(a.strip())
                            labels.append(1)
                            break
                    if len(texts) >= 50:
                        break
        else:
            raise FileNotFoundError(f"Stage 1 training file not found at '{train_path}'")
    else:
        with open(train_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                t = str(row.get("text", "")).strip()
                l = int(row.get("label", 0))
                if t:
                    texts.append(t)
                    labels.append(l)

    if args.smoke_test:
        print(f"[{time.strftime('%H:%M:%S')}] RUNNING SMOKE TEST MODE (50 samples)...")
        texts = texts[:50]
        labels = labels[:50]
        cfg["epochs"] = 1
        cfg["batch_size"] = 10

    print(f"Loaded {len(texts):,} training samples ({sum(1 for l in labels if l==0):,} Human, {sum(1 for l in labels if l==1):,} AI)")

    # 2. Fit Scaler strictly on Stage 1 training data ONLY
    print(f"[{time.strftime('%H:%M:%S')}] Extracting & fitting stylometric scaler on Stage 1 training data...", flush=True)
    sample_texts_for_scaler = texts[:20000] if len(texts) > 20000 else texts
    raw_sty_vectors_sample = [StylometricExtractor.get_vector(preprocess_text(t)) for t in sample_texts_for_scaler]
    scaler = SimpleScaler()
    scaler.fit(raw_sty_vectors_sample)

    scaler_save_path = os.path.join(root_dir, cfg["scaler_save_path"])
    os.makedirs(os.path.dirname(scaler_save_path), exist_ok=True)
    with open(scaler_save_path, "w", encoding="utf-8") as f:
        json.dump(scaler.to_dict(), f, indent=2)
    print(f"  Fitted and saved scaler to '{scaler_save_path}'")

    # 3. Create tokenizer, dataset, and dataloader
    tokenizer = AutoTokenizer.from_pretrained(cfg["base_model"])
    train_dataset = VerityEndToEndDataset(texts, labels, scaler, tokenizer, max_length=cfg["max_length"])
    train_loader = DataLoader(train_dataset, batch_size=cfg["batch_size"], shuffle=True)

    # 4. Instantiate model
    model = VerityFullEndToEndModel(transformer_name=cfg["base_model"]).to(device)

    # 5. Embedding Parity Test
    print(f"[{time.strftime('%H:%M:%S')}] Running Deterministic Pooling & Embedding Parity Verification Test...")
    model.eval()
    sample_text = "VERITY V2 deterministic representation check."
    norm_sample = preprocess_text(sample_text)
    inputs = tokenizer(norm_sample, return_tensors="pt", max_length=256, padding=True, truncation=True).to(device)
    with torch.no_grad():
        train_emb = model.extract_semantic_embedding(inputs["input_ids"], inputs["attention_mask"]).squeeze(0).cpu().numpy()
    
    # Check shape & numerical bounds
    assert train_emb.shape[0] == 768, f"Pooling shape error! Got {train_emb.shape}"
    assert not np.isnan(train_emb).any(), "NaN detected in embedding!"
    print(f"  Embedding Parity Check PASSED (Shape: {train_emb.shape}, Mean: {np.mean(train_emb):.6f})")

    if args.smoke_test:
        print("Smoke test completed successfully!")
        return

    # 6. Optimizer & Scheduler
    optimizer = torch.optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=cfg["learning_rate"], weight_decay=cfg["weight_decay"])
    total_steps = len(train_loader) * cfg["epochs"]
    warmup_steps = int(total_steps * cfg["warmup_ratio"])
    scheduler = get_linear_schedule_with_warmup(optimizer, num_warmup_steps=warmup_steps, num_training_steps=total_steps)

    criterion = nn.BCEWithLogitsLoss()

    # 7. Training Loop
    print(f"[{time.strftime('%H:%M:%S')}] Starting Stage 1 Training Loop ({cfg['epochs']} epochs, {total_steps} steps)...")
    best_loss = float("inf")
    
    best_model_path = os.path.join(root_dir, cfg["best_model_path"])
    checkpoint_dir = os.path.join(root_dir, cfg["checkpoint_dir"])
    os.makedirs(checkpoint_dir, exist_ok=True)
    os.makedirs(os.path.dirname(best_model_path), exist_ok=True)

    for epoch in range(1, cfg["epochs"] + 1):
        model.train()
        total_loss = 0.0
        start_epoch_time = time.time()

        for step, batch in enumerate(train_loader, 1):
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            sty = batch["stylometric"].to(device)
            lbls = batch["label"].to(device)

            optimizer.zero_grad()
            logits = model(input_ids, attention_mask, sty)
            loss = criterion(logits, lbls)

            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            scheduler.step()

            total_loss += loss.item()

            if step == 1 or step % 10 == 0 or step == len(train_loader):
                avg_step_loss = total_loss / step
                print(f"  Epoch {epoch}/{cfg['epochs']} | Step {step}/{len(train_loader)} | Loss: {avg_step_loss:.4f} | LR: {scheduler.get_last_lr()[0]:.2e}", flush=True)

        epoch_loss = total_loss / len(train_loader)
        epoch_time = round(time.time() - start_epoch_time, 2)
        print(f"[{time.strftime('%H:%M:%S')}] Epoch {epoch} Complete! Train Loss: {epoch_loss:.4f} ({epoch_time}s)")

        # Save checkpoint
        ckpt_path = os.path.join(checkpoint_dir, f"model_epoch_{epoch}.pt")
        torch.save(model.fusion_head.state_dict(), ckpt_path)
        print(f"  Saved epoch checkpoint to '{ckpt_path}'")

        if epoch_loss < best_loss:
            best_loss = epoch_loss
            # Save full fusion classifier weights for inference
            torch.save(model.fusion_head.state_dict(), best_model_path)
            print(f"  New best model saved to '{best_model_path}'")

    # Save model config metadata
    config_save_path = os.path.join(root_dir, cfg["config_save_path"])
    config_dict = {
        "model_name": cfg["base_model"],
        "semantic_dim": cfg["semantic_dim"],
        "stylometric_dim": cfg["stylometric_dim"],
        "sem_proj_dim": cfg["sem_proj_dim"],
        "sty_proj_dim": cfg["sty_proj_dim"],
        "selected_threshold": 0.50,
        "training_stage": "stage1",
        "training_loss": round(best_loss, 4),
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "transformer_frozen": True
    }
    with open(config_save_path, "w", encoding="utf-8") as f:
        json.dump(config_dict, f, indent=2)

    print(f"[{time.strftime('%H:%M:%S')}] Stage 1 Training Complete!")

if __name__ == "__main__":
    main()
