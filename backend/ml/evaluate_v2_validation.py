import os
import sys
import json
import random
import time
from pathlib import Path
from collections import defaultdict
from typing import Dict, Any

import numpy as np
import torch
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, matthews_corrcoef, roc_auc_score, confusion_matrix

root_dir = Path(__file__).resolve().parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.ml.text_preprocessing import preprocess_text
from backend.ml.stylometrics import StylometricExtractor
from backend.ml.verity_model import VerityFusionClassifier

def get_length_category(text: str) -> str:
    words = len(text.split())
    if words < 100:
        return "Short (<100 words)"
    elif words <= 300:
        return "Medium (100-300 words)"
    else:
        return "Long (>300 words)"

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

def evaluate_validation():
    model_dir = os.path.join(root_dir, "backend", "models", "verity_detector_v2")
    config_path = os.path.join(model_dir, "config.json")
    model_path = os.path.join(model_dir, "best_model.pt")
    scaler_path = os.path.join(model_dir, "stylometric_scaler.json")
    reports_dir = os.path.join(root_dir, "dataset", "reports")
    os.makedirs(reports_dir, exist_ok=True)

    if not (os.path.exists(config_path) and os.path.exists(model_path) and os.path.exists(scaler_path)):
        print("ERROR: V2 trained model artifacts not found!")
        return None

    with open(config_path, "r", encoding="utf-8") as f:
        config = json.load(f)

    with open(scaler_path, "r", encoding="utf-8") as f:
        scaler_dict = json.load(f)

    scaler = SimpleScaler(mean=scaler_dict["mean"], std=scaler_dict["std"])

    # Load HC3-Val partition (question-level 80/20 split)
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

    print(f"Loaded HC3-Val set: {len(val_samples):,} samples ({sum(1 for s in val_samples if s['label']==0):,} Human, {sum(1 for s in val_samples if s['label']==1):,} AI)")

    # Load model & transformer
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    from transformers import AutoTokenizer, AutoModel
    tokenizer = AutoTokenizer.from_pretrained(config.get("model_name", "distilroberta-base"))
    transformer = AutoModel.from_pretrained(config.get("model_name", "distilroberta-base")).to(device)
    transformer.eval()

    classifier = VerityFusionClassifier(
        semantic_dim=config.get("semantic_dim", 768),
        stylometric_dim=config.get("stylometric_dim", 20),
        sem_proj_dim=config.get("sem_proj_dim", 256),
        sty_proj_dim=config.get("sty_proj_dim", 64)
    ).to(device)
    classifier.load_state_dict(torch.load(model_path, map_location=device))
    classifier.eval()

    val_probs = []
    val_targets = [s["label"] for s in val_samples]
    val_lengths = [get_length_category(s["text"]) for s in val_samples]

    batch_size = 64
    with torch.no_grad():
        for i in range(0, len(val_samples), batch_size):
            batch = val_samples[i:i+batch_size]
            batch_texts = [preprocess_text(s["text"]) for s in batch]
            
            raw_sty = [StylometricExtractor.get_vector(t) for t in batch_texts]
            scaled_sty = [scaler.transform(v) for v in raw_sty]
            sty_tensor = torch.tensor(scaled_sty, dtype=torch.float32, device=device)

            inputs = tokenizer(batch_texts, padding=True, truncation=True, max_length=256, return_tensors="pt").to(device)
            outputs = transformer(**inputs)
            mask = inputs["attention_mask"].unsqueeze(-1)
            sem_tensor = (outputs.last_hidden_state * mask).sum(dim=1) / mask.sum(dim=1).clamp(min=1e-9)

            logits = classifier(sem_tensor, sty_tensor)
            probs = torch.sigmoid(logits).cpu().numpy().tolist()
            if isinstance(probs, float):
                probs = [probs]
            val_probs.extend(probs)

    # Phase 10: Threshold Search 0.30 -> 0.70 on Validation Set
    best_thresh = 0.50
    best_f1 = -1.0
    threshold_results = {}

    for t_val in np.arange(0.30, 0.71, 0.01):
        t_val = round(float(t_val), 2)
        preds = [1 if p >= t_val else 0 for p in val_probs]
        f1 = f1_score(val_targets, preds, zero_division=0)
        threshold_results[str(t_val)] = round(float(f1), 4)
        if f1 > best_f1:
            best_f1 = f1
            best_thresh = t_val

    print(f"Optimal Locked Threshold Selected on Validation Data: {best_thresh:.2f} (Validation F1: {best_f1:.4f})")

    # Lock threshold into config.json
    config["selected_threshold"] = best_thresh
    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2)

    val_preds = [1 if p >= best_thresh else 0 for p in val_probs]

    acc = accuracy_score(val_targets, val_preds)
    prec = precision_score(val_targets, val_preds, zero_division=0)
    rec = recall_score(val_targets, val_preds, zero_division=0)
    f1 = f1_score(val_targets, val_preds, zero_division=0)
    mcc = matthews_corrcoef(val_targets, val_preds)
    auroc = roc_auc_score(val_targets, val_probs)
    cm = confusion_matrix(val_targets, val_preds).tolist()

    # Per-length breakdown
    length_groups = defaultdict(list)
    for idx, cat in enumerate(val_lengths):
        length_groups[cat].append(idx)

    length_metrics = {}
    for cat, idxs in length_groups.items():
        sub_targets = [val_targets[i] for i in idxs]
        sub_preds = [val_preds[i] for i in idxs]
        sub_probs = [val_probs[i] for i in idxs]
        length_metrics[cat] = {
            "count": len(idxs),
            "accuracy": round(float(accuracy_score(sub_targets, sub_preds)), 4),
            "precision": round(float(precision_score(sub_targets, sub_preds, zero_division=0)), 4),
            "recall": round(float(recall_score(sub_targets, sub_preds, zero_division=0)), 4),
            "f1": round(float(f1_score(sub_targets, sub_preds, zero_division=0)), 4),
            "auroc": round(float(roc_auc_score(sub_targets, sub_probs)), 4) if len(set(sub_targets)) > 1 else 0.0
        }

    report = {
        "evaluation": "VERITY V2 HC3-Val Stage 1 Validation",
        "sample_count": len(val_samples),
        "locked_threshold": best_thresh,
        "metrics": {
            "accuracy": round(float(acc), 4),
            "precision": round(float(prec), 4),
            "recall": round(float(rec), 4),
            "f1": round(float(f1), 4),
            "mcc": round(float(mcc), 4),
            "auroc": round(float(auroc), 4)
        },
        "confusion_matrix": {"tn": cm[0][0], "fp": cm[0][1], "fn": cm[1][0], "tp": cm[1][1]},
        "per_length_metrics": length_metrics,
        "threshold_search": threshold_results
    }

    json_path = os.path.join(reports_dir, "verity_v2_stage1_validation.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    md_content = f"""# VERITY V2 Stage 1 Validation Report

**Dataset:** HC3-Val ({len(val_samples):,} samples)  
**Selected Locked Threshold:** `{best_thresh:.2f}`

## Overall Metrics
- **Accuracy:** `{acc*100:.2f}%`
- **Precision:** `{prec*100:.2f}%`
- **Recall:** `{rec*100:.2f}%`
- **F1 Score:** `{f1:.4f}`
- **MCC:** `{mcc:.4f}`
- **AUROC:** `{auroc:.4f}`

## Length Breakdown
"""
    for cat, data in length_metrics.items():
        md_content += f"- **{cat}**: Acc `{data['accuracy']*100:.2f}%`, Precision `{data['precision']*100:.2f}%`, Recall `{data['recall']*100:.2f}%`, F1 `{data['f1']:.4f}`\n"

    md_path = os.path.join(reports_dir, "verity_v2_stage1_validation.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(md_content)

    print(f"Validation report saved to {json_path} and {md_path}")
    return report

if __name__ == "__main__":
    evaluate_validation()
