import os
import sys
import json
import random
import csv
from pathlib import Path
from collections import defaultdict
import numpy as np
import torch

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

def compute_ttr(text):
    words = text.lower().split()
    if not words: return 0.0
    return len(set(words)) / len(words)

def compute_sentence_stats(text):
    import re
    sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
    if not sentences: return 0.0, 0.0
    lengths = [len(s.split()) for s in sentences]
    return np.mean(lengths), np.var(lengths)

def main():
    exp_dir = os.path.join(root_dir, "experiments", "human_false_positive_analysis")
    os.makedirs(exp_dir, exist_ok=True)
    
    model_dir = os.path.join(root_dir, "backend", "models", "verity_detector_v2")
    config_path = os.path.join(model_dir, "config.json")
    model_path = os.path.join(model_dir, "best_model.pt")
    scaler_path = os.path.join(model_dir, "stylometric_scaler.json")
    
    with open(config_path, "r", encoding="utf-8") as f:
        config = json.load(f)
    with open(scaler_path, "r", encoding="utf-8") as f:
        scaler_dict = json.load(f)
        
    scaler = SimpleScaler(mean=scaler_dict["mean"], std=scaler_dict["std"])
    threshold = 0.70
    
    # 1. Load Data
    hc3_path = os.path.join(root_dir, "dataset", "hc3", "all.jsonl")
    raid_path = os.path.join(root_dir, "dataset", "raid", "raid_subset.csv")
    
    human_samples = []
    
    # Process HC3 (limit to max 5000 random for speed if desired, or all. Let's do 5000 max to finish fast)
    with open(hc3_path, "r", encoding="utf-8") as f:
        hc3_all = f.readlines()
        
    random.seed(42)
    random.shuffle(hc3_all)
    hc3_all = hc3_all[:10000] # Subsample for performance
    
    for line in hc3_all:
        if not line.strip(): continue
        data = json.loads(line)
        source = data.get("source", "unknown")
        for ans in data.get("human_answers", []):
            ans_str = str(ans).strip()
            if ans_str:
                human_samples.append({"text": ans_str, "source": "hc3", "domain": source})
                
    # Process RAID
    if os.path.exists(raid_path):
        with open(raid_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            raid_rows = list(reader)
            random.shuffle(raid_rows)
            for row in raid_rows[:10000]: # Subsample for performance
                if row.get("model", "") == "human":
                    text = row.get("text", "").strip()
                    if text:
                        human_samples.append({"text": text, "source": "raid", "domain": "abstracts"})
                        
    # Limit total samples to 5000 for reasonable runtime in background
    random.shuffle(human_samples)
    human_samples = human_samples[:1000]
    
    # Define diagnostic buckets
    # Short < 50, Medium 50-250, Long > 250
    # TTR low < 0.5, TTR high > 0.7
    # Formal: wiki_csai, finance, medicine, abstracts
    # Informal: reddit_eli5, open_qa
    
    for s in human_samples:
        text = s["text"]
        words = len(text.split())
        s["word_count"] = words
        if words < 50: s["length_bucket"] = "short"
        elif words <= 250: s["length_bucket"] = "medium"
        else: s["length_bucket"] = "long"
        
        ttr = compute_ttr(text)
        s["ttr"] = ttr
        if ttr < 0.5: s["lexical_bucket"] = "low"
        elif ttr > 0.7: s["lexical_bucket"] = "high"
        else: s["lexical_bucket"] = "medium"
        
        mean_len, var_len = compute_sentence_stats(text)
        s["mean_sent_len"] = mean_len
        s["var_sent_len"] = var_len
        if var_len < 20: s["sent_rep_bucket"] = "high_repetition"
        else: s["sent_rep_bucket"] = "normal"
        
        if s["domain"] in ["wiki_csai", "finance", "medicine", "abstracts"]:
            s["formality_bucket"] = "formal_technical"
        elif s["domain"] in ["reddit_eli5", "open_qa"]:
            s["formality_bucket"] = "informal_natural"
        else:
            s["formality_bucket"] = "unknown"
            
    # Evaluate
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
    total_batches = (len(human_samples) + batch_size - 1) // batch_size
    
    with torch.no_grad():
        for i in range(0, len(human_samples), batch_size):
            if (i // batch_size) % 1 == 0:
                print(f"Processing batch {i // batch_size}/{total_batches}")
                sys.stdout.flush()
            batch = human_samples[i:i+batch_size]
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
            if isinstance(probs, float): probs = [probs]
            
            for s, p in zip(batch, probs):
                s["pred_prob"] = p
                s["is_fp"] = p >= threshold

    # Analysis
    buckets = defaultdict(lambda: {"total": 0, "fp": 0})
    false_positives = []
    
    for s in human_samples:
        buckets["Total"]["total"] += 1
        buckets[f'Len:{s["length_bucket"]}']["total"] += 1
        buckets[f'Lex:{s["lexical_bucket"]}']["total"] += 1
        buckets[f'Rep:{s["sent_rep_bucket"]}']["total"] += 1
        buckets[f'Formality:{s["formality_bucket"]}']["total"] += 1
        buckets[f'Source:{s["source"]}']["total"] += 1
        
        if s["is_fp"]:
            buckets["Total"]["fp"] += 1
            buckets[f'Len:{s["length_bucket"]}']["fp"] += 1
            buckets[f'Lex:{s["lexical_bucket"]}']["fp"] += 1
            buckets[f'Rep:{s["sent_rep_bucket"]}']["fp"] += 1
            buckets[f'Formality:{s["formality_bucket"]}']["fp"] += 1
            buckets[f'Source:{s["source"]}']["fp"] += 1
            false_positives.append(s)

    report_path = os.path.join(exp_dir, "diagnostic_report.json")
    with open(report_path, "w") as f:
        json.dump({
            "buckets": buckets,
            "false_positives_stats": {
                "avg_word_count": np.mean([s["word_count"] for s in false_positives]) if false_positives else 0,
                "avg_ttr": np.mean([s["ttr"] for s in false_positives]) if false_positives else 0,
                "avg_sent_len_var": np.mean([s["var_sent_len"] for s in false_positives]) if false_positives else 0,
                "avg_pred_prob": np.mean([s["pred_prob"] for s in false_positives]) if false_positives else 0
            }
        }, f, indent=2)
        
    print(f"Saved diagnostic report to {report_path}")

if __name__ == "__main__":
    main()
