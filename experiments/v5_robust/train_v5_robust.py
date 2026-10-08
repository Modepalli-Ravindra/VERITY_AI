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
import time
from tqdm import tqdm
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

class PrecomputedVerityDataset(Dataset):
    def __init__(self, input_ids, attention_masks, stylometric_xs, labels):
        self.input_ids = input_ids
        self.attention_masks = attention_masks
        self.stylometric_xs = stylometric_xs
        self.labels = labels
        
    def __len__(self):
        return len(self.labels)
        
    def __getitem__(self, idx):
        return {
            'input_ids': self.input_ids[idx],
            'attention_mask': self.attention_masks[idx],
            'stylometric_x': self.stylometric_xs[idx],
            'label': self.labels[idx]
        }

def get_cache_hash(texts, max_length, transformer_name):
    h = hashlib.md5()
    h.update(str(len(texts)).encode())
    if len(texts) > 0:
        h.update(texts[0].encode())
        h.update(texts[-1].encode())
    h.update(str(max_length).encode())
    h.update(transformer_name.encode())
    return h.hexdigest()

def preprocess_and_cache(texts, labels, tokenizer, max_length, cache_path):
    if os.path.exists(cache_path):
        print(f"Loading cache from {cache_path}...")
        start_time = time.time()
        cache = torch.load(cache_path)
        print(f"Cache loaded in {time.time() - start_time:.2f} seconds.")
        return cache['input_ids'], cache['attention_masks'], cache['stylometric_xs'], cache['labels']
        
    start_time = time.time()
    
    input_ids_list = []
    attention_masks_list = []
    stylometric_xs_list = []
    labels_list = []
    
    for i, (text, label) in enumerate(zip(texts, labels)):
        if (i + 1) % 5000 == 0:
            print(f"Tokenization & stylometric feature progress: {i+1}/{len(texts)}")
            
        tokens = tokenizer(
            str(text),
            max_length=max_length,
            padding='max_length',
            truncation=True,
            return_tensors='pt'
        )
        
        try:
            stylo = StylometricExtractor.get_vector(str(text))
            if len(stylo) != 20:
                stylo = [0.0] * 20
        except:
            stylo = [0.0] * 20
            
        input_ids_list.append(tokens['input_ids'].squeeze(0))
        attention_masks_list.append(tokens['attention_mask'].squeeze(0))
        stylometric_xs_list.append(torch.tensor(stylo, dtype=torch.float32))
        labels_list.append(torch.tensor(float(label), dtype=torch.float32))
        
    input_ids = torch.stack(input_ids_list)
    attention_masks = torch.stack(attention_masks_list)
    stylometric_xs = torch.stack(stylometric_xs_list)
    labels_tensor = torch.stack(labels_list)
    
    print(f"Preprocessing completed in {time.time() - start_time:.2f} seconds.")
    print("Saving cache...")
    os.makedirs(os.path.dirname(cache_path), exist_ok=True)
    torch.save({
        'input_ids': input_ids,
        'attention_masks': attention_masks,
        'stylometric_xs': stylometric_xs,
        'labels': labels_tensor
    }, cache_path)
    print("Cache saved.")
    
    return input_ids, attention_masks, stylometric_xs, labels_tensor

def get_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--train_data', type=str, default='dataset/v5_robust/train.csv')
    parser.add_argument('--val_data', type=str, default='dataset/v5_robust/val.csv')
    parser.add_argument('--epochs', type=int, default=1)
    parser.add_argument('--batch_size', type=int, default=16)
    parser.add_argument('--gradient_accumulation_steps', type=int, default=4)
    parser.add_argument('--learning_rate', type=float, default=1e-4)
    parser.add_argument('--transformer_learning_rate', type=float, default=2e-5)
    parser.add_argument('--max_length', type=int, default=1024)
    parser.add_argument('--freeze_mode', type=str, default='last_n', choices=['frozen', 'last_n', 'full'])
    parser.add_argument('--unfreeze_layers', type=int, default=2)
    parser.add_argument('--seed', type=int, default=42)
    parser.add_argument('--output_dir', type=str, default='experiments/v5_robust/checkpoints')
    parser.add_argument('--num_workers', type=int, default=0, help="Number of workers for DataLoader")
    parser.add_argument('--smoke_test', action='store_true', help="Run in pipeline smoke test mode")
    parser.add_argument('--debug_smoke', action='store_true', help="Run 1-2 batch diagnostic test with timings")
    return parser.parse_args()

