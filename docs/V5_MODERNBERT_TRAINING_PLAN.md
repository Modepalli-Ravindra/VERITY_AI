# V5 ModernBERT Training Plan

## Objective
To train and evaluate an isolated V5 experimental architecture using ModernBERT as the semantic encoder, replacing the previous DistilRoBERTa implementation, while preserving the proven stylometric feature extraction and 320-D fusion architecture.

## Model Architecture
- **Encoder**: ModernBERT-base (`answerdotai/ModernBERT-base`)
- **Semantic Dimension**: 768
- **Semantic Projection**: 768 → 256
- **Stylometric Extraction**: Reuses existing 20-feature extractor
- **Stylometric Projection**: 20 → 64
- **Fusion Dimension**: 320 (256 + 64)
- **Classifier**: Standard VERITY binary classification head

## Datasets
The experiment uses the exact same datasets as V4-B for an apples-to-apples comparison:
- **Training**: `dataset/verity_v2_stage1_train.csv`
- **Validation**: `dataset/hc3/`
- **Evaluation**: `dataset/raid/`, `dataset/asap_2.0/`
- *Note: Exact local paths map to the `dataset/` directory.*

## Training Strategy
- **Environment**: Cloud GPU (e.g., Google Colab A100/T4)
- **Tokenization**: Native ModernBERT tokenizer, Max Sequence Length = 1024 (initially conservative)
- **Pooling**: Masked Mean Pooling yielding a 768-D representation
- **Fine-Tuning Layers**: 
  - Most ModernBERT layers frozen initially.
  - Final few transformer layers unfrozen (LR: ~2e-5).
  - Fusion/Classifier fully trainable (LR: ~1e-4).
- **Optimization**: AdamW, Mixed Precision (AMP), gradient accumulation supported.
- **Loss**: BCEWithLogitsLoss, with class weights if the training split dictates.

## Evaluation Strategy
The evaluation script (`evaluate_v5.py`) sweeps standard thresholds (0.40 - 0.80) to calculate:
- Accuracy, Precision, AI Recall, Human Recall, F1, MCC, AUROC
- False Positive Rates (FPR), including Formal-human, Student-essay, and Paraphrased AI

## Benchmark Strategy
A dedicated benchmark utility (`benchmark_v4_vs_v5.py`) runs both V4-B and V5 sequentially to measure not just predictive performance but also:
- Inference latency
- Memory footprint
- Model size

## GPU Requirements
Training requires CUDA support with mixed precision to handle the 768-D sequence encodings efficiently.

## Expected Artifacts
- Configuration `V5Config.json`
- Model weights (saved to `experiments/v5_modernbert/checkpoints/`)
- Training logs and validation metrics

## Promotion Criteria
V5 is strictly experimental. It will only be promoted to replace V4-B in production if it demonstrates:
- A statistically significant improvement in Accuracy and F1.
- Reduced or comparable False Positive Rate (FPR), specifically for student essays and formal human text.
- Improved robustness to paraphrased AI text.
- Inference latency and memory usage within acceptable limits for the InsForge deployment environment.
