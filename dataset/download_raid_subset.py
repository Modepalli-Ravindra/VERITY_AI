import os
import time
import json
import csv
from collections import Counter, defaultdict
from datasets import load_dataset

def main():
    start_time = time.time()

    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(script_dir, "raid")
    os.makedirs(output_dir, exist_ok=True)

    csv_path = os.path.join(output_dir, "raid_subset.csv")
    json_path = os.path.join(output_dir, "raid_subset_report.json")

    print(f"[{time.strftime('%H:%M:%S')}] Connecting to Hugging Face dataset 'liamdugan/raid' with streaming=True...")
    ds = load_dataset("liamdugan/raid", split="train", streaming=True)

    TARGET_HUMAN = 10000
    TARGET_AI = 10000
    # Cap per AI bucket (model, attack, domain) to ensure high diversity across combinations
    CAP_PER_AI_BUCKET = 120

    seen_texts = set()
    human_samples = []
    ai_samples = []

    ai_bucket_counts = defaultdict(int)
    model_dist = Counter()
    attack_dist = Counter()
    domain_dist = Counter()

    records_scanned = 0
    duplicate_count = 0

    print(f"[{time.strftime('%H:%M:%S')}] Streaming and selecting balanced subset (Target: {TARGET_HUMAN} Human, {TARGET_AI} AI)...")

    for item in ds:
        records_scanned += 1

        if records_scanned % 50000 == 0:
            print(f"[{time.strftime('%H:%M:%S')}] Scanned {records_scanned:,} records | Selected Human: {len(human_samples)}/{TARGET_HUMAN} | Selected AI: {len(ai_samples)}/{TARGET_AI}")

        # Extract text from 'generation' field
        raw_text = item.get("generation") or item.get("text") or ""
        text = str(raw_text).strip()

        if not text:
            continue

        # Exact duplicate detection
        if text in seen_texts:
            duplicate_count += 1
            continue

        model_name = str(item.get("model", "unknown")).strip()
        attack_type = str(item.get("attack", "none")).strip()
        domain_name = str(item.get("domain", "unknown")).strip()
        source_id = str(item.get("source_id", "")).strip()

        is_human = (model_name.lower() == "human")
        label = 0 if is_human else 1

        if is_human:
            if len(human_samples) < TARGET_HUMAN:
                seen_texts.add(text)
                record = {
                    "text": text,
                    "label": label,
                    "model": model_name,
                    "attack": attack_type,
                    "domain": domain_name,
                    "source_id": source_id
                }
                human_samples.append(record)
                model_dist[model_name] += 1
                attack_dist[attack_type] += 1
                domain_dist[domain_name] += 1
        else:
            if len(ai_samples) < TARGET_AI:
                bucket_key = (model_name, attack_type, domain_name)
                if ai_bucket_counts[bucket_key] < CAP_PER_AI_BUCKET:
                    seen_texts.add(text)
                    ai_bucket_counts[bucket_key] += 1
                    record = {
                        "text": text,
                        "label": label,
                        "model": model_name,
                        "attack": attack_type,
                        "domain": domain_name,
                        "source_id": source_id
                    }
                    ai_samples.append(record)
                    model_dist[model_name] += 1
                    attack_dist[attack_type] += 1
                    domain_dist[domain_name] += 1

        # Early exit check once both quotas are reached
        if len(human_samples) >= TARGET_HUMAN and len(ai_samples) >= TARGET_AI:
            print(f"[{time.strftime('%H:%M:%S')}] Successfully collected target dataset size ({TARGET_HUMAN} Human, {TARGET_AI} AI).")
            break

    # If AI pool was capped strictly and didn't reach 10k, loosen bucket cap on remaining scan if needed
    if len(ai_samples) < TARGET_AI or len(human_samples) < TARGET_HUMAN:
        print(f"[{time.strftime('%H:%M:%S')}] Completed initial scan. Selected Human: {len(human_samples)}, Selected AI: {len(ai_samples)}. Scanned: {records_scanned:,}")

    all_selected = human_samples + ai_samples
    total_selected = len(all_selected)

    # Safety checks & verification before saving
    print(f"[{time.strftime('%H:%M:%S')}] Running safety checks on selected dataset...")
    assert total_selected > 0, "Error: No samples selected!"
    for r in all_selected:
        assert r["text"], "Error: Found empty text entry!"
        assert r["label"] in (0, 1), f"Error: Invalid label {r['label']}"
        if r["model"].lower() == "human":
            assert r["label"] == 0, f"Error: Human label must be 0, got {r['label']}"
        else:
            assert r["label"] == 1, f"Error: AI label must be 1, got {r['label']}"

    assert len(seen_texts) == total_selected, "Error: Duplicate text detected in final selection!"

    # Save dataset to CSV
    fieldnames = ["text", "label", "model", "attack", "domain", "source_id"]
    print(f"[{time.strftime('%H:%M:%S')}] Writing {total_selected:,} records to '{csv_path}'...")
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_selected)

    elapsed_time = round(time.time() - start_time, 2)

    # Prepare summary report JSON
    report = {
        "source_dataset": "liamdugan/raid",
        "records_scanned": records_scanned,
        "total_selected": total_selected,
        "human_count": len(human_samples),
        "ai_count": len(ai_samples),
        "model_distribution": dict(model_dist),
        "attack_distribution": dict(attack_dist),
        "domain_distribution": dict(domain_dist),
        "duplicate_count": duplicate_count,
        "fields_detected": fieldnames,
        "processing_time_seconds": elapsed_time
    }

    print(f"[{time.strftime('%H:%M:%S')}] Writing dataset report to '{json_path}'...")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print("\n=======================================================")
    print("RAID DATASET EXTRACTION SUMMARY REPORT")
    print("=======================================================")
    print(f"Source Dataset:         liamdugan/raid")
    print(f"RAID records scanned:   {records_scanned:,}")
    print(f"Human selected:         {len(human_samples):,}")
    print(f"AI selected:            {len(ai_samples):,}")
    print(f"Total selected:         {total_selected:,}")
    print(f"Models represented:     {len(model_dist)}")
    print(f"Attack types represented:{len(attack_dist)}")
    print(f"Domains represented:    {len(domain_dist)}")
    print(f"Duplicates bypassed:    {duplicate_count:,}")
    print(f"Processing Time:        {elapsed_time}s")
    print(f"Output CSV:             {csv_path}")
    print(f"Output Report:          {json_path}")
    print("=======================================================\n")

if __name__ == "__main__":
    main()
