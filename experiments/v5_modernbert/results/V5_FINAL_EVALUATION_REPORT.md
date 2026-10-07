# VERITY V5 ModernBERT Final Evaluation Report

**Subtitle:** Robust and Lightweight AI-Generated Text Detection Under Paraphrasing and Multi-Level Text Perturbations Using Semantic–Stylometric Feature Fusion

---

## 2. Executive Summary

The V5 ModernBERT model is an experimental evolution of VERITY's V4-B AI-text detector. It integrates the state-of-the-art ModernBERT-base architecture with VERITY's specialized stylometric feature extraction to form a powerful fused representation.

**Key Status:**
- **V4-B remains the production model.**
- **V5 is strictly an experimental research model.**
- V5 uses ModernBERT-base + stylometric feature fusion.
- V5 was trained using the HC3 dataset only.
- The RAID benchmark was used as an unseen/out-of-domain evaluation.
- V5 was **NOT** promoted to production because current evidence does not demonstrate sufficient out-of-domain superiority over V4-B.

---

## 3. V5 Architecture

The architecture relies on a parallel fusion network that combines dense semantic embeddings with handcrafted stylometric features:

**Semantic Branch:**
- Input text
- ↓
- ModernBERT-base (768 hidden dimension)
- ↓
- 768-dimensional semantic representation
- ↓
- 768 → 256 semantic projection

**Stylometric Branch:**
- Input text
- ↓
- 20 stylometric features
- ↓
- 20 → 64 stylometric projection

**Fusion and Classification:**
- 256 (semantic) + 64 (stylometric)
- ↓
- 320-dimensional fused representation
- ↓
- Classifier head
- ↓
- Logit
- ↓
- Sigmoid
- ↓
- AI probability
- ↓
- Threshold = 0.70
- ↓
- AI / Human classification

**Key Specifications:**
- Transformer: ModernBERT-base
- Max Sequence Length: 1024
- Threshold: 0.70

---

## 4. Training Configuration

V5 was trained strictly on the HC3 dataset. 

**Dataset and Split:**
- Dataset: HC3
- Split Strategy: Question-level split
- Train Samples: 68,345
- Validation Samples: 17,057 before runtime duplicate filtering
- Runtime HC3 Validation: 16,070 samples after exact-text duplicate filtering
- Train/Validation Question Overlap: 0
- RAID references in training: 0

**Hyperparameters and Setup:**
- Trainable ModernBERT layers: Final 2 layers (Layers 20–21 trainable, Layers 0–19 frozen)
- Fusion head: Trainable
- Optimizer: AdamW
- Transformer Learning Rate: 2e-5
- Fusion Learning Rate: 1e-4
- Batch Size: 16
- Gradient Accumulation: 4
- Training Epochs: 3
- Max Length: 1024
- Threshold: 0.70
- Hardware: NVIDIA T4 GPU
- Output Checkpoint: `best_model.pt`

**Training Progression:**
- **Epoch 1:** Loss 0.0266 | Acc 0.9966 | Prec 0.9913 | AI Recall 0.9985 | Human Recall 0.9956 | F1 0.9949 | MCC 0.9923 | AUROC 0.9971
- **Epoch 2:** Loss 0.0065 | Acc 0.9980 | Prec 0.9948 | AI Recall 0.9993 | Human Recall 0.9974 | F1 0.9970 | MCC 0.9955 | AUROC 0.9983
- **Epoch 3:** Loss 0.0033 | Acc 0.9979 | Prec 0.9946 | AI Recall 0.9993 | Human Recall 0.9973 | F1 0.9969 | MCC 0.9954 | AUROC 0.9983

---

## 5. HC3 Validation Results

The full HC3 validation pipeline evaluated V5's performance on its strictly in-domain dataset (samples drawn from the same domain as the training set, though the exact questions were held out).

**Samples:** 16,070

