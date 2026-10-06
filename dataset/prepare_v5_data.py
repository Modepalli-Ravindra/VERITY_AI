import os
import sys
import json
import csv
import random
from pathlib import Path
from datasets import load_dataset

def main():
    print("Starting Clean V5 Data Preparation (HC3 ONLY)...")
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    hc3_dir = os.path.join(script_dir, "hc3")
    hc3_file = os.path.join(hc3_dir, "all.jsonl")
    v5_dir = os.path.join(script_dir, "v5")
    
    os.makedirs(hc3_dir, exist_ok=True)
    os.makedirs(v5_dir, exist_ok=True)
    
    if not os.path.exists(hc3_file):
        print("HC3 all.jsonl not found locally. Streaming from Hugging Face 'Hello-SimpleAI/HC3'...")
        ds = load_dataset("Hello-SimpleAI/HC3", "all", split="train", streaming=True)
        count = 0
        with open(hc3_file, "w", encoding="utf-8") as f:
            for item in ds:
                # Retain only necessary fields
                record = {
                    "question": item.get("question", ""),
                    "human_answers": item.get("human_answers", []),
                    "chatgpt_answers": item.get("chatgpt_answers", []),
                    "source": item.get("source", "unknown")
                }
                f.write(json.dumps(record) + "\n")
                count += 1
                if count % 5000 == 0:
                    print(f"  Downloaded {count} HC3 records...")
        print(f"Successfully downloaded {count} HC3 records to {hc3_file}.")
    else:
        print(f"HC3 dataset found at {hc3_file}.")
        
    print("Parsing and splitting HC3 deterministically (Seed 42)...")
    
    # 1. Group by Question
    question_to_samples = {}
    total_human = 0
    total_ai = 0
    
    with open(hc3_file, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip(): continue
            try:
                data = json.loads(line)
            except:
                continue
                
            question = data.get("question", "").strip()
            if not question: continue
            
            samples = []
            
            # Human
            human_ans = data.get("human_answers", [])
            for ans in human_ans:
                ans_str = str(ans).strip()
                if ans_str and "network error" not in ans_str.lower():
                    samples.append({"text": ans_str, "label": 0})
                    total_human += 1
                    
            # AI
            ai_ans = data.get("chatgpt_answers", [])
            for ans in ai_ans:
                ans_str = str(ans).strip()
                if ans_str and "network error" not in ans_str.lower():
                    samples.append({"text": ans_str, "label": 1})
                    total_ai += 1
                    
            if samples:
                if question not in question_to_samples:
                    question_to_samples[question] = []
                question_to_samples[question].extend(samples)
                
    questions = list(question_to_samples.keys())
    questions.sort() # Ensure stable ordering before shuffle
    random.seed(42)
    random.shuffle(questions)
    
    split_idx = int(len(questions) * 0.80)
    train_q = set(questions[:split_idx])
    
    train_samples = []
    val_samples = []
    
    for q, samples in question_to_samples.items():
        if q in train_q:
            train_samples.extend(samples)
        else:
            val_samples.extend(samples)
            
    random.seed(42)
    random.shuffle(train_samples)
    random.shuffle(val_samples)
    
    train_csv = os.path.join(v5_dir, "train.csv")
    val_csv = os.path.join(v5_dir, "val.csv")
    
    print(f"Writing {len(train_samples)} training samples to {train_csv}...")
    with open(train_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["text", "label"])
        writer.writeheader()
        writer.writerows(train_samples)
        
    print(f"Writing {len(val_samples)} validation samples to {val_csv}...")
    with open(val_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["text", "label"])
        writer.writeheader()
        writer.writerows(val_samples)
        
    print("V5 Dataset Preparation Complete!")
    print(f"Total Source Questions: {len(questions)}")
    print(f"Train Samples: {len(train_samples)} (Human: {sum(1 for s in train_samples if s['label']==0)}, AI: {sum(1 for s in train_samples if s['label']==1)})")
    print(f"Val Samples:   {len(val_samples)} (Human: {sum(1 for s in val_samples if s['label']==0)}, AI: {sum(1 for s in val_samples if s['label']==1)})")
    
if __name__ == "__main__":
    main()
