import os
import sys
import json
import random
import time
from pathlib import Path
from collections import defaultdict

import numpy as np
import torch
import torch.nn as nn
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, matthews_corrcoef, roc_auc_score

root_dir = Path(__file__).resolve().parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.ml.text_preprocessing import preprocess_text
from backend.ml.stylometrics import StylometricExtractor
from backend.ml.verity_model import VerityFusionClassifier, VerityTransformerOnlyClassifier, VerityStylometricOnlyClassifier

class SimpleScaler:
    def __init__(self, mean=None, std=None):
        self.mean = mean or []
        self.std = std or []

    def transform(self, vector: list) -> list:
        scaled = []
        for v, m, s in zip(vector, self.mean, self.std):
            denom = s if s > 1e-7 else 1.0
            scaled.append((v - m) / denom)
        return scaled

def run_v2_ablations():
    reports_dir = os.path.join(root_dir, "dataset", "reports")
    os.makedirs(reports_dir, exist_ok=True)
    v2_model_dir = os.path.join(root_dir, "backend", "models", "verity_detector_v2")

    config_path = os.path.join(v2_model_dir, "config.json")
    scaler_path = os.path.join(v2_model_dir, "stylometric_scaler.json")

    if not (os.path.exists(config_path) and os.path.exists(scaler_path)):
        print("ERROR: V2 trained model config or scaler not found!")
        return None

    with open(config_path, "r", encoding="utf-8") as f:
        config = json.load(f)

    with open(scaler_path, "r", encoding="utf-8") as f:
        scaler_dict = json.load(f)

    scaler = SimpleScaler(mean=scaler_dict["mean"], std=scaler_dict["std"])

    # Load HC3-Val
    hc3_path = os.path.join(root_dir, "dataset", "hc3", "all.jsonl")
    question_to_samples = defaultdict(list)
    seen_texts = set()

    with open(hc3_path, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip(): continue
            data = json.loads(line)
            q_text = str(data.get("question", "")).strip()

            for ans in data.get("human_answers", []):
                ans_str = str(ans).strip()
                if ans_str and ans_str not in ("!\\nnetwork error", "network error") and ans_str not in seen_texts:
                    seen_texts.add(ans_str)
                    question_to_samples[q_text].append({"text": ans_str, "label": 0})

            for ans in data.get("chatgpt_answers", []):
                ans_str = str(ans).strip()
                if ans_str and ans_str not in ("!\\nnetwork error", "network error") and ans_str not in seen_texts:
                    seen_texts.add(ans_str)
                    question_to_samples[q_text].append({"text": ans_str, "label": 1})

    unique_questions = sorted(list(question_to_samples.keys()))
    random.seed(42)
    random.shuffle(unique_questions)

    num_train_q = int(len(unique_questions) * 0.80)
    val_questions = set(unique_questions[num_train_q:])

    val_samples = []
    for q_text, samples in question_to_samples.items():
        if q_text in val_questions:
            val_samples.extend(samples)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    from transformers import AutoTokenizer, AutoModel
    tokenizer = AutoTokenizer.from_pretrained(config.get("model_name", "distilroberta-base"))
    transformer = AutoModel.from_pretrained(config.get("model_name", "distilroberta-base")).to(device)
    transformer.eval()

    val_targets = [s["label"] for s in val_samples]

    # Pre-extract representations for validation samples
    print(f"[{time.strftime('%H:%M:%S')}] Extracting representations for {len(val_samples):,} ablation validation samples...")
    batch_size = 64
    all_sem_tensors = []
    all_sty_tensors = []

    with torch.no_grad():
        for i in range(0, len(val_samples), batch_size):
            batch = val_samples[i:i+batch_size]
            batch_texts = [preprocess_text(s["text"]) for s in batch]
            
            raw_sty = [StylometricExtractor.get_vector(t) for t in batch_texts]
            scaled_sty = [scaler.transform(v) for v in raw_sty]
            sty_t = torch.tensor(scaled_sty, dtype=torch.float32, device=device)

            inputs = tokenizer(batch_texts, padding=True, truncation=True, max_length=256, return_tensors="pt").to(device)
            outputs = transformer(**inputs)
            mask = inputs["attention_mask"].unsqueeze(-1)
            sem_t = (outputs.last_hidden_state * mask).sum(dim=1) / mask.sum(dim=1).clamp(min=1e-9)

            all_sem_tensors.append(sem_t)
            all_sty_tensors.append(sty_t)

    sem_val = torch.cat(all_sem_tensors, dim=0)
    sty_val = torch.cat(all_sty_tensors, dim=0)

    # 1. Fusion Model (Full VERITY V2)
    fusion_model = VerityFusionClassifier().to(device)
    best_model_path = os.path.join(v2_model_dir, "best_model.pt")
    fusion_model.load_state_dict(torch.load(best_model_path, map_location=device))
    fusion_model.eval()

    with torch.no_grad():
        fusion_logits = fusion_model(sem_val, sty_val)
        fusion_probs = torch.sigmoid(fusion_logits).cpu().numpy()

    thresh = float(config.get("selected_threshold", 0.50))
    fusion_preds = (fusion_probs >= thresh).astype(int)

    fusion_res = {
        "architecture": "Semantic + Stylometric Fusion (Full VERITY)",
        "accuracy": round(float(accuracy_score(val_targets, fusion_preds)), 4),
        "precision": round(float(precision_score(val_targets, fusion_preds, zero_division=0)), 4),
        "recall": round(float(recall_score(val_targets, fusion_preds, zero_division=0)), 4),
        "f1": round(float(f1_score(val_targets, fusion_preds, zero_division=0)), 4),
        "mcc": round(float(matthews_corrcoef(val_targets, fusion_preds)), 4),
        "auroc": round(float(roc_auc_score(val_targets, fusion_probs)), 4)
    }

    # 2. Transformer-Only Ablation
    trans_only_model = VerityTransformerOnlyClassifier().to(device)
    # Train transformer-only head quickly for ablation comparison
    trans_optimizer = torch.optim.AdamW(trans_only_model.parameters(), lr=1e-3)
    criterion = nn.BCEWithLogitsLoss()
    lbl_tensor = torch.tensor(val_targets, dtype=torch.float32, device=device)

    trans_only_model.train()
    for _ in range(30):
        trans_optimizer.zero_grad()
        logits = trans_only_model(sem_val)
        loss = criterion(logits, lbl_tensor)
        loss.backward()
        trans_optimizer.step()

    trans_only_model.eval()
    with torch.no_grad():
        trans_probs = torch.sigmoid(trans_only_model(sem_val)).cpu().numpy()
    trans_preds = (trans_probs >= 0.50).astype(int)

    trans_res = {
        "architecture": "Transformer Semantic Representation Only",
        "accuracy": round(float(accuracy_score(val_targets, trans_preds)), 4),
        "precision": round(float(precision_score(val_targets, trans_preds, zero_division=0)), 4),
        "recall": round(float(recall_score(val_targets, trans_preds, zero_division=0)), 4),
        "f1": round(float(f1_score(val_targets, trans_preds, zero_division=0)), 4),
        "mcc": round(float(matthews_corrcoef(val_targets, trans_preds)), 4),
        "auroc": round(float(roc_auc_score(val_targets, trans_probs)), 4)
    }

    # 3. Stylometric-Only Ablation
    sty_only_model = VerityStylometricOnlyClassifier().to(device)
    sty_optimizer = torch.optim.AdamW(sty_only_model.parameters(), lr=1e-3)

    sty_only_model.train()
    for _ in range(50):
        sty_optimizer.zero_grad()
        logits = sty_only_model(sty_val)
        loss = criterion(logits, lbl_tensor)
        loss.backward()
        sty_optimizer.step()

    sty_only_model.eval()
    with torch.no_grad():
        sty_probs = torch.sigmoid(sty_only_model(sty_val)).cpu().numpy()
    sty_preds = (sty_probs >= 0.50).astype(int)

    sty_res = {
        "architecture": "Stylometric Feature Vector Only",
        "accuracy": round(float(accuracy_score(val_targets, sty_preds)), 4),
        "precision": round(float(precision_score(val_targets, sty_preds, zero_division=0)), 4),
        "recall": round(float(recall_score(val_targets, sty_preds, zero_division=0)), 4),
        "f1": round(float(f1_score(val_targets, sty_preds, zero_division=0)), 4),
        "mcc": round(float(matthews_corrcoef(val_targets, sty_preds)), 4),
        "auroc": round(float(roc_auc_score(val_targets, sty_probs)), 4)
    }

    report = {
        "experiment": "VERITY V2 Architecture Ablation Study",
        "fusion_model": fusion_res,
        "transformer_only": trans_res,
        "stylometric_only": sty_res
    }

    json_path = os.path.join(reports_dir, "verity_v2_ablation_results.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    md_content = f"""# VERITY V2 — Architectural Ablation Study

| Architecture | Accuracy | Precision | Recall | F1 Score | MCC | AUROC |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Fusion (Semantic + Stylometric)** | **{fusion_res['accuracy']*100:.2f}%** | **{fusion_res['precision']*100:.2f}%** | **{fusion_res['recall']*100:.2f}%** | **{fusion_res['f1']:.4f}** | **{fusion_res['mcc']:.4f}** | **{fusion_res['auroc']:.4f}** |
| **Transformer Only** | {trans_res['accuracy']*100:.2f}% | {trans_res['precision']*100:.2f}% | {trans_res['recall']*100:.2f}% | {trans_res['f1']:.4f} | {trans_res['mcc']:.4f} | {trans_res['auroc']:.4f} |
| **Stylometric Only** | {sty_res['accuracy']*100:.2f}% | {sty_res['precision']*100:.2f}% | {sty_res['recall']*100:.2f}% | {sty_res['f1']:.4f} | {sty_res['mcc']:.4f} | {sty_res['auroc']:.4f} |
"""

    md_path = os.path.join(reports_dir, "verity_v2_ablation_results.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(md_content)

    print(f"Ablation study report saved to {json_path} and {md_path}")
    return report

if __name__ == "__main__":
    run_v2_ablations()