def evaluate_threshold(val_targets, probs, threshold):
    preds = (probs >= threshold).astype(int)
    
    acc = accuracy_score(val_targets, preds)
    prec = precision_score(val_targets, preds, zero_division=0)
    
    human_mask = (val_targets == 0)
    ai_mask = (val_targets == 1)
    
    human_recall = np.sum((preds == 0) & human_mask) / np.sum(human_mask) if np.sum(human_mask) > 0 else 0
    ai_recall = np.sum((preds == 1) & ai_mask) / np.sum(ai_mask) if np.sum(ai_mask) > 0 else 0
    
    f1 = f1_score(val_targets, preds, zero_division=0)
    mcc = matthews_corrcoef(val_targets, preds)
    
    tn, fp, fn, tp = confusion_matrix(val_targets, preds).ravel()
    human_fpr = fp / (fp + tn) if (fp + tn) > 0 else 0
    
    return {
        'threshold': threshold,
        'accuracy': acc,
        'precision': prec,
        'ai_recall': ai_recall,
        'human_recall': human_recall,
        'f1': f1,
        'mcc': mcc,
        'human_fpr': human_fpr
    }

def main():
    args = get_args()
    set_seed(args.seed)
    os.makedirs(args.output_dir, exist_ok=True)
    os.makedirs('experiments/v5_robust/cache', exist_ok=True)
    
    if args.smoke_test:
        print("PIPELINE SMOKE TEST — NOT A VALID GENERALIZATION EVALUATION")
        
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Device: {device}")
    
    config = V5Config()
    config.max_sequence_length = args.max_length
    
    tokenizer = AutoTokenizer.from_pretrained(config.transformer_name)

    train_df = pd.read_csv(args.train_data)
    val_df = pd.read_csv(args.val_data)
    
    if args.smoke_test:
        train_df = train_df.head(100)
        val_df = val_df.head(100)
    
    tr_t = train_df['text'].tolist()
    tr_l = train_df['label'].tolist()
    val_t = val_df['text'].tolist()
    val_l = val_df['label'].tolist()
    
    print(f"Train Human: {tr_l.count(0)} | Train AI: {tr_l.count(1)}")
    print(f"Val Human: {val_l.count(0)} | Val AI: {val_l.count(1)}")
    
    cache_dir = "experiments/v5_robust/cache"
    train_cache_hash = get_cache_hash(tr_t, args.max_length, config.transformer_name)
    val_cache_hash = get_cache_hash(val_t, args.max_length, config.transformer_name)
    
    train_cache_path = os.path.join(cache_dir, f"train_{train_cache_hash}.pt")
    val_cache_path = os.path.join(cache_dir, f"val_{val_cache_hash}.pt")
    
    print("Preprocessing train set...")
    tr_input_ids, tr_attn_masks, tr_stylo, tr_labels = preprocess_and_cache(tr_t, tr_l, tokenizer, args.max_length, train_cache_path)
    
    print("Preprocessing validation set...")
    val_input_ids, val_attn_masks, val_stylo, val_labels = preprocess_and_cache(val_t, val_l, tokenizer, args.max_length, val_cache_path)
    
    train_ds = PrecomputedVerityDataset(tr_input_ids, tr_attn_masks, tr_stylo, tr_labels)
    val_ds = PrecomputedVerityDataset(val_input_ids, val_attn_masks, val_stylo, val_labels)
    
    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True, drop_last=True, pin_memory=True if device.type == 'cuda' else False, num_workers=args.num_workers)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, drop_last=False, pin_memory=True if device.type == 'cuda' else False, num_workers=args.num_workers)
    
    print(f"Effective training batches per epoch (drop_last=True): {len(train_loader)}")
    
    print("Starting GPU training...")

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
    
    best_overall_threshold = 0.50
    
    for epoch in range(args.epochs):
        epoch_start = time.time()
        model.train()
        total_loss = 0
        
        train_iterator = tqdm(train_loader, desc=f"Epoch {epoch+1}/{args.epochs}") if not args.debug_smoke else train_loader
        
        for step, batch in enumerate(train_iterator):
            input_ids = batch['input_ids'].to(device, non_blocking=True)
            attention_mask = batch['attention_mask'].to(device, non_blocking=True)
            stylo = batch['stylometric_x'].to(device, non_blocking=True)
            labels = batch['label'].to(device, non_blocking=True)
            
            try:
                with torch.amp.autocast('cuda', enabled=(device.type == 'cuda')):
                    logits = model(input_ids, attention_mask, stylo)
            except AttributeError:
                with torch.cuda.amp.autocast(enabled=(device.type == 'cuda')):
                    logits = model(input_ids, attention_mask, stylo)
            
            with torch.amp.autocast('cuda', enabled=(device.type == 'cuda')) if hasattr(torch, 'amp') else torch.cuda.amp.autocast(enabled=(device.type == 'cuda')):
                loss = criterion(logits, labels)
                loss = loss / args.gradient_accumulation_steps
                
            scaler.scale(loss).backward()
            
            if (step + 1) % args.gradient_accumulation_steps == 0:
                scaler.step(optimizer)
                scaler.update()
                optimizer.zero_grad()
                
            total_loss += loss.item()
            
            if args.debug_smoke and step >= 1:
                break
                
        print(f"Epoch {epoch+1}/{args.epochs} - Train Loss: {total_loss / len(train_loader):.4f} - Epoch Time: {time.time() - epoch_start:.2f}s")
        
        # VALIDATION EVALUATION
        model.eval()
        val_probs = []
        val_targets = []
        with torch.no_grad():
            for batch in val_loader:
                input_ids = batch['input_ids'].to(device, non_blocking=True)
                attention_mask = batch['attention_mask'].to(device, non_blocking=True)
                stylo = batch['stylometric_x'].to(device, non_blocking=True)
                labels = batch['label'].cpu().numpy()
                
                try:
                    with torch.amp.autocast('cuda', enabled=(device.type == 'cuda')):
                        logits = model(input_ids, attention_mask, stylo)
                except AttributeError:
                    with torch.cuda.amp.autocast(enabled=(device.type == 'cuda')):
                        logits = model(input_ids, attention_mask, stylo)
                        
                probs = torch.sigmoid(logits).cpu().numpy()
                val_probs.extend(probs)
                val_targets.extend(labels)
                
        val_targets = np.array(val_targets)
        val_probs = np.array(val_probs)
        
        try:
            auroc = roc_auc_score(val_targets, val_probs)
        except ValueError:
            auroc = 0.0
            
        print(f"Validation AUROC: {auroc:.4f}")
        
        print("\nThreshold Tuning:")
        best_threshold = 0.50
        best_score = -1
        
        for thresh in np.arange(0.40, 0.81, 0.05):
            res = evaluate_threshold(val_targets, val_probs, thresh)
            print(f"  Thresh {thresh:.2f} | Acc {res['accuracy']:.4f} | AI Recall {res['ai_recall']:.4f} | FPR {res['human_fpr']:.4f} | F1 {res['f1']:.4f} | MCC {res['mcc']:.4f}")
            
            # Selection criteria: favor high AI recall as long as FPR is acceptable (e.g. < 5%)
            # If FPR > 5%, penalize. We use F1 as base but prioritize low FPR and high AI Recall.
            score = res['f1']
            if res['human_fpr'] > 0.05:
                score -= (res['human_fpr'] - 0.05) * 5 # Heavy penalty for FPR > 5%
                
            if score > best_score:
                best_score = score
                best_threshold = thresh
                
        print(f"\nSelected best practical threshold: {best_threshold:.2f}")
        best_overall_threshold = best_threshold
            
    print("Saving checkpoint...")
    ckpt_path = os.path.join(args.output_dir, "best_model.pt")
    config.threshold = float(best_overall_threshold)
    checkpoint_data = {
        'model_state_dict': model.state_dict(),
        'optimizer_state_dict': optimizer.state_dict(),
        'epoch': args.epochs,
        'seed': args.seed,
        'config': config.dict(),
        'freeze_mode': args.freeze_mode,
        'max_length': args.max_length,
        'threshold': config.threshold
    }
    torch.save(checkpoint_data, ckpt_path)
    
if __name__ == "__main__":
    main()
