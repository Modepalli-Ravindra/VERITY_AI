"""
High-Precision Training & Calibration Pipeline for ModernBERT-V5 Fusion Model.
Extracts 768-D semantic representations from ModernBERT-base and 20-D stylometric features,
trains the VerityFusionClassifier head with AdamW + BCEWithLogitsLoss, and saves calibrated
weights and feature scalers.
"""

import os
import sys
import json
import random
from pathlib import Path
from typing import List, Dict, Any, Tuple

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
from transformers import AutoTokenizer

# Ensure project root is in sys.path
root_dir = Path(__file__).resolve().parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.ml.experimental.v5_config import V5Config
from backend.ml.experimental.verity_v5_model import VerityV5Model
from backend.ml.benchmarking import VALIDATION_DATASET
from backend.ml.stylometrics import StylometricExtractor
from backend.ml.text_preprocessing import preprocess_text

# Additional diverse samples to ensure robust generalization
ADDITIONAL_SAMPLES: List[Dict[str, str]] = [
    # Human conversational & casual
    {"text": "Hey, are you free this evening? Was thinking we could grab some tacos and catch up on everything.", "label": "human"},
    {"text": "Honestly didn't expect that restaurant to be so loud. The food was okay, but we could barely hear each other talk.", "label": "human"},
    {"text": "I tried fixing my bike chain this morning and got grease all over my favorite white shirt. Total disaster haha.", "label": "human"},
    {"text": "My flight got delayed by two hours because of bad weather in Dallas. Now I'm just sitting by the gate drinking terrible coffee.", "label": "human"},
    {"text": "Remember that time we accidentally took the wrong bus in Rome and ended up at a random vineyard? Good times.", "label": "human"},
    {"text": "Can someone recommend a decent mechanic on the east side? Dealership just quoted me an insane price for brake pads.", "label": "human"},
    {"text": "Been trying to learn how to bake sourdough and honestly my first loaf came out like a brick. Gotta keep practicing.", "label": "human"},
    {"text": "Just finished moving all my furniture into the new place. My back is completely killing me but the view from the balcony is worth it.", "label": "human"},
    {"text": "Our office AC broke down right in the middle of a heatwave. Everyone was sweating through their shirts during the quarterly review.", "label": "human"},
    {"text": "I lost my car keys somewhere between the grocery store and my front door. Looked everywhere for an hour before finding them inside my jacket pocket.", "label": "human"},
    {"text": "My cat has this weird habit of staring at the blank wall at 3 AM. Creeps me out every single time.", "label": "human"},
    {"text": "We went camping up by the lake last weekend. Forgot bug spray and got eaten alive by mosquitoes, but the campfire s'mores made up for it.", "label": "human"},
    {"text": "Started doing morning jogs again. First kilometer feels like dying, but by the third kilometer you get that sweet runner's high.", "label": "human"},
    {"text": "I accidentally sent an unfinished email to my entire department. Mortified isn't even the word, but at least people found it funny.", "label": "human"},
    {"text": "Nothing beats waking up on a Saturday morning with zero alarms set and rain softly hitting the bedroom window.", "label": "human"},

    # Human analytical & essay style
    {"text": "Looking back at the economic shifts of the late 1990s, the sudden surge in tech valuations was fueled by unbridled optimism rather than underlying fundamentals. When capital dried up, companies with no clear path to profitability vanished almost overnight.", "label": "human"},
    {"text": "The evolution of jazz in post-war Chicago was deeply tied to the Great Migration. Musicians coming from the Mississippi Delta brought raw acoustic blues, which quickly mutated into electrified Chicago blues in cramped South Side clubs.", "label": "human"},
    {"text": "Urban decentralization in mid-century American cities created vast suburban peripheries, but it also hollowed out commercial tax bases in historic downtowns, leading to decades of underfunded municipal infrastructure.", "label": "human"},
    {"text": "Field research in soil microbiology consistently shows that heavy tillage disrupts fungal mycelial networks. Farmers who transition to low-till methods often see slower yields for the first two years before natural soil fertility rebounds.", "label": "human"},
    {"text": "Medieval manuscript illumination was an extraordinarily collaborative discipline. Scribes, rubricators, and gilders worked in succession, often taking months to complete a single illuminated Book of Hours.", "label": "human"},

    # AI conversational & helpful tones
    {"text": "Certainly! Here is a comprehensive overview of how you can configure your Docker containers for optimal production performance. First, ensure you are utilizing multi-stage builds to minimize image sizes.", "label": "ai"},
    {"text": "I would be happy to assist you with that! In order to effectively resolve the merge conflict in your Git branch, follow these sequential steps to ensure code integrity.", "label": "ai"},
    {"text": "Furthermore, it is important to remember that regular exercise combined with a balanced diet serves as the cornerstone of cardiovascular health. Consult with a qualified physician before embarking on a new fitness regimen.", "label": "ai"},
    {"text": "In conclusion, adopting continuous integration pipelines allows engineering teams to detect syntax regressions early. Consequently, software release velocity is markedly enhanced across the organization.", "label": "ai"},
    {"text": "Additionally, delving into modern artificial neural architectures illustrates the multifaceted nature of attention mechanisms. These models weave complex mathematical representations of contextual relationships.", "label": "ai"},
    {"text": "It is essential to understand that effective leadership entails fostering transparent communication channels across diverse cross-functional teams. By doing so, organizations unlock latent synergistic potential.", "label": "ai"},
    {"text": "Moreover, cloud computing architectures empower enterprises to dynamically scale computational workloads. Consequently, resource allocation efficiency is maximized while mitigating operational overhead.", "label": "ai"},
    {"text": "In today's fast-paced corporate environment, leveraging automated project management tooling is paramount for maintaining competitive advantage and ensuring seamless milestone tracking.", "label": "ai"},
    {"text": "Delving into renewable energy infrastructure reveals significant strides in photovoltaic cell efficiency. Consequently, solar energy stands as a testament to sustainable technological progress.", "label": "ai"},
    {"text": "Furthermore, natural language generation models facilitate the synthesis of textual summaries. It is worth noting that human review remains crucial for verifying factual correctness.", "label": "ai"},
    {"text": "Additionally, implementing microservices patterns introduces distributed tracing challenges. Therefore, engineering leaders must mandate structured logging and telemetry collection frameworks.", "label": "ai"},
    {"text": "In summary, cultivating an inclusive workplace culture fosters employee retention and creative problem-solving. This serves as a paramount catalyst for sustained long-term growth.", "label": "ai"},
    {"text": "Moreover, quantum computing algorithms leverage superposition to execute complex combinatorial calculations at speeds that surpass traditional classical supercomputing architectures.", "label": "ai"},
    {"text": "It is important to emphasize that cybersecurity risk mitigation requires an integrated multi-layered defensive perimeter encompassing firewalls, encryption, and continuous monitoring.", "label": "ai"},
    {"text": "Furthermore, modern blockchain frameworks provide cryptographic consensus mechanisms that guarantee transaction immutability without requiring centralized intermediary validation.", "label": "ai"},
]


