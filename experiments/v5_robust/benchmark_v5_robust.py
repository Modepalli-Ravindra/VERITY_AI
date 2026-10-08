import os
import sys
import json
import time
import argparse
import pandas as pd
import numpy as np
from tqdm import tqdm
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, matthews_corrcoef, roc_auc_score, confusion_matrix
import torch

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../'))
sys.path.insert(0, project_root)

from backend.ml.experimental.v5_inference import V5InferenceService

def compute_metrics(targets, probs, preds):
    if len(targets) == 0: return {}
    targets = np.array(targets)
    preds = np.array(preds)
    probs = np.array(probs)
    
    human_mask = (targets == 0)
    ai_mask = (targets == 1)
    
    acc = float(accuracy_score(targets, preds))
    prec = float(precision_score(targets, preds, zero_division=0))
    
    human_recall = float(np.sum((preds == 0) & human_mask) / np.sum(human_mask) if np.sum(human_mask) > 0 else 0)
    ai_recall = float(np.sum((preds == 1) & ai_mask) / np.sum(ai_mask) if np.sum(ai_mask) > 0 else 0)
    
    f1 = float(f1_score(targets, preds, zero_division=0))
    mcc = float(matthews_corrcoef(targets, preds))
    try:
        auroc = float(roc_auc_score(targets, probs))
    except ValueError:
        auroc = 0.0
        
    tn, fp, fn, tp = confusion_matrix(targets, preds, labels=[0,1]).ravel()
    human_fpr = float(fp / (fp + tn) if (fp + tn) > 0 else 0.0)
    
    return {
        'accuracy': acc,
        'precision': prec,
        'ai_recall': ai_recall,
        'human_recall': human_recall,
        'f1': f1,
        'mcc': mcc,
        'auroc': auroc,
        'human_fpr': human_fpr,
        'confusion_matrix': [[int(tn), int(fp)], [int(fn), int(tp)]]
    }

