# V5 ModernBERT Architecture

## 1. Why V5 Exists
ModernBERT is being evaluated as an experimental candidate for improving detection performance, robustness and long-context handling. V5 is designed to seamlessly integrate ModernBERT as the new semantic encoder while preserving our existing stylometric feature extraction and fusion mechanics.

## 2. V4-B Remains Production
The current VerityV4Model (DistilRoBERTa + Stylometrics) is and will remain the default production model serving all `/api/analyze` traffic. The introduction of V5 must not affect the default application flow.

## 3. V5 is Experimental
V5 is strictly experimental. It relies on `backend/ml/experimental/verity_v5_model.py` which isolates its dependencies, config, and encoder from the main application.

## 4. V5 Architecture
- **Semantic Encoder**: ModernBERT (`answerdotai/ModernBERT-base`) generating a 768-D vector.
- **Stylometric Features**: Reuses existing 20 features.
- **Semantic Projection**: 768 → 256.
- **Stylometric Projection**: 20 → 64.
- **Fusion**: 320-D representation passed to a classifier.

## 5. Model Registry Concept
A `ModelRegistry` has been introduced to safely route model requests. It guarantees that `get_model("production")` always yields V4-B, while allowing background workers or experimental scripts to explicitly request `get_model("v5")`.

## 6. Training (Future)
Training will happen separately on a cloud GPU. V5 architecture enables saving and loading of trained checkpoints locally without impacting the core codebase.

## 7. Future Benchmark Methodology
When ready, V4-B and V5 will be compared across:
- Accuracy, F1, AI/Human Recall
- False Positive Rates (Formal-human, Student-essay)
- Dataset specific metrics (RAID, HC3)
- Inference latency and Memory footprint

## 8. Promotion Criteria
V5 will only replace V4-B if it demonstrates statistically significant improvements in Accuracy and FPR while remaining within acceptable latency and memory bounds.
