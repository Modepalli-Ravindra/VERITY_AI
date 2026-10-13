import pandas as pd
import hashlib

def get_hashes(csv_path):
    df = pd.read_csv(csv_path)
    texts = df['text'].dropna().astype(str).tolist()
    return set([hashlib.md5(t.strip().lower().encode('utf-8')).hexdigest() for t in texts])

train_hashes = get_hashes('dataset/raid/raid_train_subset.csv')
eval_hashes = get_hashes('dataset/raid/raid_subset.csv')

overlap = train_hashes.intersection(eval_hashes)
print(f"Train samples: {len(train_hashes)}")
print(f"Eval samples: {len(eval_hashes)}")
print(f"Overlap: {len(overlap)}")
