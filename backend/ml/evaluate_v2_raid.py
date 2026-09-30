import os
import sys
import json
import time
import csv
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

ATTACK_CATEGORIES = {
    "none": "Original (No Attack)",
    "paraphrase": "Paraphrase Attack",
    "whitespace": "Formatting Attack",
    "insert_paragraphs": "Formatting Attack",
    "upper_lower": "Character Attack",
    "homoglyph": "Character Attack",
    "perplexity_misspelling": "Spelling Attack",
    "alternative_spelling": "Spelling Attack",
    "synonym": "Lexical Attack",
    "article_deletion": "Lexical Attack",
    "number": "Lexical Attack"
}

def get_length_category(word_count: int) -> str:
    if word_count < 100:
        return "Short (<100 words)"
    elif word_count <= 300:
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

def evaluate_v2_raid():
    start_time = time.time()
    model_dir = os.path.join(root_dir, "backend", "models", "verity_detector_v2")
    reports_dir = os.path.join(root_dir, "dataset", "reports")
    os.makedirs(reports_dir, exist_ok=True)

    config_path = os.path.join(model_dir, "config.json")
    model_path = os.path.join(model_dir, "best_model.pt")
    scaler_path = os.path.join(model_dir, "stylometric_scaler.json")
    raid_csv_path = os.path.join(root_dir, "dataset", "raid", "raid_subset.csv")

    if not os.path.exists(raid_csv_path):
        print(f"ERROR: Held-out RAID test set not found at '{raid_csv_path}'")
        return None

    if not (os.path.exists(config_path) and os.path.exists(model_path) and os.path.exists(scaler_path)):
        print("ERROR: VERITY V2 trained model artifacts not found.")
        return None

    with open(config_path, "r", encoding="utf-8") as f:
        config = json.load(f)

    with open(scaler_path, "r", encoding="utf-8") as f:
        scaler_dict = json.load(f)

    threshold = float(config.get("selected_threshold", 0.50))
    print(f"[{time.strftime('%H:%M:%S')}] Evaluating locked VERITY V2 detector on held-out RAID test set...")
    print(f"[{time.strftime('%H:%M:%S')}] Locked validation threshold: {threshold:.2f}")

    scaler = SimpleScaler(mean=scaler_dict["mean"], std=scaler_dict["std"])

    raid_records = []
    with open(raid_csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            text = str(row.get("text", "")).strip()
            model_name = str(row.get("model", "")).strip()
            attack = str(row.get("attack", "")).strip() or "none"
            raw_lbl = str(row.get("label", "")).strip()

            if raw_lbl.isdigit():
                label = int(raw_lbl)
            else:
                label = 0 if model_name.lower() == "human" else 1

            word_count = len(text.split())
            raid_records.append({
                "text": text,
                "label": label,
                "model": model_name,
                "attack": attack,
                "word_count": word_count,
                "length_cat": get_length_category(word_count)
            })

    print(f"[{time.strftime('%H:%M:%S')}] Loaded {len(raid_records):,} held-out RAID test records.")

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

    batch_size = 64
    raid_probs = []
    raid_labels = [r["label"] for r in raid_records]

    inf_start = time.time()
    with torch.no_grad():
        for i in range(0, len(raid_records), batch_size):
            batch = raid_records[i:i+batch_size]
            batch_texts = [preprocess_text(r["text"]) for r in batch]

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
            raid_probs.extend(probs)

    tot_inf_time = time.time() - inf_start
    avg_latency_ms = (tot_inf_time / len(raid_records)) * 1000

    raid_preds = [1 if p >= threshold else 0 for p in raid_probs]

    acc = accuracy_score(raid_labels, raid_preds)
    prec = precision_score(raid_labels, raid_preds, zero_division=0)
    rec = recall_score(raid_labels, raid_preds, zero_division=0)
    f1 = f1_score(raid_labels, raid_preds, zero_division=0)
    mcc = matthews_corrcoef(raid_labels, raid_preds)
    auroc = roc_auc_score(raid_labels, raid_probs)
    cm = confusion_matrix(raid_labels, raid_preds).tolist()

    # Per-Model Breakdown
    model_groups = defaultdict(list)
    for idx, r in enumerate(raid_records):
        model_groups[r["model"]].append(idx)

    model_metrics = {}
    for m_name, indices in sorted(model_groups.items()):
        m_targets = [raid_labels[i] for i in indices]
        m_preds = [raid_preds[i] for i in indices]
        m_probs = [raid_probs[i] for i in indices]
        
        model_metrics[m_name] = {
            "count": len(indices),
            "accuracy": round(float(accuracy_score(m_targets, m_preds)), 4),
            "precision": round(float(precision_score(m_targets, m_preds, zero_division=0)), 4),
            "recall": round(float(recall_score(m_targets, m_preds, zero_division=0)), 4),
            "f1": round(float(f1_score(m_targets, m_preds, zero_division=0)), 4),
            "auroc": round(float(roc_auc_score(m_targets, m_probs)), 4) if len(set(m_targets)) > 1 else 0.0
        }

    # Per-Attack Breakdown
    attack_groups = defaultdict(list)
    for idx, r in enumerate(raid_records):
        attack_groups[r["attack"]].append(idx)

    attack_metrics = {}
    for att_name, indices in sorted(attack_groups.items()):
        att_targets = [raid_labels[i] for i in indices]
        att_preds = [raid_preds[i] for i in indices]
        att_probs = [raid_probs[i] for i in indices]
        
        attack_metrics[att_name] = {
            "attack_category": ATTACK_CATEGORIES.get(att_name, "Other Attack"),
            "count": len(indices),
            "accuracy": round(float(accuracy_score(att_targets, att_preds)), 4),
            "precision": round(float(precision_score(att_targets, att_preds, zero_division=0)), 4),
            "recall": round(float(recall_score(att_targets, att_preds, zero_division=0)), 4),
            "f1": round(float(f1_score(att_targets, att_preds, zero_division=0)), 4),
            "auroc": round(float(roc_auc_score(att_targets, att_probs)), 4) if len(set(att_targets)) > 1 else 0.0
        }

    # Original AI F1 vs Paraphrased AI F1
    orig_ai_idx = [i for i, r in enumerate(raid_records) if r["label"] == 1 and r["attack"] == "none"]
    para_ai_idx = [i for i, r in enumerate(raid_records) if r["label"] == 1 and r["attack"] == "paraphrase"]

    f1_orig_ai = float(recall_score([raid_labels[i] for i in orig_ai_idx], [raid_preds[i] for i in orig_ai_idx], zero_division=0))
    f1_para_ai = float(recall_score([raid_labels[i] for i in para_ai_idx], [raid_preds[i] for i in para_ai_idx], zero_division=0))
    perf_drop = round(f1_orig_ai - f1_para_ai, 4)

    # Per-Length Breakdown
    length_groups = defaultdict(list)
    for idx, r in enumerate(raid_records):
        length_groups[r["length_cat"]].append(idx)

    length_metrics = {}
    for l_cat, indices in sorted(length_groups.items()):
        l_targets = [raid_labels[i] for i in indices]
        l_preds = [raid_preds[i] for i in indices]
        l_probs = [raid_probs[i] for i in indices]

        length_metrics[l_cat] = {
            "count": len(indices),
            "accuracy": round(float(accuracy_score(l_targets, l_preds)), 4),
            "precision": round(float(precision_score(l_targets, l_preds, zero_division=0)), 4),
            "recall": round(float(recall_score(l_targets, l_preds, zero_division=0)), 4),
            "f1": round(float(f1_score(l_targets, l_preds, zero_division=0)), 4),
            "auroc": round(float(roc_auc_score(l_targets, l_probs)), 4)
        }

    report_json = {
        "dataset": "Held-Out RAID Subset",
        "sample_count": len(raid_records),
        "locked_threshold": threshold,
        "overall_metrics": {
            "accuracy": round(float(acc), 4),
            "precision": round(float(prec), 4),
            "recall": round(float(rec), 4),
            "f1": round(float(f1), 4),
            "mcc": round(float(mcc), 4),
            "auroc": round(float(auroc), 4)
        },
        "confusion_matrix": {"tn": cm[0][0], "fp": cm[0][1], "fn": cm[1][0], "tp": cm[1][1]},
        "robustness_metrics": {
            "f1_original_ai": round(f1_orig_ai, 4),
            "f1_paraphrased_ai": round(f1_para_ai, 4),
            "performance_drop": perf_drop
        },
        "per_model_metrics": model_metrics,
        "per_attack_metrics": attack_metrics,
        "per_length_metrics": length_metrics,
        "inference_latency": {
            "total_seconds": round(tot_inf_time, 2),
            "avg_ms_per_sample": round(avg_latency_ms, 2)
        }
    }

    json_path = os.path.join(reports_dir, "verity_v2_raid_results.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(report_json, f, indent=2)

    md_content = f"""# VERITY V2 — Held-Out RAID Test Results

**Dataset:** Strictly Held-Out RAID Test ({len(raid_records):,} samples)  
**Locked Validation Threshold:** `{threshold:.2f}`

## Overall Metrics
- **Accuracy:** `{acc*100:.2f}%`
- **Precision:** `{prec*100:.2f}%`
- **Recall:** `{rec*100:.2f}%`
- **F1 Score:** `{f1:.4f}`
- **MCC:** `{mcc:.4f}`
- **AUROC:** `{auroc:.4f}`

## Paraphrase Degradation
- **Original AI Recall:** `{f1_orig_ai:.4f}`
- **Paraphrased AI Recall:** `{f1_para_ai:.4f}`
- **Performance Drop:** `{perf_drop:.4f}`

## Attack Breakdown
"""
    for att, data in attack_metrics.items():
        md_content += f"- **{att}** ({data['attack_category']}): Acc `{data['accuracy']*100:.2f}%`, F1 `{data['f1']:.4f}`\n"

    md_content += "\n## Generator Breakdown\n"
    for m, data in model_metrics.items():
        md_content += f"- **{m}**: Acc `{data['accuracy']*100:.2f}%`, F1 `{data['f1']:.4f}`\n"

    md_path = os.path.join(reports_dir, "verity_v2_raid_results.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(md_content)

    print(f"RAID final report saved to {json_path} and {md_path}")
    return report_json

if __name__ == "__main__":
    evaluate_v2_raid()
