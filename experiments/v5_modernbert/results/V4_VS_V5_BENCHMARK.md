# V4-B vs V5 ModernBERT Benchmark

## Model Configuration
- **V4-B:** DistilRoBERTa (768) + Stylometric (20) Fusion. Threshold: 0.7
- **V5 ModernBERT:** ModernBERT-base (768) + Stylometric (20) Fusion. Threshold: 0.7, Max Sequence Length: 1024

## Dataset Methodology
- **HC3 Validation**: in-domain (v5)
- **RAID 20K Unseen**: unseen/out-of-domain
- **Formal Human**: in-domain (v5) / formal
- **ASAP 2.0 Essays**: unseen/out-of-domain (human only)

## Overall Results

### HC3 Validation (N=10)
| Metric | V4-B | V5 | Diff |
|---|---|---|---|
| accuracy | 1.0000 | 1.0000 | +0.0000 |
| f1 | 1.0000 | 1.0000 | +0.0000 |
| auroc | 1.0000 | 1.0000 | +0.0000 |
| ai_recall | 1.0000 | 1.0000 | +0.0000 |
| human_recall | 1.0000 | 1.0000 | +0.0000 |
| human_fpr | 0.0000 | 0.0000 | +0.0000 |

### RAID 20K Unseen (N=10)
| Metric | V4-B | V5 | Diff |
|---|---|---|---|
| accuracy | 0.8000 | 0.6000 | -0.2000 |
| f1 | 0.8750 | 0.6667 | -0.2083 |
| auroc | 0.8750 | 0.6250 | -0.2500 |
| ai_recall | 0.8750 | 0.5000 | -0.3750 |
| human_recall | 0.5000 | 1.0000 | +0.5000 |
| human_fpr | 0.5000 | 0.0000 | -0.5000 |

### Formal Human (N=10)
| Metric | V4-B | V5 | Diff |
|---|---|---|---|
| accuracy | 1.0000 | 0.9000 | -0.1000 |
| f1 | 1.0000 | 0.9091 | -0.0909 |
| auroc | 1.0000 | 1.0000 | +0.0000 |
| ai_recall | 1.0000 | 1.0000 | +0.0000 |
| human_recall | 1.0000 | 0.8000 | -0.2000 |
| human_fpr | 0.0000 | 0.2000 | +0.2000 |

### ASAP 2.0 Essays (N=10)
| Metric | V4-B | V5 | Diff |
|---|---|---|---|
| accuracy | 0.7000 | 0.4000 | -0.3000 |
| f1 | 0.0000 | 0.0000 | +0.0000 |
| auroc | nan | nan | +nan |
| ai_recall | 0.0000 | 0.0000 | +0.0000 |
| human_recall | 0.7000 | 0.4000 | -0.3000 |
| human_fpr | 0.3000 | 0.6000 | +0.3000 |

## Robustness Results

## Latency

| Dataset | V4-B Mean (ms) | V5 Mean (ms) | V4-B Throughput | V5 Throughput |
|---|---|---|---|---|
| HC3 Validation | 496.60 | 2918.69 | 2.01 | 0.34 |
| RAID 20K Unseen | 510.29 | 2960.83 | 1.96 | 0.34 |
| Formal Human | 459.36 | 2826.85 | 2.18 | 0.35 |
| ASAP 2.0 Essays | 494.53 | 2968.07 | 2.02 | 0.34 |

## Interpretation
Automated interpretation based on results:
- **Improvements**: Check diff columns in Overall Results.
- **False Positives**: See `human_fpr` differences.
- **Robustness**: Compare AI recall on RAID attacks.

## Production Recommendation
RECOMMENDATION: Keep V4-B as production and continue V5 research. V5 did not sufficiently outperform V4-B on out-of-domain robustness or had unacceptable FPR regressions.