def run_benchmark():
    parser = argparse.ArgumentParser()
    parser.add_argument('--max_samples', type=int, default=None)
    args = parser.parse_args()
    
    # Init V5 (Original)
    v5_original = V5InferenceService.get_instance()
    v5_orig_thresh = v5_original.config.threshold
    print(f"V5 Original Threshold: {v5_orig_thresh}")
    
    # Init V5-Robust
    # We will instantiate a new service directly from the new checkpoint
    v5_robust = V5InferenceService(checkpoint_path=os.path.join(project_root, 'experiments/v5_robust/checkpoints/best_model.pt'))
    v5_robust_thresh = v5_robust.config.threshold
    print(f"V5 Robust Threshold: {v5_robust_thresh}")
    
    datasets = [
        {"name": "HC3 Validation (V5)", "path": os.path.join(project_root, 'dataset/v5/val.csv'), "text_col": "text", "label_col": "label", "domain": "in-domain (v5 original)"},
        {"name": "Formal Test (Untouched)", "path": os.path.join(project_root, 'dataset/v5_robust/formal_test.csv'), "text_col": "text", "label_col": "label", "domain": "formal"},
        {"name": "RAID 20K Unseen", "path": os.path.join(project_root, 'dataset/raid/raid_subset.csv'), "text_col": "text", "label_col": "label", "attack_col": "attack", "domain": "unseen/out-of-domain"}
    ]
    
    final_results = {
        "models": {
            "v5": {"threshold": v5_orig_thresh},
            "v5_robust": {"threshold": v5_robust_thresh}
        },
        "datasets": {}
    }
    
    # Warmup
    print("Warming up models...")
    warmup_text = "This is a simple warmup text that needs to be longer than 50 characters so that it doesn't get rejected by any validation rules if we apply them."
    v5_original.analyze(warmup_text)
    v5_robust.analyze(warmup_text)
    
    for ds in datasets:
        print(f"\n--- Benchmarking {ds['name']} ---")
        if not os.path.exists(ds['path']):
            print("NOT AVAILABLE")
            final_results["datasets"][ds['name']] = "NOT AVAILABLE"
            continue
            
        df = pd.read_csv(ds['path'])
            
        if args.max_samples and len(df) > args.max_samples:
            if 'attack_col' in ds and ds['attack_col'] in df.columns:
                df = df.groupby(ds['attack_col'], group_keys=False).apply(lambda x: x.sample(n=int(np.ceil(args.max_samples * len(x)/len(df))), random_state=42)).head(args.max_samples)
            else:
                df = df.sample(n=args.max_samples, random_state=42)
                
        targets = []
        v5_probs = []
        v5_preds = []
        v5r_probs = []
        v5r_preds = []
        v5_latencies = []
        v5r_latencies = []
        
        attacks = []
        has_attack = 'attack_col' in ds and ds['attack_col'] in df.columns
        
        for idx, row in tqdm(df.iterrows(), total=len(df), desc=f"{ds['name']}"):
            text = str(row[ds['text_col']])
            if len(text.split()) < 10: continue
            
            label = row[ds['label_col']]
            
            if has_attack:
                attacks.append(row[ds['attack_col']])
            
            # V5 Inference
            t0 = time.time()
            v5_res = v5_original.analyze(text)
            t1 = time.time()
            v5_latencies.append((t1 - t0) * 1000)
            v5_probs.append(v5_res['ai_probability'])
            v5_preds.append(1 if v5_probs[-1] >= v5_orig_thresh else 0)
            
            # V5-Robust Inference
            t2 = time.time()
            v5r_res = v5_robust.analyze(text)
            t3 = time.time()
            v5r_latencies.append((t3 - t2) * 1000)
            v5r_probs.append(v5r_res['ai_probability'])
            v5r_preds.append(1 if v5r_probs[-1] >= v5_robust_thresh else 0)
            
            targets.append(label)
            
        # Metrics
        v5_metrics = compute_metrics(targets, v5_probs, v5_preds)
        v5r_metrics = compute_metrics(targets, v5r_probs, v5r_preds)
        
        v5_lat_mean = np.mean(v5_latencies) if len(v5_latencies) > 0 else 0
        v5r_lat_mean = np.mean(v5r_latencies) if len(v5r_latencies) > 0 else 0
        
        res_dict = {
            "domain": ds['domain'],
            "samples": len(targets),
            "v5": {
                "overall": v5_metrics,
                "latency_mean_ms": float(v5_lat_mean),
                "throughput_samples_per_sec": 1000.0 / v5_lat_mean if v5_lat_mean > 0 else 0
            },
            "v5_robust": {
                "overall": v5r_metrics,
                "latency_mean_ms": float(v5r_lat_mean),
                "throughput_samples_per_sec": 1000.0 / v5r_lat_mean if v5r_lat_mean > 0 else 0
            }
        }
        
        if has_attack:
            res_dict['v5']['categories'] = {}
            res_dict['v5_robust']['categories'] = {}
            unique_attacks = np.unique(attacks)
            targets_arr = np.array(targets)
            v5_probs_arr = np.array(v5_probs)
            v5_preds_arr = np.array(v5_preds)
            v5r_probs_arr = np.array(v5r_probs)
            v5r_preds_arr = np.array(v5r_preds)
            attacks_arr = np.array(attacks)
            
            for att in unique_attacks:
                mask = (attacks_arr == att)
                res_dict['v5']['categories'][att] = compute_metrics(targets_arr[mask], v5_probs_arr[mask], v5_preds_arr[mask])
                res_dict['v5_robust']['categories'][att] = compute_metrics(targets_arr[mask], v5r_probs_arr[mask], v5r_preds_arr[mask])
                
        final_results["datasets"][ds['name']] = res_dict
        
    os.makedirs(os.path.join(project_root, 'experiments/v5_robust/results'), exist_ok=True)
    json_out = os.path.join(project_root, 'experiments/v5_robust/results/v5_robust_evaluation_results.json')
    with open(json_out, 'w') as f:
        json.dump(final_results, f, indent=2)
        
    # Generate CSV comparison
    csv_out = os.path.join(project_root, 'experiments/v5_robust/results/v5_vs_v5_robust_comparison.csv')
    csv_rows = []
    for ds in datasets:
        name = ds['name']
        res = final_results["datasets"].get(name)
        if res == "NOT AVAILABLE": continue
        for m in ['accuracy', 'precision', 'ai_recall', 'human_recall', 'f1', 'mcc', 'auroc', 'human_fpr']:
            v5_val = res['v5']['overall'].get(m, 0)
            v5r_val = res['v5_robust']['overall'].get(m, 0)
            csv_rows.append({"Dataset": name, "Metric": m, "V5": v5_val, "V5-Robust": v5r_val, "Diff": v5r_val - v5_val})
    pd.DataFrame(csv_rows).to_csv(csv_out, index=False)
        
    # Generate Markdown
    md_out = os.path.join(project_root, 'experiments/v5_robust/results/v5_vs_v5_robust_comparison.md')
    with open(md_out, 'w') as f:
        f.write("# V5 vs V5-Robust ModernBERT Benchmark\n\n")
        f.write("## Overview\n")
        f.write(f"- **V5 (Original):** Threshold {v5_orig_thresh}\n")
        f.write(f"- **V5-Robust:** Threshold {v5_robust_thresh}\n\n")
        
        f.write("## Overall Results\n\n")
        for ds in datasets:
            res = final_results["datasets"].get(ds['name'])
            if res == "NOT AVAILABLE": continue
            f.write(f"### {ds['name']} (N={res['samples']})\n")
            f.write("| Metric | V5 | V5-Robust | Diff |\n")
            f.write("|---|---|---|---|\n")
            for m in ['accuracy', 'precision', 'ai_recall', 'human_recall', 'f1', 'mcc', 'auroc', 'human_fpr']:
                if m in res['v5']['overall']:
                    v5_val = res['v5']['overall'][m]
                    v5r_val = res['v5_robust']['overall'][m]
                    diff = v5r_val - v5_val
                    f.write(f"| {m} | {v5_val:.4f} | {v5r_val:.4f} | {diff:+.4f} |\n")
            f.write("\n")
            
        f.write("## Robustness Results (RAID)\n\n")
        for ds in datasets:
            res = final_results["datasets"].get(ds['name'])
            if res == "NOT AVAILABLE" or 'categories' not in res['v5']: continue
            f.write(f"### {ds['name']} (By Transformation/Attack)\n")
            f.write("| Attack | V5 AI Recall | V5-Robust AI Recall | Diff |\n")
            f.write("|---|---|---|---|\n")
            for att, v5_cat in res['v5']['categories'].items():
                v5r_cat = res['v5_robust']['categories'][att]
                v5_r = v5_cat.get('ai_recall', 0)
                v5r_r = v5r_cat.get('ai_recall', 0)
                diff = v5r_r - v5_r
                f.write(f"| {att} | {v5_r:.4f} | {v5r_r:.4f} | {diff:+.4f} |\n")
            f.write("\n")
            
        f.write("## Latency\n\n")
        f.write("| Dataset | V5 Mean (ms) | V5-Robust Mean (ms) | V5 Throughput | V5-Robust Throughput |\n")
        f.write("|---|---|---|---|---|\n")
        for ds in datasets:
            res = final_results["datasets"].get(ds['name'])
            if res == "NOT AVAILABLE": continue
            f.write(f"| {ds['name']} | {res['v5']['latency_mean_ms']:.2f} | {res['v5_robust']['latency_mean_ms']:.2f} | {res['v5']['throughput_samples_per_sec']:.2f} | {res['v5_robust']['throughput_samples_per_sec']:.2f} |\n")
            
    print(f"Benchmark complete. JSON saved to {json_out}, CSV to {csv_out}, Markdown to {md_out}.")

if __name__ == "__main__":
    run_benchmark()
