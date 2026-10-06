import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
import argparse
import pandas as pd
import json
import random
import numpy as np
import hashlib
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, matthews_corrcoef, roc_auc_score, confusion_matrix
from transformers import AutoTokenizer, AutoModel
from backend.ml.experimental.v5_config import V5Config
from backend.ml.experimental.verity_v5_model import VerityV5Model
from backend.ml.stylometrics import StylometricExtractor

def set_seed(seed):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)

def normalize_text_hash(text):
    return hashlib.md5(text.strip().lower().encode('utf-8')).hexdigest()

class VerityDataset(Dataset):
    def __init__(self, texts, labels, tokenizer, max_length):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_length = max_length
        
    def __len__(self):
        return len(self.texts)
        
    def __getitem__(self, idx):
        text = str(self.texts[idx])
        label = float(self.labels[idx])
        
        tokens = self.tokenizer(
            text,
            max_length=self.max_length,
            padding='max_length',
            truncation=True,
            return_tensors='pt'
        )
        
        try:
            stylo = StylometricExtractor.get_vector(text)
            if len(stylo) != 20:
                stylo = [0.0] * 20
        except:
            stylo = [0.0] * 20
            
        return {
            'input_ids': tokens['input_ids'].squeeze(0),
            'attention_mask': tokens['attention_mask'].squeeze(0),
            'stylometric_x': torch.tensor(stylo, dtype=torch.float32),
            'label': torch.tensor(label, dtype=torch.float32)
        }

def parse_hc3_jsonl(file_path):
    human_texts = []
    ai_texts = []
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            if not line.strip(): continue
            try:
                data = json.loads(line)
                if 'human_answers' in data:
                    for ans in data['human_answers']:
                        if ans.strip(): human_texts.append(ans)
                if 'chatgpt_answers' in data:
                    for ans in data['chatgpt_answers']:
                        if ans.strip(): ai_texts.append(ans)
            except:
                pass
    return human_texts, ai_texts

def parse_csv(file_path):
    df = pd.read_csv(file_path)
    if 'label' not in df.columns and 'ai_generated' in df.columns:
        df.rename(columns={'ai_generated': 'label'}, inplace=True)
    df = df.dropna(subset=['text', 'label'])
    human = df[df['label'] == 0]['text'].tolist()
    ai = df[df['label'] == 1]['text'].tolist()
    return human, ai

def load_and_split_data(train_paths, val_paths, seed=42, max_train=None, max_val=None):
    train_h, train_a = [], []
    val_h, val_a = [], []
    
    # Process Train Paths
    for p in train_paths:
        if p.endswith('.jsonl'):
            h, a = parse_hc3_jsonl(p)
            random.Random(seed).shuffle(h)
            random.Random(seed).shuffle(a)
            split_h, split_a = int(len(h)*0.8), int(len(a)*0.8)
            train_h.extend(h[:split_h])
            train_a.extend(a[:split_a])
            val_h.extend(h[split_h:])
            val_a.extend(a[split_a:])
        elif p.endswith('.csv'):
            h, a = parse_csv(p)
            train_h.extend(h)
            train_a.extend(a)
            
    # Process Explicit Val Paths
    if val_paths:
        for p in val_paths:
            if p.endswith('.csv'):
                h, a = parse_csv(p)
                val_h.extend(h)
                val_a.extend(a)
    
    # Deduplicate & Check Leakage
    train_texts = train_h + train_a
    train_labels = [0]*len(train_h) + [1]*len(train_a)
    
    val_texts = val_h + val_a
    val_labels = [0]*len(val_h) + [1]*len(val_a)
    
    train_hashes = {}
    for t in train_texts:
        train_hashes[normalize_text_hash(t)] = t
    
    clean_val_texts = []
    clean_val_labels = []
    overlap_count = 0
    exact_duplicates = 0
    
    for t, l in zip(val_texts, val_labels):
        h = normalize_text_hash(t)
        if h in train_hashes:
            overlap_count += 1
            if train_hashes[h] == t:
                exact_duplicates += 1
        else:
            clean_val_texts.append(t)
            clean_val_labels.append(l)
            
    print(f"Total original validation CSV: {len(val_texts)}")
    print(f"Exact text overlaps detected: {overlap_count}")
    print(f"  Of those, {exact_duplicates} were exact string duplicates after hashing.")
    print(f"  (This indicates the same answer texts were duplicated under different questions in the raw data).")
    print(f"Clean validation: {len(clean_val_texts)}")
    
    if max_train and len(train_texts) > max_train:
        combined = list(zip(train_texts, train_labels))
        random.Random(seed).shuffle(combined)
        combined = combined[:max_train]
        train_texts, train_labels = zip(*combined)
        
    if max_val and len(clean_val_texts) > max_val:
        combined = list(zip(clean_val_texts, clean_val_labels))
        random.Random(seed).shuffle(combined)
        combined = combined[:max_val]
        clean_val_texts, clean_val_labels = zip(*combined)
        
    return list(train_texts), list(train_labels), list(clean_val_texts), list(clean_val_labels)

