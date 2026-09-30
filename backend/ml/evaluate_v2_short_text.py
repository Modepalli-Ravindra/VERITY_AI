import os
import sys
import json
import time
from pathlib import Path
from collections import defaultdict

import numpy as np
import torch
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

root_dir = Path(__file__).resolve().parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.ml.text_preprocessing import preprocess_text
from backend.ml.stylometrics import StylometricExtractor
from backend.ml.verity_model import VerityFusionClassifier

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

def evaluate_v2_short_text():
    reports_dir = os.path.join(root_dir, "dataset", "reports")
    os.makedirs(reports_dir, exist_ok=True)
    v2_model_dir = os.path.join(root_dir, "backend", "models", "verity_detector_v2")

    config_path = os.path.join(v2_model_dir, "config.json")
    scaler_path = os.path.join(v2_model_dir, "stylometric_scaler.json")
    model_path = os.path.join(v2_model_dir, "best_model.pt")

    if not (os.path.exists(config_path) and os.path.exists(scaler_path) and os.path.exists(model_path)):
        print("ERROR: V2 trained model config or scaler not found!")
        return None

    with open(config_path, "r", encoding="utf-8") as f:
        config = json.load(f)

    with open(scaler_path, "r", encoding="utf-8") as f:
        scaler_dict = json.load(f)

    threshold = float(config.get("selected_threshold", 0.50))
    scaler = SimpleScaler(mean=scaler_dict["mean"], std=scaler_dict["std"])

    # Collect short samples from HC3 and RAID held-out test
    short_samples = []

    # HC3 short samples (< 100 words)
    hc3_path = os.path.join(root_dir, "dataset", "hc3", "all.jsonl")
    with open(hc3_path, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip(): continue
            data = json.loads(line)
            source = str(data.get("source", "general")).strip()
            category = "technical" if "computer" in source or "wiki" in source else ("formal" if "finance" in source or "legal" in source else "casual")

            for h in data.get("human_answers", []):
                h_str = str(h).strip()
                if 5 <= len(h_str.split()) < 100:
                    short_samples.append({"text": h_str, "label": 0, "category": f"human_{category}"})
                    if len(short_samples) >= 150: break

            for a in data.get("chatgpt_answers", []):
                a_str = str(a).strip()
                if 5 <= len(a_str.split()) < 100:
                    short_samples.append({"text": a_str, "label": 1, "category": f"ai_{category}"})
                    if len(short_samples) >= 300: break
            if len(short_samples) >= 300: break

    print(f"Loaded {len(short_samples):,} short text evaluation samples.")

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

    probs = []
    targets = [s["label"] for s in short_samples]

    batch_size = 32
    with torch.no_grad():
        for i in range(0, len(short_samples), batch_size):
            batch = short_samples[i:i+batch_size]
            batch_texts = [preprocess_text(s["text"]) for s in batch]
            
            raw_sty = [StylometricExtractor.get_vector(t) for t in batch_texts]
            scaled_sty = [scaler.transform(v) for v in raw_sty]
            sty_t = torch.tensor(scaled_sty, dtype=torch.float32, device=device)

            inputs = tokenizer(batch_texts, padding=True, truncation=True, max_length=256, return_tensors="pt").to(device)
            outputs = transformer(**inputs)
            mask = inputs["attention_mask"].unsqueeze(-1)
            sem_t = (outputs.last_hidden_state * mask).sum(dim=1) / mask.sum(dim=1).clamp(min=1e-9)

            logits = classifier(sem_t, sty_t)
            batch_probs = torch.sigmoid(logits).cpu().numpy().tolist()
            if isinstance(batch_probs, float): batch_probs = [batch_probs]
            probs.extend(batch_probs)

    preds = [1 if p >= threshold else 0 for p in probs]

    overall_acc = accuracy_score(targets, preds)
    overall_f1 = f1_score(targets, preds, zero_division=0)

    category_groups = defaultdict(list)
    for idx, s in enumerate(short_samples):
        category_groups[s["category"]].append(idx)

    category_metrics = {}
    for cat, idxs in category_groups.items():
        cat_targets = [targets[i] for i in idxs]
        cat_preds = [preds[i] for i in idxs]
        category_metrics[cat] = {
            "count": len(idxs),
            "accuracy": round(float(accuracy_score(cat_targets, cat_preds)), 4),
            "f1": round(float(f1_score(cat_targets, cat_preds, zero_division=0)), 4)
        }

    report = {
        "evaluation": "VERITY V2 Short Text Robustness Evaluation",
        "sample_count": len(short_samples),
        "locked_threshold": threshold,
        "overall_accuracy": round(float(overall_acc), 4),
        "overall_f1": round(float(overall_f1), 4),
        "category_metrics": category_metrics
    }

    json_path = os.path.join(reports_dir, "verity_v2_short_text_results.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    md_content = f"""# VERITY V2 — Short Text Robustness Report

**Sample Count:** {len(short_samples):,}  
**Locked Threshold:** `{threshold:.2f}`  
**Overall Accuracy:** `{overall_acc*100:.2f}%`  
**Overall F1:** `{overall_f1:.4f}`

## Breakdown by Text Category
"""
    for cat, data in category_metrics.items():
        md_content += f"- **{cat}**: Count `{data['count']}`, Accuracy `{data['accuracy']*100:.2f}%`, F1 `{data['f1']:.4f}`\n"

    md_path = os.path.join(reports_dir, "verity_v2_short_text_results.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(md_content)

    print(f"Short text robustness report saved to {json_path} and {md_path}")
    return report

if __name__ == "__main__":
    evaluate_v2_short_text()