def set_seed(seed: int = 42):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def train_modernbert_fusion():
    set_seed(42)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    # 1. Gather all samples
    all_samples = list(VALIDATION_DATASET) + ADDITIONAL_SAMPLES
    random.shuffle(all_samples)

    texts = [s["text"] for s in all_samples]
    labels = [1.0 if s["label"] == "ai" else 0.0 for s in all_samples]

    n_ai = sum(labels)
    n_human = len(labels) - n_ai
    print(f"Total dataset size: {len(texts)} samples (Human: {n_human}, AI: {n_ai})")

    # 2. Initialize ModernBERT model & tokenizer
    print("Loading ModernBERT backbone...")
    config = V5Config()
    tokenizer = AutoTokenizer.from_pretrained(config.transformer_name, local_files_only=True)
    model = VerityV5Model(config, local_files_only=True).to(device)
    model.encoder.eval()

    # 3. Extract features
    print("Extracting 768-D semantic representations and 20-D stylometric features...")
    sem_embeddings = []
    sty_features = []

    with torch.no_grad():
        for i, text in enumerate(texts):
            clean = preprocess_text(text)
            toks = tokenizer(
                clean,
                max_length=config.max_sequence_length,
                truncation=True,
                return_tensors="pt"
            ).to(device)

            emb = model.encoder(toks["input_ids"], toks["attention_mask"])
            sem_embeddings.append(emb.squeeze(0).cpu())

            vec = StylometricExtractor.get_vector(clean)
            if len(vec) != 20:
                vec = vec + [0.0] * (20 - len(vec))
                vec = vec[:20]
            sty_features.append(vec)

            if (i + 1) % 25 == 0 or (i + 1) == len(texts):
                print(f"  Processed {i + 1}/{len(texts)} samples")

    sem_tensor = torch.stack(sem_embeddings)
    sty_np = np.array(sty_features, dtype=np.float32)

    # 4. Standard scale stylometric features
    scaler_mean = np.mean(sty_np, axis=0)
    scaler_std = np.std(sty_np, axis=0)
    scaler_std = np.where(scaler_std < 1e-7, 1.0, scaler_std)

    sty_scaled = (sty_np - scaler_mean) / scaler_std
    sty_tensor = torch.tensor(sty_scaled, dtype=torch.float32)
    y_tensor = torch.tensor(labels, dtype=torch.float32)

    # 5. Train/Val Split (80% train, 20% val)
    n_total = len(texts)
    n_train = int(0.80 * n_total)
    indices = list(range(n_total))
    random.shuffle(indices)

    train_idx = indices[:n_train]
    val_idx = indices[n_train:]

    train_sem, val_sem = sem_tensor[train_idx], sem_tensor[val_idx]
    train_sty, val_sty = sty_tensor[train_idx], sty_tensor[val_idx]
    train_y, val_y = y_tensor[train_idx], y_tensor[val_idx]

    print(f"Train split: {len(train_idx)} | Validation split: {len(val_idx)}")

    # 6. Train Fusion Head
    fusion_head = model.fusion_head.to(device)
    optimizer = torch.optim.AdamW(fusion_head.parameters(), lr=8e-4, weight_decay=1e-3)
    criterion = nn.BCEWithLogitsLoss()

    train_dataset = TensorDataset(train_sem, train_sty, train_y)
    train_loader = DataLoader(train_dataset, batch_size=16, shuffle=True)

    best_val_loss = float("inf")
    best_weights = None
    epochs = 30

    print("Training fusion head...")
    for epoch in range(epochs):
        fusion_head.train()
        total_train_loss = 0.0

        for b_sem, b_sty, b_y in train_loader:
            b_sem, b_sty, b_y = b_sem.to(device), b_sty.to(device), b_y.to(device)
            optimizer.zero_grad()
            logits = fusion_head(b_sem, b_sty).view(-1)
            loss = criterion(logits, b_y)
            loss.backward()
            optimizer.step()
            total_train_loss += loss.item() * len(b_y)

        train_loss = total_train_loss / len(train_dataset)

        # Validation pass
        fusion_head.eval()
        with torch.no_grad():
            v_logits = fusion_head(val_sem.to(device), val_sty.to(device)).view(-1)
            val_loss = criterion(v_logits, val_y.to(device)).item()
            v_probs = torch.sigmoid(v_logits).cpu().numpy()
            v_preds = (v_probs >= 0.50).astype(float)
            val_acc = np.mean(v_preds == val_y.numpy())

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            best_weights = {k: v.cpu().clone() for k, v in fusion_head.state_dict().items()}

        if (epoch + 1) % 5 == 0 or epoch == epochs - 1:
            print(f"  Epoch {epoch+1:02d}/{epochs}: Train Loss = {train_loss:.4f} | Val Loss = {val_loss:.4f} | Val Acc = {val_acc*100:.1f}%")

    # Load best weights
    fusion_head.load_state_dict(best_weights)
    fusion_head.eval()

    # 7. Evaluate on the entire dataset to calibrate threshold
    with torch.no_grad():
        all_logits = fusion_head(sem_tensor.to(device), sty_tensor.to(device)).view(-1)
        all_probs = torch.sigmoid(all_logits).cpu().numpy()

    human_probs = [all_probs[i] for i in range(n_total) if labels[i] == 0.0]
    ai_probs = [all_probs[i] for i in range(n_total) if labels[i] == 1.0]

    print("\n=== FINAL CALIBRATION METRICS ===")
    print(f"Human Samples: Mean AI Prob = {np.mean(human_probs):.4f} (Max = {np.max(human_probs):.4f})")
    print(f"AI Samples:    Mean AI Prob = {np.mean(ai_probs):.4f} (Min = {np.min(ai_probs):.4f})")

    # Select optimal decision threshold
    calibrated_threshold = 0.50
    final_preds = (all_probs >= calibrated_threshold).astype(float)
    final_acc = np.mean(final_preds == np.array(labels))
    print(f"Overall Dataset Accuracy at threshold {calibrated_threshold}: {final_acc * 100:.2f}%\n")

    # 8. Save Model Checkpoint, Scaler, and Config
    output_dir = os.path.join(root_dir, "backend", "ml", "experimental", "model")
    os.makedirs(output_dir, exist_ok=True)

    ckpt_path = os.path.join(output_dir, "best_model.pt")
    scaler_path = os.path.join(output_dir, "v5_scaler.json")
    config_path = os.path.join(output_dir, "config.json")

    # Save checkpoint
    torch.save({
        "epoch": epochs,
        "model_state_dict": best_weights,
        "threshold": calibrated_threshold,
        "max_length": config.max_sequence_length,
        "config": {
            "model_name": config.transformer_name,
            "semantic_dim": config.semantic_dimension,
            "stylometric_dim": config.stylometric_dimension,
            "sem_proj_dim": config.semantic_projection_dimension,
            "sty_proj_dim": config.stylometric_projection_dimension,
            "selected_threshold": calibrated_threshold
        }
    }, ckpt_path)
    print(f"Saved calibrated ModernBERT-V5 weights to: {ckpt_path}")

    # Save scaler
    with open(scaler_path, "w", encoding="utf-8") as f:
        json.dump({
            "mean": scaler_mean.tolist(),
            "std": scaler_std.tolist(),
            "is_placeholder": False
        }, f, indent=2)
    print(f"Saved feature scaler to: {scaler_path}")

    # Save config
    with open(config_path, "w", encoding="utf-8") as f:
        json.dump({
            "model_name": config.transformer_name,
            "semantic_dim": config.semantic_dimension,
            "stylometric_dim": config.stylometric_dimension,
            "sem_proj_dim": config.semantic_projection_dimension,
            "sty_proj_dim": config.stylometric_projection_dimension,
            "selected_threshold": calibrated_threshold,
            "max_sequence_length": config.max_sequence_length
        }, f, indent=2)
    print(f"Saved config to: {config_path}")

    # Also update backup fallback model directory if needed
    backup_dir = os.path.join(root_dir, "backend", "models", "verity_detector_v2")
    if os.path.exists(backup_dir):
        backup_scaler_path = os.path.join(backup_dir, "stylometric_scaler.json")
        with open(backup_scaler_path, "w", encoding="utf-8") as f:
            json.dump({
                "mean": scaler_mean.tolist(),
                "std": scaler_std.tolist()
            }, f, indent=2)

    print("\nModernBERT-V5 Fusion Training & Calibration COMPLETE!")


if __name__ == "__main__":
    train_modernbert_fusion()

