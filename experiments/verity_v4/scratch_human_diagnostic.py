import os
import sys
import json
import random
import pandas as pd
from pathlib import Path
from tqdm import tqdm
import torch

root_dir = Path(__file__).resolve().parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.ml.fusion_model import FeatureFusionDetector
from backend.ml.verity_model import VerityFusionClassifier as V2Classifier
from backend.ml.stylometrics import StylometricExtractor

# We need to test V2, V3, V4-A, V4-B.
# We'll use FeatureFusionDetector to evaluate text.
# But we need to hack it to load different models.

def load_v4b_production_model():
    # Verify it is V4-B
    assert FeatureFusionDetector.get_active_model_dir().endswith("v4b\\model") or FeatureFusionDetector.get_active_model_dir().endswith("v4b/model")
    FeatureFusionDetector.load_detector()
    
def hack_load_model(model_dir):
    model_path = os.path.join(model_dir, "best_model.pt")
    config_path = os.path.join(model_dir, "config.json")
    scaler_path = os.path.join(model_dir, "stylometric_scaler.json")
    
    with open(config_path, "r", encoding="utf-8") as f:
        config = json.load(f)
        
    with open(scaler_path, "r", encoding="utf-8") as f:
        scaler_dict = json.load(f)
        
    from backend.ml.fusion_model import SimpleScaler
    scaler = SimpleScaler()
    scaler.load_dict(scaler_dict)
    
    model = V2Classifier()
    model.load_state_dict(torch.load(model_path, map_location="cpu"))
    model.eval()
    
    return model, scaler, config

def evaluate_with(text, model, scaler, config):
    try:
        stylometrics = StylometricExtractor.extract_features(text)
        from backend.ml.transformer_model import TransformerModelManager
        TransformerModelManager.load_model()
        sem = TransformerModelManager.get_embedding(text)
        
        sem_tensor = torch.tensor(sem, dtype=torch.float32).unsqueeze(0)
        
        scaled_stylo = scaler.transform(stylometrics)
        stylo_tensor = torch.tensor(scaled_stylo, dtype=torch.float32).unsqueeze(0)
        
        with torch.no_grad():
            outputs = model(sem_tensor, stylo_tensor)
            ai_prob = torch.sigmoid(outputs).item()
            
        threshold = float(config.get("selected_threshold", 0.50))
        human_prob = 1.0 - ai_prob
        is_ai = ai_prob >= threshold
        
        return {
            "ai_probability": ai_prob,
            "human_probability": human_prob,
            "is_ai": is_ai,
            "threshold": threshold,
            "stylometrics": stylometrics
        }
    except Exception as e:
        print(f"Error evaluating text: {e}")
        return None


def get_datasets():
    print("Gathering Human Text Dataset...")
    texts = []
    
    # 1. Student
    asap = pd.read_csv("dataset/asap_2.0/train/ASAP_2_Final_github_train.csv")
    asap = asap.dropna(subset=["full_text"])
    student_texts = asap["full_text"].sample(25, random_state=42).tolist()
    for t in student_texts:
        texts.append({"text": t, "category": "Student", "source": "ASAP"})
        
    # 2. V2 train subset (Informal, Formal, Technical)
    v2 = pd.read_csv("dataset/verity_v2_stage1_train_20k.csv")
    v2_h = v2[v2["label"] == 0].dropna(subset=["text"])
    
    informal = v2_h[v2_h["source"] == "hc3_reddit_eli5"]["text"].sample(25, random_state=42).tolist()
    for t in informal:
        texts.append({"text": t, "category": "Informal", "source": "hc3_reddit"})
        
    formal = v2_h[v2_h["source"].isin(["hc3_finance", "hc3_medicine", "hc3_open_qa", "hc3_wiki_csai"])]["text"].sample(25, random_state=42).tolist()
    for t in formal:
        texts.append({"text": t, "category": "Formal", "source": "hc3_formal"})
        
    technical = v2_h[v2_h["source"] == "raid_train"]["text"].sample(25, random_state=42).tolist()
    for t in technical:
        texts.append({"text": t, "category": "Technical", "source": "raid"})
        
    return texts

def classify_length(words):
    if words < 150: return "Short"
    if words < 400: return "Medium"
    return "Long"

def main():
    texts = get_datasets()
    
    # Check Production V4-B Model
    print("Checking Production V4-B Model...")
    load_v4b_production_model()
    print("Production V4-B is ACTIVE and uses threshold:", FeatureFusionDetector._cached_threshold)
    
    models_to_test = {
        "V2": os.path.join(root_dir, "backend", "models", "verity_detector_v2"),
        "V3": os.path.join(root_dir, "experiments", "verity_v3", "model"),
        "V4-A": os.path.join(root_dir, "experiments", "verity_v4", "v4a", "model"),
        "V4-B": os.path.join(root_dir, "experiments", "verity_v4", "v4b", "model"),
    }
    
    loaded_models = {}
    for name, path in models_to_test.items():
        if os.path.exists(path):
            try:
                loaded_models[name] = hack_load_model(path)
            except Exception as e:
                print(f"Skipping {name} due to error: {e}")
        else:
            print(f"Model {name} not found at {path}")
            
    results = []
    
    for item in tqdm(texts, desc="Evaluating"):
        text = item["text"]
        words = len(text.split())
        length_cat = classify_length(words)
        
        item_res = {
            "id": len(results) + 1,
            "text": text,
            "word_count": words,
            "category": item["category"],
            "source": item["source"],
            "length_category": length_cat,
        }
        
        # Production V4-B
        v4b_prod = FeatureFusionDetector.evaluate(text)
        item_res["prod_v4b"] = {
            "ai_probability": v4b_prod["ai_probability"],
            "human_probability": v4b_prod["human_probability"],
            "confidence": v4b_prod["confidence"],
            "is_ai": v4b_prod["classification"].lower().startswith("ai"),
            "threshold": FeatureFusionDetector._cached_threshold,
            "stylometrics": v4b_prod["stylometric_features"]
        }
        
        # Other models
        for name, (m, s, c) in loaded_models.items():
            res = evaluate_with(text, m, s, c)
            if res:
                item_res[name] = res
                
        results.append(item_res)
        
    with open("experiments/verity_v4/diagnostic_raw_results.json", "w") as f:
        json.dump(results, f, indent=2)
        
    print("Done. Saved raw results. Next step: Generate Report.")
    
if __name__ == "__main__":
    main()
