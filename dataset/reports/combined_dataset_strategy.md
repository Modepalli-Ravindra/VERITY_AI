# VERITY — Combined Dataset Strategy & Partition Architecture

**Date:** 2026-09-28  
**Audit Target:** HC3 (`all.jsonl`) & RAID (`raid_subset.csv`)  
**Status:** Audit Complete — No Model Training Executed  

---

## 1. Executive Summary & Audit Overview

A comprehensive audit was performed across the **HC3** (Human ChatGPT Comparison Corpus) dataset (85,431 samples) and the **RAID** subset (20,000 samples).

| Metric | HC3 Dataset | RAID Subset | Combined Total |
| :--- | :---: | :---: | :---: |
| **Total Text Samples** | 85,431 | 20,000 | **105,431** |
| **Human Samples (Label 0)** | 58,546 | 10,000 | **68,546** |
| **AI Samples (Label 1)** | 26,885 | 10,000 | **36,885** |
| **Sources / Domains** | 5 sources | 1 domain(s) | — |
| **Represented Models** | ChatGPT (GPT-3.5) | 12 models | 12 models |
| **Adversarial Attacks** | Standard generation | 11 attack types | 11 attack types |

---

## 2. Text Length Category Distribution

Samples were categorized using transparent length boundaries:
- **Short:** $< 50$ words
- **Medium:** $50 - 250$ words
- **Long:** $> 250$ words

### Length Breakdown

| Category | HC3 Human | HC3 AI | RAID Human | RAID AI | Total |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Short (<50 words)** | 17,875 | 520 | 1 | 57 | **18,453** |
| **Medium (50-250 words)** | 32,795 | 23,785 | 9,504 | 6,415 | **72,499** |
| **Long (>250 words)** | 7,876 | 2,580 | 495 | 3,528 | **14,479** |

---

## 3. RAID Adversarial Attack Breakdown (AI Samples)

RAID AI samples (10,000 total) represent **11 attack categories**:

| Attack Category | Sample Count | Percentage of AI Pool |
| :--- | :---: | :---: |
| **Original (`none`)** | 1,320 | 13.2% |
| **Whitespace** | 1,320 | 13.2% |
| **Upper / Lower Case** | 1,320 | 13.2% |
| **Synonym Replacement** | 1,000 | 10.0% |
| **Paraphrasing** | 720 | 7.2% |
| **Misspelling (Perplexity)** | 720 | 7.2% |
| **Number Substitution** | 720 | 7.2% |
| **Insert Paragraphs** | 720 | 7.2% |
| **Homoglyph** | 720 | 7.2% |
| **Article Deletion** | 720 | 7.2% |
| **Alternative Spelling** | 720 | 7.2% |

---

## 4. Cross-Dataset Leakage Assessment

- **Exact Matching Texts:** **0** exact overlaps detected between HC3 and RAID.
- **Near-Duplicate Overlaps:** **0** samples share common prefix structures.
- **Leakage Risk Rating:** **LOW**
- **Prevention Strategy:** To prevent data contamination, datasets will **NOT** be blindly merged into a single training bucket.

---

## 5. Recommended Dataset Partition Architecture

### 1. Training Set (`HC3-Train`)
- **Primary Source:** 80% of HC3 dataset (~30,800 samples; ~19,400 Human, ~11,400 AI).
- **Rationale:** HC3 provides clean, paired human vs. ChatGPT responses across multi-domain QA (Reddit ELI5, WikiQA, Medicine, Finance, OpenKBase). It establishes baseline semantic and stylometric decision boundaries.

### 2. Validation Set (`HC3-Val`)
- **Primary Source:** 20% of HC3 dataset (~7,700 samples; ~4,800 Human, ~2,900 AI).
- **Grouping:** Stratified at the question/prompt level so that answers to the same question never appear in both train and validation splits.
- **Rationale:** Provides in-domain hyperparameter tuning and model checkpoint selection without train/val data leakage.

### 3. Held-Out Robustness Test Set (`RAID-Robustness-Test`)
- **Primary Source:** **100% of RAID subset (20,000 samples; 10,000 Human, 10,000 AI)**.
- **Rationale:** RAID contains 11 distinct generative models (e.g. LLaMA-Chat, Mistral, MPT, GPT-4, Cohere) and 11 adversarial attacks (homoglyph, synonym, paraphrase, misspelling, etc.). Holding RAID completely out of the training loop ensures a true, unbiased benchmark of out-of-distribution model performance and adversarial robustness.

---

## 6. Adversarial & Attack Evaluation Protocol

When evaluating the trained VERITY detector against `RAID-Robustness-Test`, performance will be reported across two distinct dimensions:
1. **Model Generalization:** Accuracy & F1 score broken down per generative model (LLaMA-Chat vs Mistral vs GPT-4 vs Cohere vs GPT-2).
2. **Adversarial Robustness:** Detection recall and false negative rate broken down per attack type (Clean vs Paraphrase vs Homoglyph vs Synonym vs Whitespace).