| Metric | Value |
|---|---|
| Accuracy | ≈ 99.865% |
| Precision | ≈ 99.649% |
| AI Recall | ≈ 99.926% |
| Human Recall | ≈ 99.837% |
| F1 | ≈ 99.787% |
| MCC | ≈ 99.689% |
| AUROC | ≈ 99.989% |
| Human FPR | ≈ 0.163% |

**Confusion Matrix:**
```text
[[11643, 19],
 [4, 5391]]
```

*IMPORTANT: HC3 is the in-domain validation benchmark because V5 was trained on HC3. This performance cannot and should not be generalized to unseen domains.*

---

## 6. RAID Unseen Benchmark

To test robustness, V5 was evaluated on the RAID benchmark. **RAID was NOT used for V5 training**, making this an unseen/out-of-domain robustness assessment.

**Samples:** 20,000

| Metric | Value |
|---|---|
| Accuracy | 72.72% |
| Precision | 92.17% |
| AI Recall | 49.66% |
| Human Recall | 95.78% |
| F1 | 64.54% |
| MCC | 51.21% |
| AUROC | 77.06% |
| Human FPR | 4.22% |

**Confusion Matrix:**
```text
[[9578, 422],
 [5034, 4966]]
```

**Latency & Throughput:**
- Latency: 34.72 ms/sample (on T4 GPU)
- Throughput: 28.80 samples/sec

**Interpretation:**
- V5 strongly protects human text, maintaining a relatively low Human FPR at 4.22%.
- However, AI Recall drops substantially to 49.66%.
- This demonstrates that unseen transformations and perturbations can significantly weaken the AI signal captured by the model. 
- Therefore, V5 should not be described as fully robust against unseen perturbations.

---

## 7. RAID Dataset Composition

The evaluated RAID benchmark is a sampled 20K balanced subset of the full RAID corpus:
- **10,000 Human texts**
- **10,000 AI texts**

**Attack/Transformation Composition:**
- `none`: 3086
- `whitespace`: 3086
- `upper_lower`: 3086
- `synonym`: 2766
- `paraphrase`: 2486
- `perplexity_misspelling`: 1808
- `number`: 802
- `insert_paragraphs`: 720
- `homoglyph`: 720
- `article_deletion`: 720
- `alternative_spelling`: 720

*Note: This is a sampled 20K benchmark, not the full original RAID dataset.*

---

## 8. V4-B vs V5 Smoke Benchmark

> **Smoke / Sanity Benchmark — Not a statistically significant evaluation**

To establish a side-by-side engineering pipeline sanity check, an N=10 subset per dataset was evaluated identically on both models. *Do not use these N=10 results as final scientific performance metrics.*

**HC3 Validation:**
- V4-B F1 = 1.0000
- V5 F1 = 1.0000

**RAID:**
- V4-B F1 = 0.8750
- V5 F1 = 0.6667
- V4-B AI Recall = 0.8750
- V5 AI Recall = 0.5000
- V4-B Human FPR = 0.5000
- V5 Human FPR = 0.0000

**Formal Human:**
- V4-B F1 = 1.0000
- V5 F1 = 0.9091
- V4-B Human FPR = 0.0000
- V5 Human FPR = 0.2000

**ASAP 2.0:**
- V4-B Accuracy = 0.7000
- V5 Accuracy = 0.4000
- V4-B Human FPR = 0.3000
- V5 Human FPR = 0.6000

**Smoke Benchmark Latency (CPU):**
- V4-B: ~0.46–0.51 seconds/sample
- V5: ~2.83–2.97 seconds/sample

---

## 9. Full Benchmark Limitation

The full four-dataset side-by-side comparison between V4-B and V5 was explicitly **NOT completed locally**. 

**Approximate Available Volumes:**
- ASAP 2.0: ~170,000 samples
- RAID: ~20,000 samples
- HC3 validation: ~13,600 samples
- Formal Human: ~11,571 samples
- **Total:** >215,000 samples

