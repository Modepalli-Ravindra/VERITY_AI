import os
import sys
import json
import time
import argparse
import pandas as pd
import numpy as np
from tqdm import tqdm
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, matthews_corrcoef, roc_auc_score, confusion_matrix

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../'))
sys.path.insert(0, project_root)

from backend.ml.fusion_model import FeatureFusionDetector
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
    
    # Init models (will warm up)
    FeatureFusionDetector.load_detector()
    v4_threshold = FeatureFusionDetector._cached_threshold
    print(f"V4-B Threshold: {v4_threshold}")
    
    v5_service = V5InferenceService.get_instance()
    v5_threshold = v5_service.config.threshold
    print(f"V5 Threshold: {v5_threshold}")
    
    datasets = [
        {"name": "HC3 Validation", "path": os.path.join(project_root, 'dataset/v5/val.csv'), "text_col": "text", "label_col": "label", "domain": "in-domain (v5)"},
        {"name": "RAID 20K Unseen", "path": os.path.join(project_root, 'dataset/raid/raid_subset.csv'), "text_col": "text", "label_col": "label", "attack_col": "attack", "domain": "unseen/out-of-domain"},
        {"name": "Formal Human", "path": os.path.join(project_root, 'dataset/formal/formal_subsets.csv'), "text_col": "text", "label_col": "label", "domain": "in-domain (v5) / formal"},
        {"name": "ASAP 2.0 Essays", "path": os.path.join(project_root, 'dataset/asap_2.0/test/ASAP_2_Final_github_test.csv'), "text_col": "full_text", "label_col": "label", "domain": "unseen/out-of-domain (human only)"}
    ]
    
    final_results = {
        "models": {
            "v4b": {"threshold": v4_threshold},
            "v5": {"threshold": v5_threshold, "max_sequence_length": v5_service.config.max_sequence_length}
        },
        "datasets": {}
    }
    
    # Warmup
    print("Warming up models...")
    warmup_text = "This is a simple warmup text that needs to be longer than 50 characters so that it doesn't get rejected by any validation rules if we apply them."
    FeatureFusionDetector.evaluate(warmup_text)
    v5_service.analyze(warmup_text)
    
    for ds in datasets:
        print(f"\n--- Benchmarking {ds['name']} ---")
        if not os.path.exists(ds['path']):
            print("NOT AVAILABLE")
            final_results["datasets"][ds['name']] = "NOT AVAILABLE"
            continue
            
        df = pd.read_csv(ds['path'], encoding='utf-8' if 'ASAP' not in ds['name'] else 'ISO-8859-1')
        if 'ASAP' in ds['name']:
            if 'full_text' not in df.columns:
                print("Missing full_text column in ASAP.")
                continue
            df['label'] = 0
            
        if args.max_samples and len(df) > args.max_samples:
            if 'attack_col' in ds and ds['attack_col'] in df.columns:
                df = df.groupby(ds['attack_col'], group_keys=False).apply(lambda x: x.sample(n=int(np.ceil(args.max_samples * len(x)/len(df))), random_state=42)).head(args.max_samples)
            else:
                df = df.sample(n=args.max_samples, random_state=42)
                
        targets = []
        v4_probs = []
        v4_preds = []
        v5_probs = []
        v5_preds = []
        v4_latencies = []
        v5_latencies = []
        
        attacks = []
        
        has_attack = 'attack_col' in ds and ds['attack_col'] in df.columns
        
        for idx, row in tqdm(df.iterrows(), total=len(df), desc=f"{ds['name']}"):
            text = str(row[ds['text_col']])
            if len(text.split()) < 10: continue
            
            label = row[ds['label_col']]
            
            if has_attack:
                attacks.append(row[ds['attack_col']])
            
            # V4 Inference
            t0 = time.time()
            v4_res = FeatureFusionDetector.evaluate(text)
            t1 = time.time()
            v4_latencies.append((t1 - t0) * 1000)
            if 'ai_probability' in v4_res:
                v4_probs.append(v4_res['ai_probability'])
            else:
                v4_probs.append(0.5)
            v4_preds.append(1 if v4_probs[-1] >= v4_threshold else 0)
            
            # V5 Inference
            t2 = time.time()
            v5_res = v5_service.analyze(text)
            t3 = time.time()
            v5_latencies.append((t3 - t2) * 1000)
            v5_probs.append(v5_res['ai_probability'])
            v5_preds.append(1 if v5_probs[-1] >= v5_threshold else 0)
            
            targets.append(label)
            
        # Metrics
        v4_metrics = compute_metrics(targets, v4_probs, v4_preds)
        v5_metrics = compute_metrics(targets, v5_probs, v5_preds)
        
        v4_lat_mean = np.mean(v4_latencies) if len(v4_latencies) > 0 else 0
        v5_lat_mean = np.mean(v5_latencies) if len(v5_latencies) > 0 else 0
        
        res_dict = {
            "domain": ds['domain'],
            "samples": len(targets),
            "v4b": {
                "overall": v4_metrics,
                "latency_mean_ms": float(v4_lat_mean),
                "latency_median_ms": float(np.median(v4_latencies)) if len(v4_latencies) > 0 else 0,
                "latency_p95_ms": float(np.percentile(v4_latencies, 95)) if len(v4_latencies) > 0 else 0,
                "throughput_samples_per_sec": 1000.0 / v4_lat_mean if v4_lat_mean > 0 else 0
            },
            "v5": {
                "overall": v5_metrics,
                "latency_mean_ms": float(v5_lat_mean),
                "latency_median_ms": float(np.median(v5_latencies)) if len(v5_latencies) > 0 else 0,
                "latency_p95_ms": float(np.percentile(v5_latencies, 95)) if len(v5_latencies) > 0 else 0,
                "throughput_samples_per_sec": 1000.0 / v5_lat_mean if v5_lat_mean > 0 else 0
            }
        }
        
        if has_attack:
            res_dict['v4b']['categories'] = {}
            res_dict['v5']['categories'] = {}
            unique_attacks = np.unique(attacks)
            targets_arr = np.array(targets)
            v4_probs_arr = np.array(v4_probs)
            v4_preds_arr = np.array(v4_preds)
            v5_probs_arr = np.array(v5_probs)
            v5_preds_arr = np.array(v5_preds)
            attacks_arr = np.array(attacks)
            
            for att in unique_attacks:
                mask = (attacks_arr == att)
                res_dict['v4b']['categories'][att] = compute_metrics(targets_arr[mask], v4_probs_arr[mask], v4_preds_arr[mask])
                res_dict['v5']['categories'][att] = compute_metrics(targets_arr[mask], v5_probs_arr[mask], v5_preds_arr[mask])
                
        final_results["datasets"][ds['name']] = res_dict
        
    os.makedirs(os.path.join(project_root, 'experiments/v5_modernbert/results'), exist_ok=True)
    json_out = os.path.join(project_root, 'experiments/v5_modernbert/results/v4_vs_v5_benchmark.json')
    with open(json_out, 'w') as f:
        json.dump(final_results, f, indent=2)
        
    md_out = os.path.join(project_root, 'experiments/v5_modernbert/results/V4_VS_V5_BENCHMARK.md')
    with open(md_out, 'w') as f:
        f.write("# V4-B vs V5 ModernBERT Benchmark\n\n")
        
        f.write("## Model Configuration\n")
        f.write(f"- **V4-B:** DistilRoBERTa (768) + Stylometric (20) Fusion. Threshold: {v4_threshold}\n")
        f.write(f"- **V5 ModernBERT:** ModernBERT-base (768) + Stylometric (20) Fusion. Threshold: {v5_threshold}, Max Sequence Length: {final_results['models']['v5']['max_sequence_length']}\n\n")
        
        f.write("## Dataset Methodology\n")
        for ds in datasets:
            if final_results["datasets"].get(ds['name']) != "NOT AVAILABLE":
                f.write(f"- **{ds['name']}**: {final_results['datasets'][ds['name']]['domain']}\n")
        
        f.write("\n## Overall Results\n\n")
        for ds in datasets:
            res = final_results["datasets"].get(ds['name'])
            if res == "NOT AVAILABLE": continue
            f.write(f"### {ds['name']} (N={res['samples']})\n")
            f.write("| Metric | V4-B | V5 | Diff |\n")
            f.write("|---|---|---|---|\n")
            for m in ['accuracy', 'f1', 'auroc', 'ai_recall', 'human_recall', 'human_fpr']:
                if m in res['v4b']['overall']:
                    v4_val = res['v4b']['overall'][m]
                    v5_val = res['v5']['overall'][m]
                    diff = v5_val - v4_val
                    f.write(f"| {m} | {v4_val:.4f} | {v5_val:.4f} | {diff:+.4f} |\n")
            f.write("\n")
            
        f.write("## Robustness Results\n\n")
        for ds in datasets:
            res = final_results["datasets"].get(ds['name'])
            if res == "NOT AVAILABLE" or 'categories' not in res['v4b']: continue
            f.write(f"### {ds['name']} (By Transformation/Attack)\n")
            f.write("| Attack | V4-B AI Recall | V5 AI Recall | Diff |\n")
            f.write("|---|---|---|---|\n")
            for att, v4_cat in res['v4b']['categories'].items():
                v5_cat = res['v5']['categories'][att]
                v4_r = v4_cat.get('ai_recall', 0)
                v5_r = v5_cat.get('ai_recall', 0)
                diff = v5_r - v4_r
                f.write(f"| {att} | {v4_r:.4f} | {v5_r:.4f} | {diff:+.4f} |\n")
            f.write("\n")
            
        f.write("## Latency\n\n")
        f.write("| Dataset | V4-B Mean (ms) | V5 Mean (ms) | V4-B Throughput | V5 Throughput |\n")
        f.write("|---|---|---|---|---|\n")
        for ds in datasets:
            res = final_results["datasets"].get(ds['name'])
            if res == "NOT AVAILABLE": continue
            f.write(f"| {ds['name']} | {res['v4b']['latency_mean_ms']:.2f} | {res['v5']['latency_mean_ms']:.2f} | {res['v4b']['throughput_samples_per_sec']:.2f} | {res['v5']['throughput_samples_per_sec']:.2f} |\n")
            
        f.write("\n## Interpretation\n")
        f.write("Automated interpretation based on results:\n")
        f.write("- **Improvements**: Check diff columns in Overall Results.\n")
        f.write("- **False Positives**: See `human_fpr` differences.\n")
        f.write("- **Robustness**: Compare AI recall on RAID attacks.\n")
        
        f.write("\n## Production Recommendation\n")
        
        raid_res = final_results["datasets"].get("RAID 20K Unseen")
        if raid_res != "NOT AVAILABLE" and 'overall' in raid_res['v5']:
            v5_f1 = raid_res['v5']['overall']['f1']
            v4_f1 = raid_res['v4b']['overall']['f1']
            v5_fpr = raid_res['v5']['overall']['human_fpr']
            v4_fpr = raid_res['v4b']['overall']['human_fpr']
            if v5_f1 > v4_f1 + 0.01 and v5_fpr <= v4_fpr + 0.02:
                f.write("RECOMMENDATION: V5 demonstrates meaningful improvement on unseen out-of-domain benchmarks with acceptable FPR. Consider replacement.\n")
            else:
                f.write("RECOMMENDATION: Keep V4-B as production and continue V5 research. V5 did not sufficiently outperform V4-B on out-of-domain robustness or had unacceptable FPR regressions.\n")
        else:
            f.write("RECOMMENDATION: Keep V4-B as production (insufficient unseen evaluation data to recommend replacement).\n")
            
    print(f"Benchmark complete. JSON saved to {json_out}, Markdown to {md_out}.")
    print("Final console summary:")
    with open(md_out, 'r') as f:
        print(f.read())

if __name__ == "__main__":
    run_benchmark()
