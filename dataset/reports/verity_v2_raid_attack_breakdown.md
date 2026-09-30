# VERITY V2 RAID Attack-Wise Robustness Report

## Attack Breakdown

| Attack | Category | Total | AI | Human | Acc | Prec | F1 | AI Recall | Human Recall |
|--------|----------|-------|----|-------|-----|------|----|-----------|--------------|
| `alternative_spelling` | Spelling Attack | 720 | 720 | 0 | 83.75% | 100.00% | 0.9116 | **83.75%** | **N/A** |
| `article_deletion` | Lexical Attack | 720 | 720 | 0 | 92.36% | 100.00% | 0.9603 | **92.36%** | **N/A** |
| `homoglyph` | Character Attack | 720 | 720 | 0 | 0.00% | 0.00% | 0.0000 | **0.00%** | **N/A** |
| `insert_paragraphs` | Formatting Attack | 720 | 720 | 0 | 88.89% | 100.00% | 0.9412 | **88.89%** | **N/A** |
| `none` | Original (No Attack) | 3086 | 1320 | 1766 | 93.65% | 92.07% | 0.9262 | **93.18%** | **94.00%** |
| `number` | Lexical Attack | 802 | 720 | 82 | 86.66% | 99.84% | 0.9199 | **85.28%** | **98.80%** |
| `paraphrase` | Paraphrase Attack | 2486 | 720 | 1766 | 41.51% | 32.69% | 0.4880 | **96.25%** | **19.20%** |
| `perplexity_misspelling` | Spelling Attack | 1808 | 720 | 1088 | 90.87% | 92.24% | 0.8802 | **84.17%** | **95.31%** |
| `synonym` | Lexical Attack | 2766 | 1000 | 1766 | 93.78% | 92.59% | 0.9128 | **90.00%** | **95.92%** |
| `upper_lower` | Character Attack | 3086 | 1320 | 1766 | 95.59% | 97.82% | 0.9468 | **91.74%** | **98.47%** |
| `whitespace` | Formatting Attack | 3086 | 1320 | 1766 | 93.78% | 92.09% | 0.9278 | **93.48%** | **94.00%** |

## Paraphrase Robustness (Original vs Paraphrased AI)
- **Original AI Recall:** `93.18%`
- **Paraphrased AI Recall:** `96.25%`
- **Difference:** Paraphrasing changed recall by `-3.07%` (Note: Negative means paraphrasing actually *increased* detection rates).

## Homoglyph Attack Analysis
The distilroberta-base BPE tokenizer operates on byte-level characters but maps visually identical homoglyphs (e.g., Cyrillic 'а' instead of Latin 'a') to entirely different, often out-of-vocabulary or rare subword tokens. Because the Stage 1 training data did not contain these specific adversarial token patterns, the frozen transformer produced out-of-distribution embeddings, causing the linear fusion head to default to negative (Human). Additionally, the text_preprocessing.py pipeline does not include Unicode NFKC normalization or confusable-character mapping to revert these homoglyphs back to standard Latin characters.
