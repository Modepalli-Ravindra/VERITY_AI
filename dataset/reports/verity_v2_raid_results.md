# VERITY V2 — Held-Out RAID Test Results

**Dataset:** Strictly Held-Out RAID Test (20,000 samples)  
**Locked Validation Threshold:** `0.70`

## Overall Metrics
- **Accuracy:** `83.03%`
- **Precision:** `82.43%`
- **Recall:** `83.96%`
- **F1 Score:** `0.8319`
- **MCC:** `0.6607`
- **AUROC:** `0.8700`

## Paraphrase Degradation
- **Original AI Recall:** `0.9318`
- **Paraphrased AI Recall:** `0.9625`
- **Performance Drop:** `-0.0307`

## Attack Breakdown
- **alternative_spelling** (Spelling Attack): Acc `83.75%`, F1 `0.9116`
- **article_deletion** (Lexical Attack): Acc `92.36%`, F1 `0.9603`
- **homoglyph** (Character Attack): Acc `0.00%`, F1 `0.0000`
- **insert_paragraphs** (Formatting Attack): Acc `88.89%`, F1 `0.9412`
- **none** (Original (No Attack)): Acc `93.65%`, F1 `0.9262`
- **number** (Lexical Attack): Acc `86.66%`, F1 `0.9199`
- **paraphrase** (Paraphrase Attack): Acc `41.51%`, F1 `0.4880`
- **perplexity_misspelling** (Spelling Attack): Acc `90.87%`, F1 `0.8802`
- **synonym** (Lexical Attack): Acc `93.78%`, F1 `0.9128`
- **upper_lower** (Character Attack): Acc `95.59%`, F1 `0.9468`
- **whitespace** (Formatting Attack): Acc `93.78%`, F1 `0.9278`

## Generator Breakdown
- **chatgpt**: Acc `100.00%`, F1 `1.0000`
- **cohere**: Acc `99.17%`, F1 `0.9958`
- **cohere-chat**: Acc `99.72%`, F1 `0.9986`
- **gpt2**: Acc `82.65%`, F1 `0.9050`
- **gpt3**: Acc `99.17%`, F1 `0.9958`
- **gpt4**: Acc `100.00%`, F1 `1.0000`
- **human**: Acc `82.10%`, F1 `0.0000`
- **llama-chat**: Acc `90.91%`, F1 `0.9524`
- **mistral**: Acc `78.79%`, F1 `0.8814`
- **mistral-chat**: Acc `90.83%`, F1 `0.9520`
- **mpt**: Acc `50.15%`, F1 `0.6680`
- **mpt-chat**: Acc `85.83%`, F1 `0.9238`
