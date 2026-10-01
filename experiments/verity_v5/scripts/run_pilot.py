import os
import sys
import json
import csv
import math
import random
import time
import argparse
import numpy as np
from pathlib import Path

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from transformers import AutoTokenizer, AutoModel, get_linear_schedule_with_warmup

root_dir = Path(__file__).resolve().parent.parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.ml.text_preprocessing import preprocess_text
from backend.ml.stylometrics import StylometricExtractor
from backend.ml.verity_model import VerityFusionClassifier
from experiments.verity_v5.scripts.nlp_features import NLPFeatureExtractor
from experiments.verity_v5.scripts.v5_model import VerityV5FusionClassifier, VerityV5FullModel

def set_seed(seed=42):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)

class SimpleScaler:
    def __init__(self):
        self.mean = []
        self.std = []
    def fit(self, vectors):
        arr = np.array(vectors, dtype=np.float32)
        self.mean = np.mean(arr, axis=0).tolist()
        self.std = np.std(arr, axis=0).tolist()
    def transform(self, vector):
        if len(self.mean) == 0: return vector
        scaled = []
        for v, m, s in zip(vector, self.mean, self.std):
            denom = s if s > 1e-7 else 1.0
            scaled.append((v - m) / denom)
        return scaled

class PilotDataset(Dataset):
    def __init__(self, texts, labels, sty_scaler, nlp_scaler, tokenizer, nlp_indices=None):
        self.texts = texts
        self.labels = labels
        self.sty_scaler = sty_scaler
        self.nlp_scaler = nlp_scaler
        self.tokenizer = tokenizer
        self.nlp_indices = nlp_indices
        
        # Precompute
        self.raw_sty = [StylometricExtractor.get_vector(t) for t in texts]
        self.raw_nlp = [NLPFeatureExtractor.get_vector(t) for t in texts]
        
        if self.sty_scaler:
            self.sty = [self.sty_scaler.transform(v) for v in self.raw_sty]
        else:
            self.sty = self.raw_sty
            
        if self.nlp_scaler:
            self.nlp = [self.nlp_scaler.transform(v) for v in self.raw_nlp]
        else:
            self.nlp = self.raw_nlp

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        text = self.texts[idx]
        label = self.labels[idx]
        sty_vec = torch.tensor(self.sty[idx], dtype=torch.float32)
        
        nlp_full = self.nlp[idx]
        if self.nlp_indices is not None:
            nlp_vec = torch.tensor([nlp_full[i] for i in self.nlp_indices], dtype=torch.float32)
        else:
            nlp_vec = torch.tensor(nlp_full, dtype=torch.float32)
            
        enc = self.tokenizer(text, max_length=128, padding="max_length", truncation=True, return_tensors="pt")
        return {
            "input_ids": enc["input_ids"].squeeze(0),
            "attention_mask": enc["attention_mask"].squeeze(0),
            "stylometric": sty_vec,
            "nlp": nlp_vec,
            "label": torch.tensor(label, dtype=torch.float32)
        }

def evaluate(model, dataloader, device, baseline=False):
    model.eval()
    preds_list = []
    targets_list = []
    with torch.no_grad():
        for batch in dataloader:
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            sty = batch["stylometric"].to(device)
            nlp = batch["nlp"].to(device)
            lbls = batch["label"].to(device)
            
            if baseline:
                logits = model(input_ids, attention_mask, sty)
            else:
                logits = model(input_ids, attention_mask, sty, nlp)
            
            probs = torch.sigmoid(logits)
            preds = (probs >= 0.50).long().cpu().numpy()
            
            preds_list.extend(preds)
            targets_list.extend(lbls.cpu().numpy())
            
    preds_list = np.array(preds_list)
    targets_list = np.array(targets_list)
    
    tp = np.sum((preds_list == 1) & (targets_list == 1))
    fp = np.sum((preds_list == 1) & (targets_list == 0))
    fn = np.sum((preds_list == 0) & (targets_list == 1))
    tn = np.sum((preds_list == 0) & (targets_list == 0))
    
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall_ai = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    recall_human = tn / (tn + fp) if (tn + fp) > 0 else 0.0
    fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0
    f1 = 2 * precision * recall_ai / (precision + recall_ai) if (precision + recall_ai) > 0 else 0.0
    acc = (tp + tn) / (tp + tn + fp + fn) if (tp + tn + fp + fn) > 0 else 0.0
    
    return {
        "human_fpr": fpr,
        "human_recall": recall_human,
        "ai_recall": recall_ai,
        "f1": f1,
        "accuracy": acc
    }

def train_and_eval(name, train_texts, train_labels, test_texts, test_labels, sty_scaler, nlp_scaler, tokenizer, device, nlp_indices=None, is_baseline=False):
    print(f"\n--- Running Experiment: {name} ---")
    
    train_dataset = PilotDataset(train_texts, train_labels, sty_scaler, nlp_scaler, tokenizer, nlp_indices)
    test_dataset = PilotDataset(test_texts, test_labels, sty_scaler, nlp_scaler, tokenizer, nlp_indices)
    
    train_loader = DataLoader(train_dataset, batch_size=16, shuffle=True)
    test_loader = DataLoader(test_dataset, batch_size=32, shuffle=False)
    
    if is_baseline:
        from backend.ml.train_v2_stage1 import VerityFullEndToEndModel
        fusion_head = VerityFusionClassifier(semantic_dim=768, stylometric_dim=20, sem_proj_dim=256, sty_proj_dim=64)
        model = VerityFullEndToEndModel(transformer_name="distilroberta-base", fusion_classifier=fusion_head).to(device)
    else:
        nlp_dim = len(nlp_indices) if nlp_indices is not None else 12
        nlp_proj_dim = min(64, max(16, nlp_dim * 4))
        fusion_head = VerityV5FusionClassifier(nlp_dim=nlp_dim, nlp_proj_dim=nlp_proj_dim)
        model = VerityV5FullModel(transformer_name="distilroberta-base", fusion_classifier=fusion_head).to(device)
        
    optimizer = torch.optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=5e-5)
    criterion = nn.BCEWithLogitsLoss()
    
    epochs = 3
    for epoch in range(epochs):
        model.train()
        for batch in train_loader:
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            sty = batch["stylometric"].to(device)
            nlp = batch["nlp"].to(device)
            lbls = batch["label"].to(device)
            
            optimizer.zero_grad()
            if is_baseline:
                logits = model(input_ids, attention_mask, sty)
            else:
                logits = model(input_ids, attention_mask, sty, nlp)
            loss = criterion(logits, lbls)
            loss.backward()
            optimizer.step()
            
    res = evaluate(model, test_loader, device, baseline=is_baseline)
    print(f"Results for {name}:")
    for k, v in res.items():
        print(f"  {k}: {v:.4f}")
    return res

