import os
import sys
import json
import csv
import torch
import numpy as np
import pandas as pd
from pathlib import Path

root_dir = Path(r"c:\Users\user\OneDrive\Desktop\VERITY")
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.ml.text_preprocessing import preprocess_text
from backend.ml.stylometrics import StylometricExtractor
from backend.ml.verity_model import VerityFusionClassifier
from transformers import AutoTokenizer, AutoModel
from scratch_v3_train import SimpleScaler

def calculate_metrics(y_true, y_pred, y_prob):
    from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, matthews_corrcoef, roc_auc_score, confusion_matrix
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0,1]).ravel()
    acc = accuracy_score(y_true, y_pred)
    ai_prec = precision_score(y_true, y_pred, pos_label=1, zero_division=0)
    ai_rec = recall_score(y_true, y_pred, pos_label=1, zero_division=0)
    ai_f1 = f1_score(y_true, y_pred, pos_label=1, zero_division=0)
    
    hum_prec = precision_score(y_true, y_pred, pos_label=0, zero_division=0)
    hum_rec = recall_score(y_true, y_pred, pos_label=0, zero_division=0)
    hum_f1 = f1_score(y_true, y_pred, pos_label=0, zero_division=0)
    
    overall_f1 = f1_score(y_true, y_pred, average='weighted', zero_division=0)
    mcc = matthews_corrcoef(y_true, y_pred)
    try:
        auroc = roc_auc_score(y_true, y_prob)
    except:
        auroc = 0.0
        
    hum_fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0
    
    return {
        "acc": acc, "hum_prec": hum_prec, "hum_rec": hum_rec, "hum_f1": hum_f1, "hum_fpr": hum_fpr,
        "ai_prec": ai_prec, "ai_rec": ai_rec, "ai_f1": ai_f1, "overall_f1": overall_f1,
        "mcc": mcc, "auroc": auroc, "tp": tp, "fp": fp, "fn": fn, "tn": tn
    }

