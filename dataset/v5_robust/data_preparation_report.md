# V5-Robust Data Preparation Report

- **Random Seed**: 42
- **Source Files**:
  - C:\Users\user\OneDrive\Desktop\VERITY\dataset\hc3\all.jsonl
  - C:\Users\user\OneDrive\Desktop\VERITY\dataset\formal\formal_subsets.csv
  - C:\Users\user\OneDrive\Desktop\VERITY\dataset\raid\raid_train_subset.csv
  - C:\Users\user\OneDrive\Desktop\VERITY\dataset\raid\raid_subset.csv

## Leakage Validation Checks
- HC3 Question Overlap (Tr/Val, Tr/Te, Val/Te): 0, 0, 0
- Formal Exact Overlap (Tr/Val, Tr/Te, Val/Te): 0, 0, 0
- RAID Exact Overlap (Tr/Val, Tr/Te, Val/Te): 0, 0, 0 (Filtered initial overlaps: 494)
- Cross-Domain Train/Val Overlap: 837

## Dataset Composition
### Train Set
- Total: 39201
- Human: 21826
- AI: 17375
- HC3: 15002
- Formal: 9199
- RAID: 15000

### Validation Set
- Total: 6312
- Human: 4028
- AI: 2284
- HC3: 5002
- Formal: 1150
- RAID: 1000

### RAID Train Attack Distribution
- synonym: 1590
- insert_paragraphs: 1902
- perplexity_misspelling: 907
- zero_width_space: 615
- article_deletion: 1254
- whitespace: 1866
- alternative_spelling: 1032
- homoglyph: 1911
- none: 1889
- paraphrase: 1357
- number: 677