def get_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--train_data', type=str, nargs='+', default=['dataset/hc3/all.jsonl'])
    parser.add_argument('--val_data', type=str, nargs='*', default=[])
    parser.add_argument('--epochs', type=int, default=1)
    parser.add_argument('--batch_size', type=int, default=16)
    parser.add_argument('--gradient_accumulation_steps', type=int, default=4)
    parser.add_argument('--learning_rate', type=float, default=1e-4)
    parser.add_argument('--transformer_learning_rate', type=float, default=2e-5)
    parser.add_argument('--max_length', type=int, default=1024)
    parser.add_argument('--freeze_mode', type=str, default='last_n', choices=['frozen', 'last_n', 'full'])
    parser.add_argument('--unfreeze_layers', type=int, default=2)
    parser.add_argument('--seed', type=int, default=42)
    parser.add_argument('--output_dir', type=str, default='experiments/v5_modernbert/checkpoints')
    parser.add_argument('--max_train_samples', type=int, default=None)
    parser.add_argument('--max_val_samples', type=int, default=None)
    parser.add_argument('--smoke_test', action='store_true', help="Run in pipeline smoke test mode")
    return parser.parse_args()

def main():
    args = get_args()
    set_seed(args.seed)
    os.makedirs(args.output_dir, exist_ok=True)
    
    if args.smoke_test:
        print("PIPELINE SMOKE TEST — NOT A VALID GENERALIZATION EVALUATION")
        
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Device: {device}")
    
    config = V5Config()
    config.max_sequence_length = args.max_length
    
    tokenizer = AutoTokenizer.from_pretrained(config.transformer_name)

    tr_t, tr_l, val_t, val_l = load_and_split_data(args.train_data, args.val_data, args.seed, args.max_train_samples, args.max_val_samples)
    
    print(f"Train Human: {tr_l.count(0)} | Train AI: {tr_l.count(1)}")
    print(f"Val Human: {val_l.count(0)} | Val AI: {val_l.count(1)}")
    
    train_ds = VerityDataset(tr_t, tr_l, tokenizer, args.max_length)
    val_ds = VerityDataset(val_t, val_l, tokenizer, args.max_length)
    
    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size)

    model = VerityV5Model(config).to(device)
    
    # Class weights
    train_ai_count = max(tr_l.count(1), 1)
    train_h_count = max(tr_l.count(0), 1)
    pos_weight = torch.tensor([train_h_count / train_ai_count]).to(device)
    criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight)
    print(f"BCEWithLogitsLoss Positive Weight: {pos_weight.item():.4f}")
    
    # FREEZE/UNFREEZE LOGIC
    total_encoder_params = sum(p.numel() for p in model.encoder.parameters())
    
    if args.freeze_mode == 'frozen':
        for p in model.encoder.parameters():
            p.requires_grad = False
    elif args.freeze_mode == 'last_n':
        for p in model.encoder.parameters():
            p.requires_grad = False
        try:
            layers = model.encoder.model.layers
            if args.unfreeze_layers > 0:
                for layer in layers[-args.unfreeze_layers:]:
                    for p in layer.parameters():
                        p.requires_grad = True
        except AttributeError:
            print("Warning: Could not locate model.encoder.model.layers. All layers remain frozen.")
    elif args.freeze_mode == 'full':
        for p in model.encoder.parameters():
            p.requires_grad = True
            
    trainable_encoder_params = sum(p.numel() for p in model.encoder.parameters() if p.requires_grad)
    print(f"Total encoder parameters: {total_encoder_params:,}")
    print(f"Trainable encoder parameters: {trainable_encoder_params:,}")
    print(f"Trainable percentage: {trainable_encoder_params/total_encoder_params:.2%}")
    
    if args.freeze_mode == 'last_n':
        try:
            layers = model.encoder.model.layers
            print("Layer Freezing Status:")
            for i, layer in enumerate(layers):
                frozen = not any(p.requires_grad for p in layer.parameters())
                print(f"  Layer {i}: requires_grad={not frozen}")
        except:
            pass
            
    print(f"Fusion head: requires_grad=True")
    
    encoder_params = [p for p in model.encoder.parameters() if p.requires_grad]
        
    optimizer = torch.optim.AdamW([
        {'params': encoder_params, 'lr': args.transformer_learning_rate},
        {'params': model.fusion_head.parameters(), 'lr': args.learning_rate}
    ])
    
    try:
        scaler = torch.amp.GradScaler('cuda', enabled=(device.type == 'cuda'))
    except AttributeError:
        scaler = torch.cuda.amp.GradScaler(enabled=(device.type == 'cuda'))
    
    best_f1 = 0
    for epoch in range(args.epochs):
        model.train()
        total_loss = 0
        for step, batch in enumerate(train_loader):
            input_ids = batch['input_ids'].to(device)
            attention_mask = batch['attention_mask'].to(device)
            stylo = batch['stylometric_x'].to(device)
            labels = batch['label'].to(device)
            
            try:
                with torch.amp.autocast('cuda', enabled=(device.type == 'cuda')):
                    logits = model(input_ids, attention_mask, stylo)
                    loss = criterion(logits, labels)
                    loss = loss / args.gradient_accumulation_steps
            except AttributeError:
                with torch.cuda.amp.autocast(enabled=(device.type == 'cuda')):
                    logits = model(input_ids, attention_mask, stylo)
                    loss = criterion(logits, labels)
                    loss = loss / args.gradient_accumulation_steps
                
            scaler.scale(loss).backward()
            
            if (step + 1) % args.gradient_accumulation_steps == 0:
                scaler.step(optimizer)
                scaler.update()
                optimizer.zero_grad()
                
            total_loss += loss.item()
            
        print(f"Epoch {epoch+1}/{args.epochs} - Train Loss: {total_loss / len(train_loader):.4f}")
        
        # VALIDATION EVALUATION
        model.eval()
        val_preds = []
        val_targets = []
        with torch.no_grad():
            for batch in val_loader:
                input_ids = batch['input_ids'].to(device)
                attention_mask = batch['attention_mask'].to(device)
                stylo = batch['stylometric_x'].to(device)
                labels = batch['label'].cpu().numpy()
                
                try:
                    with torch.amp.autocast('cuda', enabled=(device.type == 'cuda')):
                        logits = model(input_ids, attention_mask, stylo)
                except AttributeError:
                    with torch.cuda.amp.autocast(enabled=(device.type == 'cuda')):
                        logits = model(input_ids, attention_mask, stylo)
                        
                probs = torch.sigmoid(logits).cpu().numpy()
                preds = (probs >= 0.50).astype(int)
                val_preds.extend(preds)
                val_targets.extend(labels)
                
        val_targets = np.array(val_targets)
        val_preds = np.array(val_preds)
        
        if len(val_targets) > 0:
            print(f"Validation samples evaluated: {len(val_targets)} (duplicate-text filtering WAS applied)")
            acc = accuracy_score(val_targets, val_preds)
            prec = precision_score(val_targets, val_preds, zero_division=0)
            
            # AI Recall is class 1, Human Recall is class 0
            human_mask = (val_targets == 0)
            ai_mask = (val_targets == 1)
            
            human_recall = np.sum((val_preds == 0) & human_mask) / np.sum(human_mask) if np.sum(human_mask) > 0 else 0
            ai_recall = np.sum((val_preds == 1) & ai_mask) / np.sum(ai_mask) if np.sum(ai_mask) > 0 else 0
            
            f1 = f1_score(val_targets, val_preds, zero_division=0)
            mcc = matthews_corrcoef(val_targets, val_preds)
            
            try:
                auroc = roc_auc_score(val_targets, val_preds)
            except ValueError:
                auroc = 0.0
                
            cm = confusion_matrix(val_targets, val_preds)
            
            print(f"Validation Metrics:")
            print(f"  Accuracy: {acc:.4f}")
            print(f"  Precision: {prec:.4f}")
            print(f"  AI Recall: {ai_recall:.4f}")
            print(f"  Human Recall: {human_recall:.4f}")
            print(f"  F1 Score: {f1:.4f}")
            print(f"  MCC: {mcc:.4f}")
            print(f"  AUROC: {auroc:.4f}")
            print(f"  Confusion Matrix:\n{cm}")
            
    print("Saving checkpoint...")
    ckpt_path = os.path.join(args.output_dir, "best_model.pt")
    checkpoint_data = {
        'model_state_dict': model.state_dict(),
        'optimizer_state_dict': optimizer.state_dict(),
        'epoch': epoch,
        'seed': args.seed,
        'config': config.dict(),
        'freeze_mode': args.freeze_mode,
        'max_length': args.max_length,
        'threshold': config.threshold
    }
    torch.save(checkpoint_data, ckpt_path)
    
if __name__ == "__main__":
    main()