def main():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    # LOAD V2 MODEL & SCALER
    print("Loading V2 Model...")
    v2_dir = os.path.join(root_dir, "backend", "models", "verity_detector_v2")
    with open(os.path.join(v2_dir, "stylometric_scaler.json")) as f:
        v2_s = json.load(f)
    v2_scaler = SimpleScaler()
    v2_scaler.mean = v2_s["mean"]
    v2_scaler.std = v2_s["std"]
    
    v2_classifier = VerityFusionClassifier(semantic_dim=768, stylometric_dim=20, sem_proj_dim=256, sty_proj_dim=64).to(device)
    v2_classifier.load_state_dict(torch.load(os.path.join(v2_dir, "best_model.pt"), map_location=device))
    v2_classifier.eval()

    # LOAD V3 MODEL & SCALER
    print("Loading V3 Model...")
    v3_dir = os.path.join(root_dir, "experiments", "verity_v3", "model")
    with open(os.path.join(v3_dir, "stylometric_scaler.json")) as f:
        v3_s = json.load(f)
    v3_scaler = SimpleScaler()
    v3_scaler.mean = v3_s["mean"]
    v3_scaler.std = v3_s["std"]
    
    v3_classifier = VerityFusionClassifier(semantic_dim=768, stylometric_dim=20, sem_proj_dim=256, sty_proj_dim=64).to(device)
    v3_classifier.load_state_dict(torch.load(os.path.join(v3_dir, "best_model.pt"), map_location=device))
    v3_classifier.eval()

    tokenizer = AutoTokenizer.from_pretrained("distilroberta-base")
    transformer = AutoModel.from_pretrained("distilroberta-base").to(device)
    transformer.eval()

    # LOAD EVALUATION DATA
    print("Loading Evaluation Data...")
    
    # Avoid V3 Train
    v3_train = pd.read_csv(os.path.join(root_dir, "experiments", "verity_v3", "v3_train.csv"))
    v3_train_texts = set(v3_train['text'].str.strip().str.lower())
    
    eval_samples = []
    
    # ASAP TEST (100)
    asap_test = pd.read_csv(os.path.join(root_dir, "dataset", "asap_2.0", "test", "ASAP_2_Final_github_test.csv"))
    asap_test = asap_test.dropna(subset=['full_text'])
    for _, row in asap_test.sample(100, random_state=42).iterrows():
        t = row['full_text'].strip()
        if t.lower() not in v3_train_texts and len(t.split()) > 50:
            eval_samples.append({"text": t, "label": 0, "source": "asap_test", "formality": "formal_technical"})
            
    # HC3 (100 Human, 100 AI)
    hc3_h, hc3_a = 0, 0
    with open(os.path.join(root_dir, "dataset", "hc3", "all.jsonl"), "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip(): continue
            d = json.loads(line)
            source = d.get("source", "unknown")
            form = "formal_technical" if source in ["wiki_csai", "finance", "medicine"] else "informal_natural"
            for h in d.get("human_answers", []):
                h = h.strip()
                if hc3_h < 100 and h.lower() not in v3_train_texts and len(h.split()) > 50:
                    eval_samples.append({"text": h, "label": 0, "source": "hc3", "formality": form})
                    hc3_h += 1
            for a in d.get("chatgpt_answers", []):
                a = a.strip()
                if hc3_a < 100 and a.lower() not in v3_train_texts and len(a.split()) > 50:
                    eval_samples.append({"text": a, "label": 1, "source": "hc3", "formality": form})
                    hc3_a += 1
            if hc3_h >= 100 and hc3_a >= 100: break

    # RAID (100 Human, 100 AI)
    raid = pd.read_csv(os.path.join(root_dir, "dataset", "raid", "raid_subset.csv"))
    rh, ra = 0, 0
    for _, row in raid.sample(frac=1, random_state=42).iterrows():
        t = row['text'].strip()
        m = row['model']
        l = 0 if m == "human" else 1
        if l == 0 and rh < 100 and t.lower() not in v3_train_texts and len(t.split()) > 50:
            eval_samples.append({"text": t, "label": 0, "source": "raid", "formality": "formal_technical"})
            rh += 1
        elif l == 1 and ra < 100 and t.lower() not in v3_train_texts and len(t.split()) > 50:
            eval_samples.append({"text": t, "label": 1, "source": "raid", "formality": "formal_technical"})
            ra += 1
        if rh >= 100 and ra >= 100: break

    # EVALUATE
    print(f"Total Eval Samples: {len(eval_samples)}")
    batch_size = 64
    for i in range(0, len(eval_samples), batch_size):
        batch = eval_samples[i:i+batch_size]
        batch_texts = [preprocess_text(s["text"]) for s in batch]
        
        raw_sty = [StylometricExtractor.get_vector(t) for t in batch_texts]
        
        v2_sty_tensor = torch.tensor([v2_scaler.transform(v) for v in raw_sty], dtype=torch.float32, device=device)
        v3_sty_tensor = torch.tensor([v3_scaler.transform(v) for v in raw_sty], dtype=torch.float32, device=device)
        
        inputs = tokenizer(batch_texts, padding=True, truncation=True, max_length=256, return_tensors="pt").to(device)
        with torch.no_grad():
            outputs = transformer(**inputs)
            mask = inputs["attention_mask"].unsqueeze(-1)
            sem_tensor = (outputs.last_hidden_state * mask).sum(dim=1) / mask.sum(dim=1).clamp(min=1e-9)
            
            logits2 = v2_classifier(sem_tensor, v2_sty_tensor)
            probs2 = torch.sigmoid(logits2).squeeze(-1).cpu().numpy().tolist()
            if type(probs2) is float: probs2 = [probs2]
            
            logits3 = v3_classifier(sem_tensor, v3_sty_tensor)
            probs3 = torch.sigmoid(logits3).squeeze(-1).cpu().numpy().tolist()
            if type(probs3) is float: probs3 = [probs3]
            
        for s, p2, p3 in zip(batch, probs2, probs3):
            s["v2_prob"] = p2
            s["v3_prob"] = p3
            wc = len(s["text"].split())
            if wc < 50: s["len_cat"] = "short"
            elif wc <= 250: s["len_cat"] = "medium"
            else: s["len_cat"] = "long"

    y_true = [s["label"] for s in eval_samples]
    v2_preds = [1 if s["v2_prob"] >= 0.70 else 0 for s in eval_samples]
    v3_preds = [1 if s["v3_prob"] >= 0.70 else 0 for s in eval_samples]
    v3_probs = [s["v3_prob"] for s in eval_samples]

    v2_m = calculate_metrics(y_true, v2_preds, [s["v2_prob"] for s in eval_samples])
    v3_m = calculate_metrics(y_true, v3_preds, v3_probs)

    # BREAKDOWNS for V3 vs V2
    def bdown(subset_fn):
        sub_true = [s["label"] for s in eval_samples if subset_fn(s)]
        sub_v2 = [1 if s["v2_prob"] >= 0.70 else 0 for s in eval_samples if subset_fn(s)]
        sub_v3 = [1 if s["v3_prob"] >= 0.70 else 0 for s in eval_samples if subset_fn(s)]
        return calculate_metrics(sub_true, sub_v2, []), calculate_metrics(sub_true, sub_v3, [])
        
    hc3_v2, hc3_v3 = bdown(lambda x: x["source"] == "hc3")
    raid_v2, raid_v3 = bdown(lambda x: x["source"] == "raid")
    asap_v2, asap_v3 = bdown(lambda x: x["source"] == "asap_test")
    form_v2, form_v3 = bdown(lambda x: x["formality"] == "formal_technical")
    inf_v2, inf_v3 = bdown(lambda x: x["formality"] == "informal_natural")

    # THRESHOLD SWEEP V3
    sweep = []
    for t in [0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80]:
        p = [1 if prob >= t else 0 for prob in v3_probs]
        m = calculate_metrics(y_true, p, v3_probs)
        sweep.append((t, m))

    # SUCCESS CRITERIA
    c1 = v3_m["hum_rec"] >= 0.80
    c2 = form_v3["hum_fpr"] < form_v2["hum_fpr"] * 0.5
    c3 = v3_m["ai_rec"] >= 0.80
    c4 = v3_m["overall_f1"] >= v2_m["overall_f1"] * 0.95
    c5 = asap_v3["hum_fpr"] < asap_v2["hum_fpr"]

    success = c1 and c2 and c3 and c4 and c5

    with open(os.path.join(root_dir, "experiments", "verity_v3", "V3_REPORT.md"), "w") as f:
        f.write("# VERITY V3 Experimental Report\n\n")
        f.write("## Overall Metrics (Threshold 0.70)\n")
        f.write("| Metric | V2 Current | V3 Experimental | Change |\n")
        f.write("|---|---|---|---|\n")
        f.write(f"| Accuracy | {v2_m['acc']:.4f} | {v3_m['acc']:.4f} | {v3_m['acc']-v2_m['acc']:.4f} |\n")
        f.write(f"| Human Recall | {v2_m['hum_rec']:.4f} | {v3_m['hum_rec']:.4f} | {v3_m['hum_rec']-v2_m['hum_rec']:.4f} |\n")
        f.write(f"| Human FPR | {v2_m['hum_fpr']:.4f} | {v3_m['hum_fpr']:.4f} | {v3_m['hum_fpr']-v2_m['hum_fpr']:.4f} |\n")
        f.write(f"| AI Recall | {v2_m['ai_rec']:.4f} | {v3_m['ai_rec']:.4f} | {v3_m['ai_rec']-v2_m['ai_rec']:.4f} |\n")
        f.write(f"| Overall F1 | {v2_m['overall_f1']:.4f} | {v3_m['overall_f1']:.4f} | {v3_m['overall_f1']-v2_m['overall_f1']:.4f} |\n")
        f.write(f"| MCC | {v2_m['mcc']:.4f} | {v3_m['mcc']:.4f} | {v3_m['mcc']-v2_m['mcc']:.4f} |\n")
        
        f.write("\n## Breakdown by Category (Human FPR)\n")
        f.write("| Category | V2 FPR | V3 FPR |\n")
        f.write("|---|---|---|\n")
        f.write(f"| Formal/Technical | {form_v2['hum_fpr']:.4f} | {form_v3['hum_fpr']:.4f} |\n")
        f.write(f"| Informal/Natural | {inf_v2['hum_fpr']:.4f} | {inf_v3['hum_fpr']:.4f} |\n")
        f.write(f"| ASAP 2.0 (Essays) | {asap_v2['hum_fpr']:.4f} | {asap_v3['hum_fpr']:.4f} |\n")
        f.write(f"| HC3 | {hc3_v2['hum_fpr']:.4f} | {hc3_v3['hum_fpr']:.4f} |\n")
        f.write(f"| RAID | {raid_v2['hum_fpr']:.4f} | {raid_v3['hum_fpr']:.4f} |\n")

        f.write("\n## V3 Threshold Sweep\n")
        f.write("| Threshold | Hum Rec | Hum FPR | AI Rec | F1 | MCC |\n")
        f.write("|---|---|---|---|---|---|\n")
        for t, m in sweep:
            f.write(f"| {t:.2f} | {m['hum_rec']:.4f} | {m['hum_fpr']:.4f} | {m['ai_rec']:.4f} | {m['overall_f1']:.4f} | {m['mcc']:.4f} |\n")
            
        f.write(f"\n## Success Criteria: {'PASSED' if success else 'FAILED'}\n")
        f.write("1. Human recall >= 80%: " + ("Yes" if c1 else "No") + "\n")
        f.write("2. Formal-human FPR improves: " + ("Yes" if c2 else "No") + "\n")
        f.write("3. AI recall acceptable: " + ("Yes" if c3 else "No") + "\n")
        f.write("4. Overall F1 not degraded: " + ("Yes" if c4 else "No") + "\n")
        f.write("5. Improved on ASAP: " + ("Yes" if c5 else "No") + "\n")
        
        f.write("\n## Status\n")
        f.write("V2 PRODUCTION: UNTOUCHED\n")
        f.write("V3: EXPERIMENTAL ONLY\n")
        f.write("PRODUCTION API: UNTOUCHED\n")
        f.write("FRONTEND: UNTOUCHED\n")
        f.write("PRODUCTION CHECKPOINT: UNTOUCHED\n")

if __name__ == "__main__":
    main()
