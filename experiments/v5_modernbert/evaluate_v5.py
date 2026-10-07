import os
import sys
import json
import time
import argparse
import torch
import pandas as pd
import numpy as np
from tqdm import tqdm
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, matthews_corrcoef, roc_auc_score, confusion_matrix
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from transformers import AutoTokenizer
from backend.ml.experimental.v5_config import V5Config
from backend.ml.experimental.verity_v5_model import VerityV5Model
from backend.ml.stylometrics import StylometricExtractor

class InferenceDataset(torch.utils.data.Dataset):
    def __init__(self, texts, labels, tokenizer, max_length):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_length = max_length
        
    def __len__(self):
        return len(self.texts)
        
    def __getitem__(self, idx):
        text = str(self.texts[idx])
        label = self.labels[idx]
        tokens = self.tokenizer(text, max_length=self.max_length, padding='max_length', truncation=True, return_tensors='pt')
        try:
            stylo = StylometricExtractor.get_vector(text)
            if len(stylo) != 20: stylo = [0.0]*20
        except:
            stylo = [0.0]*20
        return {
            'input_ids': tokens['input_ids'].squeeze(0),
            'attention_mask': tokens['attention_mask'].squeeze(0),
            'stylometric_x': torch.tensor(stylo, dtype=torch.float32),
            'label': torch.tensor(label, dtype=torch.float32)
        }

def compute_metrics(targets, probs, preds):
    if len(targets) == 0: return {}
    targets = np.array(targets)
    preds = np.array(preds)
    probs = np.array(probs)
    
    human_mask = (targets == 0)
    ai_mask = (targets == 1)
    
    acc = accuracy_score(targets, preds)
    prec = precision_score(targets, preds, zero_division=0)
    
    human_recall = np.sum((preds == 0) & human_mask) / np.sum(human_mask) if np.sum(human_mask) > 0 else 0
    ai_recall = np.sum((preds == 1) & ai_mask) / np.sum(ai_mask) if np.sum(ai_mask) > 0 else 0
    
    f1 = f1_score(targets, preds, zero_division=0)
    mcc = matthews_corrcoef(targets, preds)
    try:
        auroc = roc_auc_score(targets, probs)
    except ValueError:
        auroc = 0.0
        
    # Human FPR = FP / (FP + TN) = false positives out of human samples
    tn, fp, fn, tp = confusion_matrix(targets, preds, labels=[0,1]).ravel()
    human_fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0
    
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

def evaluate_dataset(model, tokenizer, device, max_length, df, text_col, label_col, attack_col, thresholds, batch_size=16, max_samples=None):
    if max_samples and len(df) > max_samples:
        if attack_col and attack_col in df.columns:
            # Stratified sampling by attack category
            df = df.groupby(attack_col, group_keys=False).apply(
                lambda x: x.sample(n=int(np.ceil(max_samples * len(x) / len(df))), random_state=42)
            ).head(max_samples)
        else:
            df = df.sample(n=max_samples, random_state=42)
            
    texts = df[text_col].tolist()
    labels = df[label_col].tolist()
    attacks = df[attack_col].tolist() if attack_col and attack_col in df.columns else ['none'] * len(texts)
    
    dataset = InferenceDataset(texts, labels, tokenizer, max_length)
    loader = torch.utils.data.DataLoader(dataset, batch_size=batch_size, shuffle=False)
    
    all_targets = []
    all_probs = []
    
    start_time = time.time()
    with torch.no_grad():
        for batch in tqdm(loader, desc="Evaluating"):
            input_ids = batch['input_ids'].to(device)
            attention_mask = batch['attention_mask'].to(device)
            stylo = batch['stylometric_x'].to(device)
            
            with torch.amp.autocast('cuda', enabled=(device.type == 'cuda')) if hasattr(torch, 'amp') else torch.cuda.amp.autocast(enabled=(device.type == 'cuda')):
                logits = model(input_ids, attention_mask, stylo)
                
            probs = torch.sigmoid(logits).cpu().numpy()
            all_probs.extend(probs)
            all_targets.extend(batch['label'].cpu().numpy())
            
    total_time = time.time() - start_time
    samples_per_sec = len(texts) / total_time
    ms_per_sample = (total_time / len(texts)) * 1000
    
    all_targets = np.array(all_targets)
    all_probs = np.array(all_probs)
    attacks = np.array(attacks)
    
    results_by_threshold = {}
    for thresh in thresholds:
        preds = (all_probs >= thresh).astype(int)
        metrics = compute_metrics(all_targets, all_probs, preds)
        
        # Sub-category metrics for RAID
        cat_metrics = {}
        if attack_col:
            unique_attacks = np.unique(attacks)
            for att in unique_attacks:
                mask = (attacks == att)
                if np.sum(mask) > 0:
                    att_targets = all_targets[mask]
                    att_probs = all_probs[mask]
                    att_preds = preds[mask]
                    cat_metrics[att] = compute_metrics(att_targets, att_probs, att_preds)
                    
        results_by_threshold[str(thresh)] = {
            'overall': metrics,
            'categories': cat_metrics
        }
        
    return {
        'performance': {
            'total_time_sec': total_time,
            'samples_per_sec': samples_per_sec,
            'ms_per_sample': ms_per_sample,
            'total_samples': len(texts)
        },
        'thresholds': results_by_threshold
    }