def main():
    set_seed(42)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")
    
    # Load limited data for pilot
    train_path = os.path.join(root_dir, "dataset/verity_v2_stage1_train_20k.csv")
    texts, labels = [], []
    with open(train_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            texts.append(preprocess_text(str(row.get("text", ""))))
            labels.append(int(row.get("label", 0)))
            if len(texts) >= 4000:
                break
                
    train_texts, train_labels = texts[:3000], labels[:3000]
    test_texts, test_labels = texts[3000:4000], labels[3000:4000]
    
    print(f"Pilot Data: Train {len(train_texts)}, Test {len(test_texts)}")
    
    sty_scaler = SimpleScaler()
    sty_scaler.fit([StylometricExtractor.get_vector(t) for t in train_texts])
    
    nlp_scaler = SimpleScaler()
    nlp_scaler.fit([NLPFeatureExtractor.get_vector(t) for t in train_texts])
    
    tokenizer = AutoTokenizer.from_pretrained("distilroberta-base")
    
    results = {}
    
    # A. V4-B baseline
    results["A_V4B_Baseline"] = train_and_eval("A_V4B_Baseline", train_texts, train_labels, test_texts, test_labels, sty_scaler, nlp_scaler, tokenizer, device, is_baseline=True)
    
    # B. V4-B + POS
    results["B_V4B_POS"] = train_and_eval("B_V4B_POS", train_texts, train_labels, test_texts, test_labels, sty_scaler, nlp_scaler, tokenizer, device, nlp_indices=[0,1,2,3])
    
    # C. V4-B + N-gram
    results["C_V4B_Ngram"] = train_and_eval("C_V4B_Ngram", train_texts, train_labels, test_texts, test_labels, sty_scaler, nlp_scaler, tokenizer, device, nlp_indices=[4,5])
    
    # D. V4-B + TF-IDF (Vocab)
    results["D_V4B_Vocab"] = train_and_eval("D_V4B_Vocab", train_texts, train_labels, test_texts, test_labels, sty_scaler, nlp_scaler, tokenizer, device, nlp_indices=[6])
    
    # E. V4-B + Readability
    results["E_V4B_Readability"] = train_and_eval("E_V4B_Readability", train_texts, train_labels, test_texts, test_labels, sty_scaler, nlp_scaler, tokenizer, device, nlp_indices=[7,8,9,10,11])
    
    # F. Full V5
    results["F_Full_V5"] = train_and_eval("F_Full_V5", train_texts, train_labels, test_texts, test_labels, sty_scaler, nlp_scaler, tokenizer, device, nlp_indices=list(range(12)))

    report_path = os.path.join(root_dir, "experiments/verity_v5/reports/V5_NLP_EXPERIMENT_REPORT.md")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("# V5 NLP EXPERIMENT REPORT\n\n")
        f.write("## Objective\n")
        f.write("Evaluate whether adding NLP linguistic features (POS, N-gram, Readability) to the V4-B feature-fusion classifier reduces human false-positive rates.\n\n")
        f.write("## Ablation Results\n\n")
        f.write("| Experiment | Human FPR | Human Recall | AI Recall | F1 | Accuracy |\n")
        f.write("|---|---|---|---|---|---|\n")
        for k, v in results.items():
            f.write(f"| {k} | {v['human_fpr']:.4f} | {v['human_recall']:.4f} | {v['ai_recall']:.4f} | {v['f1']:.4f} | {v['accuracy']:.4f} |\n")
            
        f.write("\n## Conclusion\n")
        v4b = results["A_V4B_Baseline"]
        v5 = results["F_Full_V5"]
        f.write("### V4-B baseline:\n")
        f.write(f"Human FPR = {v4b['human_fpr']:.4f}\n")
        f.write(f"Human Recall = {v4b['human_recall']:.4f}\n")
        f.write(f"AI Recall = {v4b['ai_recall']:.4f}\n")
        f.write(f"F1 = {v4b['f1']:.4f}\n\n")
        
        f.write("### V5:\n")
        f.write(f"Human FPR = {v5['human_fpr']:.4f}\n")
        f.write(f"Human Recall = {v5['human_recall']:.4f}\n")
        f.write(f"AI Recall = {v5['ai_recall']:.4f}\n")
        f.write(f"F1 = {v5['f1']:.4f}\n\n")
        
        if v5["human_fpr"] < v4b["human_fpr"]:
            f.write("V5 improves human-text classification (reduced FPR).\nRecommendation: Deploy V5 (further large-scale training needed).\n")
        else:
            f.write("V5 does not improve human-text classification.\nRecommendation: Keep V4-B.\n")
            
if __name__ == "__main__":
    main()
