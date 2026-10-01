import os
import csv
import json
import random
from collections import Counter
import pandas as pd

# Paths
ASAP_TRAIN = "dataset/asap_2.0/train/ASAP_2_Final_github_train.csv"
ASAP_TEST = "dataset/asap_2.0/test/ASAP_2_Final_github_test.csv"
V2_TRAIN = "dataset/verity_v2_stage1_train_20k.csv"
HC3_PATH = "dataset/hc3/all.jsonl"
RAID_PATH = "dataset/raid/raid_subset.csv"
V3_DIR = "experiments/verity_v3"
V3_TRAIN = os.path.join(V3_DIR, "v3_train.csv")
MANIFEST = os.path.join(V3_DIR, "data_manifest.json")
os.makedirs(V3_DIR, exist_ok=True)
os.makedirs(os.path.join(V3_DIR, "model"), exist_ok=True)

def main():
    print("PHASE 1: Data Audit ASAP 2.0")
    df_asap = pd.read_csv(ASAP_TRAIN)
    total_asap = len(df_asap)
    df_asap = df_asap.dropna(subset=['full_text'])
    df_asap = df_asap[df_asap['full_text'].str.strip() != ""]
    
    word_counts = df_asap['full_text'].apply(lambda x: len(x.split()))
    min_len = int(word_counts.min())
    max_len = int(word_counts.max())
    avg_len = float(word_counts.mean())
    
    print(f"Total ASAP train essays: {total_asap}")
    print(f"Non-empty essays: {len(df_asap)}")
    print(f"Lengths: min {min_len}, max {max_len}, avg {avg_len}")
    
    print("PHASE 2: Human Data Selection")
    # Filter for reasonable length > 50 words to avoid extremely short noise
    df_valid = df_asap[word_counts > 50].copy()
    
    # Shuffle and select 5000
    df_valid = df_valid.sample(n=5000, random_state=42)
    selected_asap_texts = df_valid['full_text'].tolist()
    
    print("PHASE 3: Data Leakage Protection")
    v2_train_df = pd.read_csv(V2_TRAIN)
    v2_train_texts = set(v2_train_df['text'].str.strip().str.lower())
    
    # Dedup
    filtered_asap_texts = []
    for text in selected_asap_texts:
        t_lower = text.strip().lower()
        if t_lower not in v2_train_texts:
            filtered_asap_texts.append(text.strip())
            v2_train_texts.add(t_lower)
            
    print(f"Selected ASAP texts after dedup: {len(filtered_asap_texts)}")
    
    print("PHASE 4: Build V3 Training Data")
    v3_train_data = []
    
    # Add V2 training data
    num_human = 0
    num_ai = 0
    for _, row in v2_train_df.iterrows():
        l = int(row['label'])
        v3_train_data.append({"text": row['text'], "label": l, "source": "v2_train"})
        if l == 0: num_human += 1
        else: num_ai += 1
        
    # Add ASAP texts
    for text in filtered_asap_texts:
        v3_train_data.append({"text": text, "label": 0, "source": "asap_2.0"})
        num_human += 1
        
    # Let's save V3 train data
    with open(V3_TRAIN, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["text", "label", "source"])
        writer.writeheader()
        writer.writerows(v3_train_data)
        
    print(f"V3 train data saved. Human: {num_human}, AI: {num_ai}")
    
    # Write manifest
    manifest_data = {
        "source": "ASAP 2.0 (https://github.com/scrosseye/ASAP_2.0)",
        "license": "CC BY 4.0",
        "original_sample_count": total_asap,
        "selected_sample_count": len(filtered_asap_texts),
        "filtering_rules": ["non-empty", ">50 words", "deduplicated against V2 train"],
        "class_counts": {
            "human": num_human,
            "ai": num_ai
        }
    }
    with open(MANIFEST, "w", encoding="utf-8") as f:
        json.dump(manifest_data, f, indent=2)
    print("Manifest saved.")
    
if __name__ == "__main__":
    main()
