import os
import sys
import time
import json
import csv
import random
from collections import Counter, defaultdict
from pathlib import Path

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.ml.text_preprocessing import preprocess_text

def main():
    start_time = time.time()
    script_dir = os.path.dirname(os.path.abspath(__file__))
    hc3_path = os.path.join(script_dir, "hc3", "all.jsonl")
    raid_test_path = os.path.join(script_dir, "raid", "raid_subset.csv")
    raid_train_path = os.path.join(script_dir, "raid", "raid_train_subset.csv")
    stage1_csv_path = os.path.join(script_dir, "verity_v2_stage1_train.csv")
    reports_dir = os.path.join(script_dir, "reports")
    os.makedirs(reports_dir, exist_ok=True)
    os.makedirs(os.path.join(script_dir, "raid"), exist_ok=True)

    print(f"[{time.strftime('%H:%M:%S')}] Starting VERITY V2 Data Preparation & Leakage Protection Pipeline...")

    # 1. Load held-out RAID test set to build strict exclusion filter
    print(f"[{time.strftime('%H:%M:%S')}] Loading strictly held-out RAID test set ({raid_test_path})...")
    raid_test_texts = set()
    raid_test_norm_texts = set()
    raid_test_count = 0
    with open(raid_test_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            t = str(row.get("text", "")).strip()
            if t:
                raid_test_count += 1
                raid_test_texts.add(t)
                raid_test_norm_texts.add(preprocess_text(t))

    print(f"  Loaded {raid_test_count:,} RAID test samples (Unique exact: {len(raid_test_texts):,}, Unique normalized: {len(raid_test_norm_texts):,})")

    # 2. Partition HC3 into HC3-Train and HC3-Val deterministically (matching final_partition_report)
    print(f"[{time.strftime('%H:%M:%S')}] Processing HC3 dataset...")
    hc3_question_to_samples = defaultdict(list)
    seen_hc3_texts = set()
    hc3_duplicates = 0

    with open(hc3_path, "r", encoding="utf-8") as f:
        for line in f:
            line_str = line.strip()
            if not line_str:
                continue
            try:
                data = json.loads(line_str)
            except Exception:
                continue

            question_text = str(data.get("question", "")).strip()
            source = str(data.get("source", "unknown")).strip()

            # Human answers
            human_ans_list = data.get("human_answers", [])
            if not isinstance(human_ans_list, list):
                human_ans_list = [human_ans_list]
            for ans in human_ans_list:
                ans_str = str(ans).strip()
                if not ans_str or ans_str in ("!\\nnetwork error", "network error"):
                    continue
                if ans_str in seen_hc3_texts:
                    hc3_duplicates += 1
                    continue
                seen_hc3_texts.add(ans_str)
                hc3_question_to_samples[question_text].append({
                    "text": ans_str,
                    "label": 0,
                    "source": f"hc3_{source}",
                    "question": question_text
                })

            # AI answers
            ai_ans_list = data.get("chatgpt_answers", [])
            if not isinstance(ai_ans_list, list):
                ai_ans_list = [ai_ans_list]
            for ans in ai_ans_list:
                ans_str = str(ans).strip()
                if not ans_str or ans_str in ("!\\nnetwork error", "network error"):
                    continue
                if ans_str in seen_hc3_texts:
                    hc3_duplicates += 1
                    continue
                seen_hc3_texts.add(ans_str)
                hc3_question_to_samples[question_text].append({
                    "text": ans_str,
                    "label": 1,
                    "source": f"hc3_{source}",
                    "question": question_text
                })

    unique_questions = list(hc3_question_to_samples.keys())
    unique_questions.sort()
    random.seed(42)
    random.shuffle(unique_questions)

    num_train_questions = int(len(unique_questions) * 0.80)
    train_questions = set(unique_questions[:num_train_questions])
    val_questions = set(unique_questions[num_train_questions:])

    hc3_train_samples = []
    hc3_val_samples = []
    for q_text, samples in hc3_question_to_samples.items():
        if q_text in train_questions:
            hc3_train_samples.extend(samples)
        else:
            hc3_val_samples.extend(samples)

    hc3_val_norm_texts = set(preprocess_text(s["text"]) for s in hc3_val_samples)
    print(f"  HC3 Partition complete: {len(hc3_train_samples):,} Train samples, {len(hc3_val_samples):,} Val samples.")

    # Select ~50,000 HC3-Train samples (e.g. 20,947 AI + ~29,053 Human)
    hc3_train_human = [s for s in hc3_train_samples if s["label"] == 0]
    hc3_train_ai = [s for s in hc3_train_samples if s["label"] == 1]
    
    random.seed(42)
    random.shuffle(hc3_train_human)
    target_hc3_human = 29053
    target_hc3_ai = len(hc3_train_ai) # ~20,947
    selected_hc3 = hc3_train_human[:target_hc3_human] + hc3_train_ai[:target_hc3_ai]
    print(f"  Selected {len(selected_hc3):,} HC3 samples for Stage 1 ({sum(1 for s in selected_hc3 if s['label']==0):,} Human, {sum(1 for s in selected_hc3 if s['label']==1):,} AI)")

    # 3. Download/extract RAID Train Split (50,000 samples: 25,000 Human, 25,000 AI)
    print(f"[{time.strftime('%H:%M:%S')}] Building RAID train subset (target: 50,000 samples)...")
    raid_train_samples = []
    if os.path.exists(raid_train_path):
        print(f"  Existing RAID train subset found at '{raid_train_path}'. Loading...")
        with open(raid_train_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                text = str(row.get("text", "")).strip()
                if not text:
                    continue
                label = int(row.get("label", 0))
                raid_train_samples.append({
                    "text": text,
                    "label": label,
                    "model": row.get("model", "unknown"),
                    "attack": row.get("attack", "none"),
                    "domain": row.get("domain", "unknown"),
                    "source": "raid_train"
                })
    else:
        print(f"  Streaming HuggingFace dataset 'liamdugan/raid' split='train'...")
        from datasets import load_dataset
        ds = load_dataset("liamdugan/raid", split="train", streaming=True)
        
        TARGET_RAID_HUMAN = 25000
        TARGET_RAID_AI = 25000
        CAP_PER_AI_BUCKET = 300
        
        raid_human_collected = []
        raid_ai_collected = []
        ai_bucket_counts = defaultdict(int)
        
        scanned = 0
        skipped_test_overlap = 0
        
        for item in ds:
            scanned += 1
            if scanned % 10000 == 0:
                print(f"    Scanned {scanned:,} records | RAID Human: {len(raid_human_collected)}/{TARGET_RAID_HUMAN} | RAID AI: {len(raid_ai_collected)}/{TARGET_RAID_AI}", flush=True)
                
            raw_text = item.get("generation") or item.get("text") or ""
            text = str(raw_text).strip()
            if not text:
                continue
                
            norm_text = preprocess_text(text)
            
            # STRICT LEAKAGE CHECK: Skip if in held-out RAID test set or HC3-Val!
            if text in raid_test_texts or norm_text in raid_test_norm_texts or norm_text in hc3_val_norm_texts:
                skipped_test_overlap += 1
                continue
                
            model_name = str(item.get("model", "unknown")).strip()
            attack_type = str(item.get("attack", "none")).strip()
            domain_name = str(item.get("domain", "unknown")).strip()
            is_human = (model_name.lower() == "human")
            label = 0 if is_human else 1
            
            rec = {
                "text": text,
                "label": label,
                "model": model_name,
                "attack": attack_type,
                "domain": domain_name,
                "source": "raid_train"
            }
            
            if is_human:
                if len(raid_human_collected) < TARGET_RAID_HUMAN:
                    raid_human_collected.append(rec)
            else:
                if len(raid_ai_collected) < TARGET_RAID_AI:
                    bucket_key = (model_name, attack_type, domain_name)
                    if ai_bucket_counts[bucket_key] < CAP_PER_AI_BUCKET:
                        ai_bucket_counts[bucket_key] += 1
                        raid_ai_collected.append(rec)
                        
            if scanned >= 200000 or (len(raid_human_collected) >= TARGET_RAID_HUMAN and len(raid_ai_collected) >= TARGET_RAID_AI):
                print(f"    Target RAID training quota or max scan reached after scanning {scanned:,} records! (Skipped test overlaps: {skipped_test_overlap})", flush=True)
                break

        raid_train_samples = raid_human_collected + raid_ai_collected
        print(f"  Saving {len(raid_train_samples):,} RAID train samples to '{raid_train_path}'...")
        fieldnames = ["text", "label", "model", "attack", "domain", "source"]
        with open(raid_train_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(raid_train_samples)

    # 4. Check for Yelp dataset
    yelp_path = os.path.join(script_dir, "yelp", "yelp_train.csv")
    yelp_samples = []
    if os.path.exists(yelp_path):
        print(f"[{time.strftime('%H:%M:%S')}] Found Yelp dataset at '{yelp_path}'...")
        with open(yelp_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                t = str(row.get("text", "")).strip()
                if t:
                    yelp_samples.append({
                        "text": t,
                        "label": 0,
                        "source": "yelp_human"
                    })
        print(f"  Loaded {len(yelp_samples):,} Yelp human samples.")
    else:
        print(f"[{time.strftime('%H:%M:%S')}] Yelp dataset not found locally. Proceeding with Stage 1 without Yelp.")

    # 5. Combine and perform strict leakage protection check
    print(f"[{time.strftime('%H:%M:%S')}] Performing strict cross-dataset leakage protection audit...")
    all_stage1_samples = []
    
    # Track texts for overlap check
    seen_stage1_texts = set()
    seen_stage1_norm_texts = set()
    stage1_duplicates = 0
    raid_test_leakage_count = 0

    for s in selected_hc3 + raid_train_samples + yelp_samples:
        t = s["text"]
        norm_t = preprocess_text(t)
        
        # Check against RAID held-out test set
        if t in raid_test_texts or norm_t in raid_test_norm_texts:
            raid_test_leakage_count += 1
            print(f"CRITICAL WARNING: Leakage detected with held-out RAID test set! Excluding sample.")
            continue
            
        if norm_t in seen_stage1_norm_texts:
            stage1_duplicates += 1
            continue
            
        seen_stage1_texts.add(t)
        seen_stage1_norm_texts.add(norm_t)
        all_stage1_samples.append(s)

    assert raid_test_leakage_count == 0, f"STRICT LEAKAGE PROTECTION FAILURE: {raid_test_leakage_count} samples leaked from held-out RAID test set!"

    # Shuffle combined dataset
    random.seed(42)
    random.shuffle(all_stage1_samples)

    human_count = sum(1 for s in all_stage1_samples if s["label"] == 0)
    ai_count = sum(1 for s in all_stage1_samples if s["label"] == 1)

    print(f"[{time.strftime('%H:%M:%S')}] Stage 1 Dataset Ready: {len(all_stage1_samples):,} total samples ({human_count:,} Human, {ai_count:,} AI).")

    # Write Stage 1 combined dataset CSV
    print(f"[{time.strftime('%H:%M:%S')}] Writing Stage 1 dataset to '{stage1_csv_path}'...")
    fieldnames = ["text", "label", "source"]
    with open(stage1_csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(all_stage1_samples)

    # 6. Generate JSON and Markdown dataset reports
    model_dist = Counter(s.get("model", "n/a") for s in all_stage1_samples if "model" in s)
    attack_dist = Counter(s.get("attack", "n/a") for s in all_stage1_samples if "attack" in s)
    source_dist = Counter(s["source"] for s in all_stage1_samples)

    report_json = {
        "report_title": "VERITY V2 Stage 1 Training Dataset Composition & Leakage Audit",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "total_samples": len(all_stage1_samples),
        "human_count": human_count,
        "ai_count": ai_count,
        "sources_distribution": dict(source_dist),
        "model_distribution": dict(model_dist),
        "attack_distribution": dict(attack_dist),
        "stage1_duplicates_removed": stage1_duplicates,
        "heldout_raid_test_leakage_count": raid_test_leakage_count,
        "leakage_status": "PASSED_STRICT_ZERO_LEAKAGE"
    }

    report_json_path = os.path.join(reports_dir, "verity_v2_stage1_dataset_report.json")
    with open(report_json_path, "w", encoding="utf-8") as f:
        json.dump(report_json, f, indent=2)

    report_md_content = f"""# VERITY V2 Stage 1 Dataset Report

**Date:** {time.strftime('%Y-%m-%d %H:%M:%S')}  
**Leakage Audit Status:** `PASSED STRICT ZERO LEAKAGE`

## Dataset Overview
- **Total Stage 1 Samples:** {len(all_stage1_samples):,}
- **Human Written Samples (Label 0):** {human_count:,} ({human_count/len(all_stage1_samples):.1%})
- **AI Generated Samples (Label 1):** {ai_count:,} ({ai_count/len(all_stage1_samples):.1%})
- **Held-Out RAID Test Overlap:** 0 (Verified zero leakage)

## Source Breakdown
| Source Dataset | Sample Count | Percentage |
| :--- | :---: | :---: |
"""
    for src, cnt in source_dist.items():
        report_md_content += f"| `{src}` | {cnt:,} | {cnt/len(all_stage1_samples):.1%} |\n"

    report_md_content += f"""
## Generator Model Distribution (RAID Portion)
"""
    for mdl, cnt in model_dist.items():
        report_md_content += f"- **{mdl}**: {cnt:,}\n"

    report_md_content += f"""
## Attack Type Distribution (RAID Portion)
"""
    for atk, cnt in attack_dist.items():
        report_md_content += f"- **{atk}**: {cnt:,}\n"

    report_md_path = os.path.join(reports_dir, "verity_v2_stage1_dataset_report.md")
    with open(report_md_path, "w", encoding="utf-8") as f:
        f.write(report_md_content)

    print(f"[{time.strftime('%H:%M:%S')}] Dataset reports created at:")
    print(f"  - {report_json_path}")
    print(f"  - {report_md_path}")

if __name__ == "__main__":
    main()
