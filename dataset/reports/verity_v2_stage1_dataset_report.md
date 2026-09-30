# VERITY V2 Stage 1 Dataset Report

**Date:** 2026-09-28 23:45:13  
**Leakage Audit Status:** `PASSED STRICT ZERO LEAKAGE`

## Dataset Overview
- **Total Stage 1 Samples:** 90,813
- **Human Written Samples (Label 0):** 50,748 (55.9%)
- **AI Generated Samples (Label 1):** 40,065 (44.1%)
- **Held-Out RAID Test Overlap:** 0 (Verified zero leakage)

## Source Breakdown
| Source Dataset | Sample Count | Percentage |
| :--- | :---: | :---: |
| `hc3_finance` | 5,662 | 6.2% |
| `raid_train` | 40,813 | 44.9% |
| `hc3_reddit_eli5` | 38,075 | 41.9% |
| `hc3_wiki_csai` | 1,085 | 1.2% |
| `hc3_open_qa` | 3,408 | 3.8% |
| `hc3_medicine` | 1,770 | 1.9% |

## Generator Model Distribution (RAID Portion)
- **human**: 21,695
- **mistral-chat**: 2,562
- **mistral**: 2,602
- **mpt-chat**: 2,506
- **mpt**: 2,447
- **cohere**: 900
- **gpt3**: 900
- **gpt2**: 2,557
- **llama-chat**: 2,744
- **gpt4**: 600
- **chatgpt**: 700
- **cohere-chat**: 600

## Attack Type Distribution (RAID Portion)
- **number**: 1,800
- **none**: 5,081
- **perplexity_misspelling**: 2,555
- **alternative_spelling**: 2,837
- **homoglyph**: 5,170
- **insert_paragraphs**: 5,278
- **synonym**: 4,277
- **paraphrase**: 3,581
- **article_deletion**: 3,397
- **upper_lower**: 5,071
- **zero_width_space**: 1,766
