import pandas as pd
import hashlib
import json

def hash_text(t):
    if pd.isna(t): return ""
    return hashlib.md5(str(t).encode('utf-8')).hexdigest()

print("Loading dataset...")
df_train = pd.read_csv("dataset/verity_v2_stage1_train.csv")
df_raid = pd.read_csv("dataset/raid/raid_subset.csv")

print(f"Original train samples: {len(df_train)}")
print(f"RAID samples: {len(df_raid)}")

# Check overlap
print("Hashing texts for overlap check...")
raid_hashes = set(df_raid['text'].apply(hash_text))
df_train['text_hash'] = df_train['text'].apply(hash_text)

overlap_mask = df_train['text_hash'].isin(raid_hashes)
overlap_count = overlap_mask.sum()
print(f"Found {overlap_count} overlapping samples. Removing them if any...")

df_train_clean = df_train[~overlap_mask].copy()

# Remove exact duplicates in train
dup_mask = df_train_clean.duplicated(subset=['text_hash'])
dup_count = dup_mask.sum()
print(f"Found {dup_count} duplicates in train. Removing them...")
df_train_clean = df_train_clean[~dup_mask].copy()

# Target size
TARGET_SIZE = 20000

# Stratified sampling
strata_counts = df_train_clean.groupby(['label', 'source']).size()
total_clean = len(df_train_clean)

sampled_dfs = []
for (label, source), count in strata_counts.items():
    fraction = count / total_clean
    target_n = int(round(TARGET_SIZE * fraction))
    
    stratum_df = df_train_clean[(df_train_clean['label'] == label) & (df_train_clean['source'] == source)]
    
    n = min(target_n, len(stratum_df))
    sampled_dfs.append(stratum_df.sample(n=n, random_state=42))

df_20k = pd.concat(sampled_dfs).sample(frac=1.0, random_state=42).reset_index(drop=True)

# Adjust to exactly 20000 if needed
if len(df_20k) > TARGET_SIZE:
    df_20k = df_20k.head(TARGET_SIZE)
elif len(df_20k) < TARGET_SIZE:
    remaining = TARGET_SIZE - len(df_20k)
    not_sampled = df_train_clean.drop(df_20k.index, errors='ignore')
    if len(not_sampled) >= remaining:
        df_20k = pd.concat([df_20k, not_sampled.sample(n=remaining, random_state=42)]).sample(frac=1.0, random_state=42).reset_index(drop=True)

print(f"Final 20k dataset size: {len(df_20k)}")

# Metrics
human_count = (df_20k['label'] == 0).sum()
ai_count = (df_20k['label'] == 1).sum()
total_count = len(df_20k)

report = {
    "total_samples": total_count,
    "human_count": int(human_count),
    "ai_count": int(ai_count),
    "human_percent": round(human_count / total_count * 100, 2),
    "ai_percent": round(ai_count / total_count * 100, 2),
    "source_distribution": df_20k['source'].value_counts().to_dict(),
    "duplicate_count": int(dup_count),
    "overlap_count": int(overlap_count),
    "file_path": "dataset/verity_v2_stage1_train_20k.csv"
}

df_20k[['text', 'label', 'source']].to_csv("dataset/verity_v2_stage1_train_20k.csv", index=False)

with open("dataset/create_20k_report.json", "w") as f:
    json.dump(report, f, indent=2)

print("Done!")
