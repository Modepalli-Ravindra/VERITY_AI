import os
import sys
import json
import csv
import random
import hashlib
import pandas as pd
from collections import defaultdict

def normalize_text_hash(text):
    return hashlib.md5(str(text).strip().lower().encode('utf-8')).hexdigest()

def main():
    print("Starting V5-Robust Strict Data Preparation...")
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    hc3_file = os.path.join(script_dir, "hc3", "all.jsonl")
    formal_file = os.path.join(script_dir, "formal", "formal_subsets.csv")
    raid_train_file = os.path.join(script_dir, "raid", "raid_train_subset.csv")
    raid_test_file = os.path.join(script_dir, "raid", "raid_subset.csv")
    
    v5_robust_dir = os.path.join(script_dir, "v5_robust")
    os.makedirs(v5_robust_dir, exist_ok=True)
    
    report = {
        "seed": 42,
        "source_files": [hc3_file, formal_file, raid_train_file, raid_test_file],
        "datasets": {},
        "leakage_checks": {}
    }
    
    # ---------------------------------------------------------
    # 1. Process HC3 (Question-level split)
    # ---------------------------------------------------------
    print("\nParsing HC3...")
    question_to_samples = defaultdict(list)
    
    if os.path.exists(hc3_file):
        with open(hc3_file, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip(): continue
                try:
                    data = json.loads(line)
                except:
                    continue
                    
                question = data.get("question", "").strip()
                if not question: continue
                
                # Human
                for ans in data.get("human_answers", []):
                    ans_str = str(ans).strip()
                    if ans_str and "network error" not in ans_str.lower():
                        question_to_samples[question].append({"text": ans_str, "label": 0, "domain": "hc3", "question": question})
                        
                # AI
                for ans in data.get("chatgpt_answers", []):
                    ans_str = str(ans).strip()
                    if ans_str and "network error" not in ans_str.lower():
                        question_to_samples[question].append({"text": ans_str, "label": 1, "domain": "hc3", "question": question})
                        
    questions = list(question_to_samples.keys())
    questions.sort() # Ensure stable ordering before shuffle
    random.seed(42)
    random.shuffle(questions)
    
    hc3_train = []
    hc3_val = []
    hc3_test = []
    
    q_train = set()
    q_val = set()
    q_test = set()
    
    for q in questions:
        samples = question_to_samples[q]
        if len(hc3_train) < 15000:
            hc3_train.extend(samples)
            q_train.add(q)
        elif len(hc3_val) < 5000:
            hc3_val.extend(samples)
            q_val.add(q)
        else:
            hc3_test.extend(samples)
            q_test.add(q)
            
    print(f"HC3 -> Train: {len(hc3_train)}, Val: {len(hc3_val)}, Test: {len(hc3_test)}")
    
    # Verify HC3 leakage
    hc3_leak_train_val = len(q_train.intersection(q_val))
    hc3_leak_train_test = len(q_train.intersection(q_test))
    hc3_leak_val_test = len(q_val.intersection(q_test))
    
    report["leakage_checks"]["hc3_question_overlap"] = {
        "train_intersect_val": hc3_leak_train_val,
        "train_intersect_test": hc3_leak_train_test,
        "val_intersect_test": hc3_leak_val_test
    }
    
    if hc3_leak_train_val > 0 or hc3_leak_train_test > 0 or hc3_leak_val_test > 0:
        print("ERROR: HC3 Question Overlap detected!")
        sys.exit(1)

    # ---------------------------------------------------------
    # 2. Process Formal
    # ---------------------------------------------------------
    print("\nParsing Formal...")
    formal_df = pd.read_csv(formal_file)
    formal_samples = []
    seen_f = set()
    for _, row in formal_df.iterrows():
        h = normalize_text_hash(str(row['text']))
        if h not in seen_f:
            seen_f.add(h)
            formal_samples.append({"text": str(row['text']), "label": int(row['label']), "domain": "formal"})
            
    random.seed(42)
    random.shuffle(formal_samples)
    
    # 80/10/10 split
    f_train_idx = int(len(formal_samples) * 0.8)
    f_val_idx = int(len(formal_samples) * 0.9)
    
    formal_train = formal_samples[:f_train_idx]
    formal_val = formal_samples[f_train_idx:f_val_idx]
    formal_test = formal_samples[f_val_idx:]
    
    f_train_hashes = set(normalize_text_hash(s['text']) for s in formal_train)
    f_val_hashes = set(normalize_text_hash(s['text']) for s in formal_val)
    f_test_hashes = set(normalize_text_hash(s['text']) for s in formal_test)
    
    f_leak_train_val = len(f_train_hashes.intersection(f_val_hashes))
    f_leak_train_test = len(f_train_hashes.intersection(f_test_hashes))
    f_leak_val_test = len(f_val_hashes.intersection(f_test_hashes))
    
    report["leakage_checks"]["formal_exact_text_overlap"] = {
        "train_intersect_val": f_leak_train_val,
        "train_intersect_test": f_leak_train_test,
        "val_intersect_test": f_leak_val_test
    }
    
    print(f"Formal -> Train: {len(formal_train)}, Val: {len(formal_val)}, Test: {len(formal_test)}")
    
    if f_leak_train_val > 0 or f_leak_train_test > 0 or f_leak_val_test > 0:
        print(f"ERROR: Formal Text Overlap detected! (Tr-V: {f_leak_train_val}, Tr-Te: {f_leak_train_test}, V-Te: {f_leak_val_test})")
        sys.exit(1)

    # ---------------------------------------------------------
    # 3. Process RAID (from raid_train_subset.csv)
    # ---------------------------------------------------------
    print("\nParsing RAID...")
    raid_df = pd.read_csv(raid_train_file)
    raid_test_df = pd.read_csv(raid_test_file)
    
    raid_test_hashes = set(normalize_text_hash(t) for t in raid_test_df['text'].tolist())
    
    # Filter raid_train to prevent any overlap with raid_test AND deduplicate internal overlaps
    raid_train_clean = []
    r_overlap_with_test = 0
    seen_r = set()
    for _, row in raid_df.iterrows():
        t = str(row['text'])
        h = normalize_text_hash(t)
        if h in raid_test_hashes:
            r_overlap_with_test += 1
        elif h not in seen_r:
            seen_r.add(h)
            s = {"text": t, "label": int(row['label']), "domain": "raid"}
            if 'attack' in row:
                s['attack'] = row['attack']
            raid_train_clean.append(s)
            
    # We want 15,000 train, 1,000 val
    raid_human = [s for s in raid_train_clean if s['label'] == 0]
    raid_ai = [s for s in raid_train_clean if s['label'] == 1]
    
    random.seed(42)
    random.shuffle(raid_human)
    random.shuffle(raid_ai)
    
    raid_train = raid_human[:7500] + raid_ai[:7500]
    raid_val = raid_human[7500:8000] + raid_ai[7500:8000]
    
    r_train_hashes = set(normalize_text_hash(s['text']) for s in raid_train)
    r_val_hashes = set(normalize_text_hash(s['text']) for s in raid_val)
    
    r_leak_train_val = len(r_train_hashes.intersection(r_val_hashes))
    r_leak_train_test = len(r_train_hashes.intersection(raid_test_hashes))
    r_leak_val_test = len(r_val_hashes.intersection(raid_test_hashes))
    
    report["leakage_checks"]["raid_exact_text_overlap"] = {
        "train_intersect_val": r_leak_train_val,
        "train_intersect_test": r_leak_train_test,
        "val_intersect_test": r_leak_val_test,
        "initial_overlap_found_and_removed": r_overlap_with_test
    }
    
    if r_leak_train_val > 0 or r_leak_train_test > 0 or r_leak_val_test > 0:
        print(f"ERROR: RAID Overlap detected! Tr-V: {r_leak_train_val}, Tr-Te: {r_leak_train_test}, V-Te: {r_leak_val_test}")
        sys.exit(1)
        
    # Attack distribution for RAID Train
    raid_train_attacks = defaultdict(int)
    for s in raid_train:
        if 'attack' in s: raid_train_attacks[s['attack']] += 1
        
    print(f"RAID -> Train: {len(raid_train)}, Val: {len(raid_val)}, Test (Untouched): {len(raid_test_df)}")

    # ---------------------------------------------------------
    # 4. Combine and Save
    # ---------------------------------------------------------
    train_combined = hc3_train + formal_train + raid_train
    val_combined = hc3_val + formal_val + raid_val
    
    # Make sure we don't accidentally leak between datasets (e.g. HC3 text appearing in Formal)
    all_train_hashes = set(normalize_text_hash(s['text']) for s in train_combined)
    all_val_hashes = set(normalize_text_hash(s['text']) for s in val_combined)
    
    cross_leak = len(all_train_hashes.intersection(all_val_hashes))
    report["leakage_checks"]["cross_domain_overlap"] = cross_leak
    if cross_leak > 0:
        print(f"WARNING: Cross-domain overlap detected (Train intersect Val = {cross_leak}). Cleaning Val...")
        val_combined = [s for s in val_combined if normalize_text_hash(s['text']) not in all_train_hashes]
        
    random.seed(42)
    random.shuffle(train_combined)
    random.shuffle(val_combined)
    
    train_csv = os.path.join(v5_robust_dir, "train.csv")
    val_csv = os.path.join(v5_robust_dir, "val.csv")
    test_hc3_csv = os.path.join(v5_robust_dir, "test_hc3.csv")
    test_formal_csv = os.path.join(v5_robust_dir, "test_formal.csv")
    test_raid_csv = os.path.join(v5_robust_dir, "test_raid.csv") # we'll just copy the raid_subset.csv
    
    def write_csv(path, data, fields=["text", "label"]):
        with open(path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fields, extrasaction='ignore')
            writer.writeheader()
            writer.writerows(data)
            
    write_csv(train_csv, train_combined)
    write_csv(val_csv, val_combined)
    write_csv(test_hc3_csv, hc3_test)
    write_csv(test_formal_csv, formal_test)
    
    # Just copy the RAID test set directly to ensure it is EXACTLY untouched
    import shutil
    shutil.copy2(raid_test_file, test_raid_csv)
    
    # ---------------------------------------------------------
    # 5. Build Report
    # ---------------------------------------------------------
    def count_labels(data):
        return {"human": sum(1 for s in data if s['label']==0), "ai": sum(1 for s in data if s['label']==1), "total": len(data)}
        
    report["datasets"] = {
        "train": {
            "total": len(train_combined),
            "human": sum(1 for s in train_combined if s['label']==0),
            "ai": sum(1 for s in train_combined if s['label']==1),
            "hc3": len(hc3_train),
            "formal": len(formal_train),
            "raid": len(raid_train)
        },
        "validation": {
            "total": len(val_combined),
            "human": sum(1 for s in val_combined if s['label']==0),
            "ai": sum(1 for s in val_combined if s['label']==1),
            "hc3": len(hc3_val),
            "formal": len(formal_val),
            "raid": len(raid_val)
        },
        "test": {
            "hc3": count_labels(hc3_test),
            "formal": count_labels(formal_test),
            "raid": {"total": len(raid_test_df), "human": len(raid_test_df[raid_test_df['label']==0]), "ai": len(raid_test_df[raid_test_df['label']==1])}
        },
        "raid_train_attacks": dict(raid_train_attacks)
    }
    
    json_path = os.path.join(v5_robust_dir, "data_preparation_report.json")
    md_path = os.path.join(v5_robust_dir, "data_preparation_report.md")
    
    with open(json_path, "w") as f:
        json.dump(report, f, indent=2)
        
    with open(md_path, "w") as f:
        f.write("# V5-Robust Data Preparation Report\n\n")
        f.write(f"- **Random Seed**: {report['seed']}\n")
        f.write("- **Source Files**:\n")
        for file in report['source_files']:
            f.write(f"  - {file}\n")
            
        f.write("\n## Leakage Validation Checks\n")
        f.write(f"- HC3 Question Overlap (Tr/Val, Tr/Te, Val/Te): {hc3_leak_train_val}, {hc3_leak_train_test}, {hc3_leak_val_test}\n")
        f.write(f"- Formal Exact Overlap (Tr/Val, Tr/Te, Val/Te): {f_leak_train_val}, {f_leak_train_test}, {f_leak_val_test}\n")
        f.write(f"- RAID Exact Overlap (Tr/Val, Tr/Te, Val/Te): {r_leak_train_val}, {r_leak_train_test}, {r_leak_val_test} (Filtered initial overlaps: {r_overlap_with_test})\n")
        f.write(f"- Cross-Domain Train/Val Overlap: {cross_leak}\n")
        
        f.write("\n## Dataset Composition\n")
        f.write("### Train Set\n")
        f.write(f"- Total: {report['datasets']['train']['total']}\n")
        f.write(f"- Human: {report['datasets']['train']['human']}\n")
        f.write(f"- AI: {report['datasets']['train']['ai']}\n")
        f.write(f"- HC3: {report['datasets']['train']['hc3']}\n")
        f.write(f"- Formal: {report['datasets']['train']['formal']}\n")
        f.write(f"- RAID: {report['datasets']['train']['raid']}\n")
        
        f.write("\n### Validation Set\n")
        f.write(f"- Total: {report['datasets']['validation']['total']}\n")
        f.write(f"- Human: {report['datasets']['validation']['human']}\n")
        f.write(f"- AI: {report['datasets']['validation']['ai']}\n")
        f.write(f"- HC3: {report['datasets']['validation']['hc3']}\n")
        f.write(f"- Formal: {report['datasets']['validation']['formal']}\n")
        f.write(f"- RAID: {report['datasets']['validation']['raid']}\n")
        
        f.write("\n### RAID Train Attack Distribution\n")
        for k, v in raid_train_attacks.items():
            f.write(f"- {k}: {v}\n")
            
    print("\n" + "="*80)
    print(f"{'Dataset':<10} | {'Train':<7} | {'Validation':<10} | {'Test':<7} | {'Human':<7} | {'AI':<7} | {'Leakage'}")
    print("-" * 80)
    print(f"{'HC3':<10} | {len(hc3_train):<7} | {len(hc3_val):<10} | {len(hc3_test):<7} | {'N/A':<7} | {'N/A':<7} | {hc3_leak_train_val+hc3_leak_train_test+hc3_leak_val_test} q-overlap")
    print(f"{'Formal':<10} | {len(formal_train):<7} | {len(formal_val):<10} | {len(formal_test):<7} | {'N/A':<7} | {'N/A':<7} | {f_leak_train_val+f_leak_train_test+f_leak_val_test} t-overlap")
    print(f"{'RAID':<10} | {len(raid_train):<7} | {len(raid_val):<10} | {len(raid_test_df):<7} | {'N/A':<7} | {'N/A':<7} | {r_leak_train_val+r_leak_train_test+r_leak_val_test} t-overlap")
    
    total_tr = len(train_combined)
    total_va = len(val_combined)
    total_h = sum(1 for s in train_combined if s['label']==0)
    total_a = sum(1 for s in train_combined if s['label']==1)
    
    print("-" * 80)
    print(f"{'TOTAL':<10} | {total_tr:<7} | {total_va:<10} | {'N/A':<7} | {total_h:<7} | {total_a:<7} | 0 final overlap")
    print("=" * 80)
    print("\nDATA PREPARATION COMPLETE — TRAINING NOT STARTED")

if __name__ == "__main__":
    main()
