import os
import sys
import json
import random
from pathlib import Path
from collections import defaultdict
import numpy as np
import torch
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, matthews_corrcoef, roc_auc_score, confusion_matrix

root_dir = Path(r"c:\Users\user\OneDrive\Desktop\VERITY")
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

def main():
    model_dir = os.path.join(root_dir, "backend", "models", "verity_detector_v2")
    config_path = os.path.join(model_dir, "config.json")
    model_path = os.path.join(model_dir, "best_model.pt")
    scaler_path = os.path.join(model_dir, "stylometric_scaler.json")
    
    with open(config_path, "r", encoding="utf-8") as f:
        config = json.load(f)
    with open(scaler_path, "r", encoding="utf-8") as f:
        scaler_dict = json.load(f)
        
    scaler = SimpleScaler(mean=scaler_dict["mean"], std=scaler_dict["std"])
    current_threshold = config.get("selected_threshold", 0.5)
    print(f"CURRENT BASELINE THRESHOLD: {current_threshold}")

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
            
    # Subsample for speed during experiment
    random.seed(42)
    random.shuffle(val_samples)
    val_samples = val_samples[:500]

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

    batch_size = 64
    total_batches = (len(val_samples) + batch_size - 1) // batch_size
    print(f"Total batches to process: {total_batches}")
    
    with torch.no_grad():
        for i in range(0, len(val_samples), batch_size):
            if (i // batch_size) % 1 == 0:
                print(f"Processing batch {i // batch_size}/{total_batches}")
                sys.stdout.flush()
            
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
            
    # PHASE 3: Human specific texts
    human_texts = [
        "I went to the store today to grab some milk, but they were completely out. I honestly don't know how a grocery store runs out of milk on a Tuesday. It’s frustrating because now I have to go to a different one tomorrow morning.",
        "The mitochondria is often referred to as the powerhouse of the cell, primarily because it generates most of the cell's supply of adenosine triphosphate (ATP). This molecule is used as a source of chemical energy.",
        "so yea basically we just chilled at the park for a bit and then went to mcdonalds, it was ok but the fries were kinda cold lol. anyway ill ttyl gotta do hw.",
        "To Whom It May Concern, I am writing to formally request a leave of absence for personal reasons starting on October 15th. I have ensured all my projects are handed over.",
        "I think that Shakespeare's play Hamlet is about how too much thinking can stop you from doing things. Hamlet thinks and thinks but doesn't act until its too late. Also his uncle is really evil.",
        "When configuring a reverse proxy with Nginx, you must ensure that the `proxy_pass` directive points to the correct upstream server. Additionally, preserving the original host header is crucial for applications that rely on it.",
        "Yesterday was an amazing day! We hiked up to the summit and the view was breathtaking. You could see the entire valley below. I'm so exhausted but it was totally worth it. Can't wait to go again."
    ]
    
    human_probs = []
    with torch.no_grad():
        for t in human_texts:
            t_clean = preprocess_text(t)
            r_sty = StylometricExtractor.get_vector(t_clean)
            s_sty = scaler.transform(r_sty)
            sty_t = torch.tensor([s_sty], dtype=torch.float32, device=device)
            inputs = tokenizer([t_clean], padding=True, truncation=True, max_length=256, return_tensors="pt").to(device)
            outputs = transformer(**inputs)
            mask = inputs["attention_mask"].unsqueeze(-1)
            sem_t = (outputs.last_hidden_state * mask).sum(dim=1) / mask.sum(dim=1).clamp(min=1e-9)
            logits = classifier(sem_t, sty_t)
            p = torch.sigmoid(logits).cpu().item()
            human_probs.append(p)
            
    print("PHASE 2 THRESHOLD SWEEP:")
    print("Threshold | Acc    | Prec   | Recall | F1     | MCC    | HumRec | AIRec  | FPR    | HumFPs")
    print("-" * 90)
    for t_val in [0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80]:
        preds = [1 if p >= t_val else 0 for p in val_probs]
        acc = accuracy_score(val_targets, preds)
        prec = precision_score(val_targets, preds, zero_division=0)
        rec = recall_score(val_targets, preds, zero_division=0)
        f1 = f1_score(val_targets, preds, zero_division=0)
        mcc = matthews_corrcoef(val_targets, preds)
        cm = confusion_matrix(val_targets, preds).tolist()
        tn, fp, fn, tp = cm[0][0], cm[0][1], cm[1][0], cm[1][1]
        
        hum_rec = tn / (tn + fp) if (tn + fp) > 0 else 0
        ai_rec = tp / (tp + fn) if (tp + fn) > 0 else 0
        fpr = fp / (fp + tn) if (fp + tn) > 0 else 0
        
        hum_fp_count = sum(1 for p in human_probs if p >= t_val)
        
        row = f"{t_val:<9} | {acc:.4f} | {prec:.4f} | {rec:.4f} | {f1:.4f} | {mcc:.4f} | {hum_rec:.4f} | {ai_rec:.4f} | {fpr:.4f} | {hum_fp_count}/{len(human_texts)}"
        print(row)
        
        if abs(t_val - current_threshold) < 0.01:
            baseline = {
                "threshold": current_threshold,
                "accuracy": acc,
                "precision": prec,
                "recall": rec,
                "F1": f1,
                "human_recall": hum_rec,
                "ai_recall": ai_rec,
                "false_positive_rate": fpr
            }
            
    with open("results.json", "w") as f:
        json.dump(baseline, f)

if __name__ == "__main__":
    main()
