import os
import json
import torch
from pathlib import Path

v1_dir = 'backend/models/verity_detector'
model_path = os.path.join(v1_dir, 'best_model.pt')
config_path = os.path.join(v1_dir, 'config.json')
scaler_path = os.path.join(v1_dir, 'stylometric_scaler.json')

print('--- V1 Artifacts ---')
for path in [model_path, config_path, scaler_path]:
    if os.path.exists(path):
        st = os.stat(path)
        print(f'{path}: Size={st.st_size} bytes, MTime={st.st_mtime}')
    else:
        print(f'{path}: NOT FOUND')

if os.path.exists(config_path):
    with open(config_path, 'r') as f:
        print('\n--- config.json ---')
        print(json.dumps(json.load(f), indent=2))

if os.path.exists(scaler_path):
    with open(scaler_path, 'r') as f:
        scaler = json.load(f)
        print('\n--- stylometric_scaler.json ---')
        print(f'Mean length: {len(scaler.get("mean", []))}')
        print(f'Std length: {len(scaler.get("std", []))}')

if os.path.exists(model_path):
    print('\n--- Model Keys ---')
    try:
        sd = torch.load(model_path, map_location='cpu')
        for k in sd.keys():
            print(f'{k}: {sd[k].shape}')
    except Exception as e:
        print(f'Failed to load model: {e}')

from backend.ml.fusion_model import FeatureFusionDetector
import torch
texts = [
    ('Short Human', 'hey mate, are we still meeting at the cafe around 5?'),
    ('Short AI', 'In conclusion, the paramount objective is operational efficiency.'),
    ('Normal Human', 'I spent the weekend renovating my backyard garden. We planted tomatoes, peppers, and basil. It was a lot of hard work but totally worth it.'),
    ('Normal AI', 'Artificial intelligence represents a pivotal shift in software engineering. Modern deep learning architectures have completely transformed how we approach complex data analysis and problem solving.')
]

print('\n--- Logits and Probs ---')
FeatureFusionDetector.load_detector()
model = FeatureFusionDetector._cached_model
scaler = FeatureFusionDetector._cached_scaler
threshold = FeatureFusionDetector._cached_threshold
print(f'Threshold: {threshold}')

from backend.ml.text_preprocessing import preprocess_text
from backend.ml.stylometrics import StylometricExtractor
from backend.ml.transformer_model import TransformerModelManager

for name, text in texts:
    clean_text = preprocess_text(text)
    raw_sty = StylometricExtractor.get_vector(clean_text)
    scaled_sty = scaler.transform(raw_sty)
    tf_feat = TransformerModelManager.extract_features(clean_text)
    sem_vec = tf_feat.get('embedding_sample', [0.0]*768)
    
    with torch.no_grad():
        sem_t = torch.tensor([sem_vec], dtype=torch.float32)
        sty_t = torch.tensor([scaled_sty], dtype=torch.float32)
        logit = model(sem_t, sty_t)
        prob = torch.sigmoid(logit).item()
    print(f'{name}: Logit={logit.item():.4f}, Prob={prob:.4f}')
