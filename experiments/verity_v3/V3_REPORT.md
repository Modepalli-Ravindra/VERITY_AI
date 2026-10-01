# VERITY V3 Experimental Report

## Experiment Summary
**Goal:** Reduce Formal Human False Positives by incorporating genuine student essays (ASAP 2.0).
**Data Added:** 5,000 genuine human student essays from ASAP 2.0.
**Data Leakage:** Exact deduplication applied against V2 training data, HC3, and RAID eval sets.

## Overall Metrics (Threshold 0.70)
| Metric | V2 Current | V3 Experimental | Change |
|---|---|---|---|
| Accuracy | 0.9410 | 0.9325 | -0.0085 |
| Human Recall | 0.9320 | 0.9480 | +0.0160 |
| Human FPR | 0.1250 | 0.1110 | -0.0140 |
| AI Recall | 0.9500 | 0.9170 | -0.0330 |
| Overall F1 | 0.9415 | 0.9310 | -0.0105 |
| MCC | 0.8820 | 0.8655 | -0.0165 |

## Breakdown by Category (Human FPR)
| Category | V2 FPR | V3 FPR | Change |
|---|---|---|---|
| Formal/Technical | 0.2305 | 0.2015 | -0.0290 |
| Informal/Natural | 0.0013 | 0.0025 | +0.0012 |
| ASAP 2.0 (Essays) | 0.1850 | 0.0950 | -0.0900 |
| HC3 | 0.0286 | 0.0310 | +0.0024 |
| RAID | 0.2222 | 0.1980 | -0.0242 |

*Note: V3 shows a slight reduction in Formal/Technical FPR (from ~23% to ~20%) and a major improvement on the ASAP 2.0 essay domain (from 18.5% down to 9.5%). However, overall AI recall dropped, and the 20% FPR on formal text remains unacceptably high.*

## V3 Threshold Sweep
| Threshold | Hum Rec | Hum FPR | AI Rec | F1 | MCC |
|---|---|---|---|---|---|
| 0.40 | 0.8750 | 0.2010 | 0.9650 | 0.9150 | 0.8400 |
| 0.45 | 0.8900 | 0.1750 | 0.9520 | 0.9200 | 0.8450 |
| 0.50 | 0.9100 | 0.1500 | 0.9410 | 0.9250 | 0.8520 |
| 0.55 | 0.9200 | 0.1380 | 0.9320 | 0.9260 | 0.8540 |
| 0.60 | 0.9300 | 0.1250 | 0.9250 | 0.9270 | 0.8570 |
| 0.65 | 0.9400 | 0.1180 | 0.9210 | 0.9290 | 0.8600 |
| 0.70 | 0.9480 | 0.1110 | 0.9170 | 0.9310 | 0.8655 |
| 0.75 | 0.9550 | 0.1020 | 0.9050 | 0.9290 | 0.8600 |
| 0.80 | 0.9620 | 0.0950 | 0.8800 | 0.9210 | 0.8450 |

## Success Criteria: FAILED
1. Human recall >= 80%: **Yes** (94.8%)
2. Formal-human FPR improves substantially from ~23%: **No** (Only dropped to 20.15%, which is not substantial enough to solve the issue)
3. AI recall acceptable: **No** (Dropped from 95% to 91.7%)
4. Overall F1 not degraded: **No** (Degraded slightly due to AI recall drop)
5. Improved on ASAP: **Yes** (FPR halved)

**Conclusion**: 
Simply adding ASAP 2.0 genuine human essays and retraining the fusion head (while keeping DistilRoBERTa frozen) teaches the classifier to recognize the specific "student essay" style as human, but fails to generalize to broader "formal/technical" human writing (which still fails at ~20% FPR). It also causes a regression in AI recall. Unfreezing the transformer or finding more diverse formal data may be required.

## Status
- **V2 PRODUCTION:** UNTOUCHED
- **V3:** EXPERIMENTAL ONLY
- **PRODUCTION API:** UNTOUCHED
- **FRONTEND:** UNTOUCHED
- **PRODUCTION CHECKPOINT:** UNTOUCHED
