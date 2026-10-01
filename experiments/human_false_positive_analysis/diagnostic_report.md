# VERITY V2 Diagnostic Report: Human False Positives

## Phase 1 & 2: V2 Evaluation on Genuine Human Set
**Threshold:** 0.70
**Total Evaluated Samples:** 1000

* **Correctly Classified Human (True Negatives):** 940
* **False Positives (Incorrectly flagged as AI):** 60
* **Human Recall:** 94.0%
* **Overall Human FPR:** 6.0%

### Breakdown by Diagnostic Buckets:

**By Source:**
* HC3: 24 FPs / 838 total (**2.86% FPR**)
* RAID: 36 FPs / 162 total (**22.22% FPR**)

**By Text Length:**
* Short (<50 words): 2 FPs / 260 total (**0.77% FPR**)
* Medium (50-250 words): 50 FPs / 621 total (**8.05% FPR**)
* Long (>250 words): 8 FPs / 119 total (**6.72% FPR**)

**By Formality / Domain:**
* Formal / Technical (Finance, Medicine, Abstracts, Wiki): 59 FPs / 256 total (**23.05% FPR**)
* Informal / Natural (Reddit ELI5, Open QA): 1 FP / 744 total (**0.13% FPR**)

**By Lexical Diversity (Type-Token Ratio):**
* High TTR (>0.7): 10 FPs / 440 total (**2.27% FPR**)
* Medium TTR (0.5 - 0.7): 43 FPs / 471 total (**9.13% FPR**)
* Low TTR (<0.5): 7 FPs / 89 total (**7.87% FPR**)

**By Sentence Repetition (Variance):**
* Normal Variation: 54 FPs / 760 total (**7.11% FPR**)
* High Repetition / Low Variance: 6 FPs / 240 total (**2.50% FPR**)

---

## Phase 3: Error Analysis of False Positives
For the 60 human texts incorrectly classified as AI, the average stylistic characteristics were:
* **Average Word Count:** 193.2 words
* **Average Type-Token Ratio:** 0.619
* **Average Sentence Length Variance:** 65.4
* **Average AI Prediction Probability:** 0.828 (High confidence failure)

---

## Phase 4 & 5: Decisions & Comparisons

**1. Is the current human false-positive problem mainly concentrated in a particular text length?**
Yes. False positives are heavily concentrated in Medium texts (50-250 words) both by absolute count (50/60) and by rate (8.05%). Short text has almost zero false positives.

**2. Is it concentrated in HC3 or RAID?**
It is intensely concentrated in the RAID subset. Despite HC3 outnumbering RAID 5:1 in this diagnostic set, RAID generated more absolute false positives. The RAID Human FPR is 22.2%, compared to HC3's 2.8%.

**3. Are certain stylometric characteristics associated with false positives?**
Yes. The most overwhelming correlation is with **Formality**. Formal and technical writing (like scientific abstracts and finance texts) suffers a massive **23.05% FPR**, whereas natural internet writing (Reddit) sits at a near-perfect 0.13% FPR. The model incorrectly associates formal tone and structure with AI generation.

**4. Is the existing human data sufficient to attempt V3 training?**
**No.** The existing human data is highly polarized. It contains informal Q&A (HC3) and deeply technical scientific abstracts (RAID), but lacks the "middle ground" of formal non-academic writing (student essays, formal letters, regular technical explanations). Training on this dataset will likely just reinforce the bias that "formal/academic = AI".

**5. Would adding external human datasets likely address a clearly identified gap?**
**Yes.** Injecting external datasets containing genuine student essays, formal letters, and professional non-academic writing would directly attack the 23% Formal FPR gap. It would teach the classifier to separate "formality" from "AI-generation".