def evaluate():
    parser = argparse.ArgumentParser()
    parser.add_argument('--checkpoint', type=str, default='experiments/v5_modernbert/checkpoints/best_model.pt')
    parser.add_argument('--smoke_test', action='store_true', help='Run on a tiny subset')
    parser.add_argument('--max_samples', type=int, default=None, help='Limit evaluation to a maximum number of samples per dataset (stratified)')
    
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../'))
    parser.add_argument('--raid_path', type=str, default=os.path.join(project_root, 'dataset/raid/raid_subset.csv'))
    parser.add_argument('--hc3_path', type=str, default=os.path.join(project_root, 'dataset/v5/val.csv'))
    parser.add_argument('--asap_path', type=str, default=os.path.join(project_root, 'dataset/asap_2.0/test/ASAP_2_Final_github_test.csv'))
    parser.add_argument('--formal_path', type=str, default=os.path.join(project_root, 'dataset/formal/formal_subsets.csv'))
    
    args = parser.parse_args()
    
    print("=== V5 ModernBERT Evaluation Pipeline ===")
    config = V5Config()
    model = VerityV5Model(config)
    tokenizer = AutoTokenizer.from_pretrained(config.transformer_name)
    
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Device: {device}")
    
    max_length = config.max_sequence_length
    base_threshold = config.threshold
    
    if os.path.exists(args.checkpoint):
        try:
            checkpoint = torch.load(args.checkpoint, map_location=device)
            if isinstance(checkpoint, dict) and 'model_state_dict' in checkpoint:
                model.load_state_dict(checkpoint['model_state_dict'])
                epoch = checkpoint.get('epoch', 'N/A')
                max_length = checkpoint.get('max_length', config.max_sequence_length)
                base_threshold = checkpoint.get('threshold', config.threshold)
                print("Checkpoint loaded successfully.")
                print(f"  Epoch: {epoch}")
                print(f"  Max Length: {max_length}")
                print(f"  Threshold: {base_threshold}")
            else:
                model.load_state_dict(checkpoint)
                print("Raw state_dict checkpoint loaded successfully.")
                
            model = model.to(device)
            model.eval()
        except Exception as e:
            print(f"Failed to load checkpoint: {e}")
            return
    else:
        print(f"Checkpoint not found at {args.checkpoint}. Exiting.")
        return
        
    thresholds = [0.40, 0.50, 0.60, 0.70, 0.80]
    if base_threshold not in thresholds:
        thresholds.append(base_threshold)
    thresholds = sorted(thresholds)
    
    results = {}
    
    # 1. RAID UNSEEN BENCHMARK
    print("\n=== RAID UNSEEN BENCHMARK ===")
    if os.path.exists(args.raid_path):
        df_raid = pd.read_csv(args.raid_path)
        if args.smoke_test: df_raid = df_raid.head(100)
        res = evaluate_dataset(model, tokenizer, device, max_length, df_raid, 'text', 'label', 'attack', thresholds, max_samples=args.max_samples)
        results['RAID'] = res
        print(f"Inference latency: {res['performance']['ms_per_sample']:.2f} ms/sample")
        print(f"Metrics at base threshold {base_threshold}:")
        print(json.dumps(res['thresholds'][str(base_threshold)]['overall'], indent=2))
    else:
        print(f"NOT FOUND: {args.raid_path}")
        
    # 2. HC3 VALIDATION
    print("\n=== HC3 VALIDATION ===")
    if os.path.exists(args.hc3_path):
        df_hc3 = pd.read_csv(args.hc3_path)
        if args.smoke_test: df_hc3 = df_hc3.head(100)
        res = evaluate_dataset(model, tokenizer, device, max_length, df_hc3, 'text', 'label', None, thresholds, max_samples=args.max_samples)
        results['HC3'] = res
        print(f"Inference latency: {res['performance']['ms_per_sample']:.2f} ms/sample")
        print(f"Metrics at base threshold {base_threshold}:")
        print(json.dumps(res['thresholds'][str(base_threshold)]['overall'], indent=2))
    else:
        print(f"NOT FOUND: {args.hc3_path}")
        
    # 3. ASAP 2.0
    print("\n=== ASAP 2.0 ===")
    if os.path.exists(args.asap_path):
        df_asap = pd.read_csv(args.asap_path, encoding='ISO-8859-1') # Handle potentially weird encodings
        if 'full_text' in df_asap.columns:
            df_asap['label'] = 0 # All human
            if args.smoke_test: df_asap = df_asap.head(100)
            res = evaluate_dataset(model, tokenizer, device, max_length, df_asap, 'full_text', 'label', None, thresholds, max_samples=args.max_samples)
            results['ASAP_2.0'] = res
            print(f"Inference latency: {res['performance']['ms_per_sample']:.2f} ms/sample")
            print(f"Metrics at base threshold {base_threshold}:")
            print(json.dumps(res['thresholds'][str(base_threshold)]['overall'], indent=2))
        else:
            print("ASAP_2.0 missing full_text column")
    else:
        print(f"NOT FOUND: {args.asap_path}")
        
    # 4. FORMAL HUMAN/AI
    print("\n=== FORMAL HUMAN/AI ===")
    if os.path.exists(args.formal_path):
        df_formal = pd.read_csv(args.formal_path)
        if args.smoke_test: df_formal = df_formal.head(100)
        res = evaluate_dataset(model, tokenizer, device, max_length, df_formal, 'text', 'label', None, thresholds, max_samples=args.max_samples)
        results['Formal'] = res
        print(f"Inference latency: {res['performance']['ms_per_sample']:.2f} ms/sample")
        print(f"Metrics at base threshold {base_threshold}:")
        print(json.dumps(res['thresholds'][str(base_threshold)]['overall'], indent=2))
    else:
        print(f"NOT FOUND: {args.formal_path}")
        
    os.makedirs('experiments/v5_modernbert/results', exist_ok=True)
    with open('experiments/v5_modernbert/results/v5_evaluation_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    print("\n=== THRESHOLD SWEEP ===")
    print("Metrics across thresholds (0.4-0.8) saved to experiments/v5_modernbert/results/v5_evaluation_results.json")
    print("\n=== INFERENCE PERFORMANCE ===")
    if 'RAID' in results:
        print(f"RAID Performance: {results['RAID']['performance']['samples_per_sec']:.2f} samples/sec")

if __name__ == "__main__":
    evaluate()
