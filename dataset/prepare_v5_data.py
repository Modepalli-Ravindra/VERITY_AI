import os
import sys
import json
import csv
import random
import shutil
from pathlib import Path
from huggingface_hub import hf_hub_download

def main():
    print("Starting Clean V5 Data Preparation (HC3 ONLY)...")
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    hc3_dir = os.path.join(script_dir, "hc3")
    hc3_file = os.path.join(hc3_dir, "all.jsonl")
    v5_dir = os.path.join(script_dir, "v5")
    
    os.makedirs(hc3_dir, exist_ok=True)
    os.makedirs(v5_dir, exist_ok=True)
    
    if not os.path.exists(hc3_file):
        print("HC3 not found — downloading official HC3 all.jsonl.")
        downloaded_path = hf_hub_download(
            repo_id="Hello-SimpleAI/HC3",
            repo_type="dataset",
            filename="all.jsonl"
        )
        shutil.copy2(downloaded_path, hc3_file)
        print("HC3 downloaded successfully.")
    else:
        print("HC3 local file found — using cached dataset.")
        
    print("Parsing HC3...")
    
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
    
    print("Question-level split...")
    random.seed(42)
    random.shuffle(questions)
    
    split_idx = int(len(questions) * 0.80)
    train_q = set(questions[:split_idx])
    val_q = set(questions[split_idx:])
    
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
    
    with open(train_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["text", "label"])
        writer.writeheader()
        writer.writerows(train_samples)
        
    with open(val_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["text", "label"])
        writer.writeheader()
        writer.writerows(val_samples)
        
    overlap = train_q.intersection(val_q)
    
    print(f"\nTotal source questions: {len(questions)}")
    print(f"Unique questions: {len(questions)}")
    print(f"Train questions: {len(train_q)}")
    print(f"Validation questions: {len(val_q)}")
    
    train_h = sum(1 for s in train_samples if s['label']==0)
    train_a = sum(1 for s in train_samples if s['label']==1)
    val_h = sum(1 for s in val_samples if s['label']==0)
    val_a = sum(1 for s in val_samples if s['label']==1)
    
    print(f"\nTrain samples: {len(train_samples)}")
    print(f"Train Human: {train_h}")
    print(f"Train AI: {train_a}")
    
    print(f"\nValidation samples: {len(val_samples)}")
    print(f"Validation Human: {val_h}")
    print(f"Validation AI: {val_a}")
    
    print(f"\nCross-set question overlap: {len(overlap)}")
    
    print("\nRAID references: 0")
    print(f"\nCreated:")
    print(f"dataset/v5/train.csv")
    print(f"dataset/v5/val.csv")

    print("\nSample content:")
    human_sample = next((s for s in train_samples if s['label'] == 0), None)
    ai_sample = next((s for s in train_samples if s['label'] == 1), None)
    
    print("\nHuman sample:")
    print(f"text: {human_sample['text'][:100]}...")
    print(f"label = 0")
    
    print("\nAI sample:")
    print(f"text: {ai_sample['text'][:100]}...")
    print(f"label = 1")
    
if __name__ == "__main__":
    main()