**Explanation:**
- V5 CPU inference is approximately 2.8–3.0 seconds/sample in the local environment.
- A full sequential CPU comparison would take many hours to days to complete, exceeding safe continuous computation limits.
- Therefore, the full 215K side-by-side benchmark was intentionally NOT executed locally. 
- No fabricated full-scale V4-B vs V5 comparison was produced. 
- The N=10 benchmark is explicitly a smoke test.
- Full GPU-scale side-by-side evaluation remains necessary future work.

---

## 10. V4-B vs V5 Interpretation

**Why V4-B Remains in Production:**
1. While V5 has excellent in-domain HC3 performance, it shows substantial degradation on unseen RAID data.
2. V5 RAID AI recall is unacceptably low at 49.66%.
3. The N=10 side-by-side benchmark does not demonstrate V5 superiority.
4. V5 CPU inference is substantially slower than V4-B.
5. Formal and student-essay smoke results do not justify replacing V4-B.

**The Value of V5:**
- V5 demonstrates exceptional learning capacity, achieving extremely strong HC3 validation performance.
- It provides a valid research foundation for further robustness work.
- ModernBERT remains a highly promising backbone if trained with broader, transformation-aware datasets.

---

## 11. Production Decision

**PRODUCTION MODEL:** V4-B
**STATUS OF V5:** Experimental / Research

**Decision:**
> **Keep V4-B as the production detector and continue V5 research.**

V5 should only replace V4-B after a statistically meaningful GPU-based benchmark demonstrates definitive improvement on unseen AI text, paraphrased AI, formal human writing, student essays, human false-positive rates, and latency/resource usage.

---

## 12. Limitations

- **Training Distribution:** V5 was trained on HC3 only. HC3 is in-domain and cannot establish generalization.
- **Unseen Data:** RAID is unseen but is limited here to a 20K sampled benchmark.
- **Benchmark Completion:** The full 215K side-by-side V4-B vs V5 benchmark was not completed; formal and ASAP evaluation remains incomplete at full scale.
- **Compute Constraints:** CPU inference is slow, preventing full-scale sequential runs. The N=10 comparison is only a smoke test.
- **Calibration:** Threshold 0.70 has not been independently optimized for every dataset.
- **Anecdotal Evidence:** One manually written inference example is not a scientific quality metric.

---

## 13. Future Work

1. Execute a GPU-based full V4-B vs V5 benchmark.
2. Train V5 with paraphrase-aware and transformation-aware data.
3. Add formal human hard negatives to the training distribution.
4. Add student essays and diverse human writing.
5. Evaluate unseen LLMs.
6. Evaluate unseen paraphrasers.
7. Optimize V5 inference latency.
8. Perform threshold calibration on a dedicated held-out calibration set.
9. Compare V5 against V4-B using statistically meaningful confidence intervals.
10. Investigate the architectural or distributional reasons why RAID AI recall falls to 49.66%.

---

## 14. Final Conclusion

V5 demonstrates that ModernBERT combined with semantic–stylometric fusion can achieve very strong in-domain AI-text detection performance. However, the unseen RAID benchmark reveals a substantial robustness gap, particularly in AI recall. Therefore, the current evidence does not justify replacing the V4-B production model. V5 should remain an experimental research branch and can serve as the foundation for future robustness-oriented training and evaluation.

---

## 15. Reproducibility

**Training:**
`experiments/v5_modernbert/train_v5.py`

**Evaluation:**
`experiments/v5_modernbert/evaluate_v5.py`

**V4-B vs V5 Smoke Benchmark:**
`experiments/v5_modernbert/benchmark_v4_vs_v5.py`

**Checkpoint (Excluded from Git):**
`backend/ml/experimental/model/best_model.pt`

**Experimental Inference Endpoint:**
`POST /api/experimental/v5/analyze`

**Verification Script:**
`experiments/v5_modernbert/verify_checkpoint.py`
