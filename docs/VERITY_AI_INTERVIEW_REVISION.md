# VERITY AI — Quick Interview Revision & Technical Cheat Sheet

> **Document Type:** High-Yield Technical Interview Revision Guide  
> **Target Audience:** Engineering Interviews, Technical Round 1 & Round 2, System Design Demonstrations  
> **Language / Medium:** Telugu-English Transliteration (Tenglish) with Professional English Interview Answers  
> **Repository:** Modepalli-Ravindra/VERITY_AI  

---

## 1. THE 30-SECOND ELEVATOR PITCH

### Tenglish Conversational Delivery:
> "VERITY AI anedi oka advanced, dual-purpose AI text detection platform. Idi plain text ni matrame chudakunda, deep transformer embeddings (768-dimensional semantic space) ni **20 distinct human writing habits (stylometric features)** tho neural fusion head dwara combine chestundi. Detection tho patu, idi oka **Adversarial Robustness Lab** ni provide chestundi: text ni paraphrase chesinappudu AI signal ela degrade avtundo real-time lo visual ga compare chesi percentage point drop ni calculate chestundi."

### Professional English Interview Response:
> "VERITY AI is an enterprise-grade AI text detection platform and adversarial robustness research system. Instead of relying solely on superficial word distributions, our core engine implements a Neural Feature Fusion architecture that combines deep 768-dimensional transformer embeddings with 20 handcrafted stylometric features. Furthermore, the platform features an interactive Adversarial Lab that quantifies AI signal degradation across multi-tone paraphrasing attacks in real-time."

---

## 2. THE 2-MINUTE SYSTEM ARCHITECTURE EXPLANATION

### Tenglish Conversational Delivery:
> "VERITY architecture multi-layer system:  
> 1. **Frontend:** React 18, TypeScript, and Vite meeda build ayyindi, styled with dark Tailwind CSS. User session handling InsForge BaaS SDK dwara JWT tokens manage chestundi.  
> 2. **Backend API Gateway:** High-performance asynchronous FastAPI framework running on Uvicorn, with SlowAPI rate limiting (20 requests/minute) and Pydantic validation.  
> 3. **Core ML Engine:** Mana primary model **ModernBERT V5** (supported by **DistilRoBERTa V2** as rollback target). Text vachinappudu parallel ga 20 stylometric features extract ayyi scale avtayi, transformer nunchi 768-D embedding extract avtundi. Rendu join ayyi **320-D fusion space** dwara classification head ki pass ayyi calibrated probability compute chestayi.  
> 4. **Resilience & Fault Tolerance:** PyTorch runtime lo memory error or model failure vaste, `ProviderManager` request ni seamless ga external LLM cascade (Google Gemini / Groq) ki proxy chesi 100% uptime ensure chestundi.  
> 5. **Provenance:** Prathi analysis ki one-way SHA-256 cryptographic hash and unique verification ID (`VRTY-YYYYMMDD-HEX`) generate avtundi."

### Professional English Interview Response:
> "Architecturally, VERITY is designed for high reliability and resilience.  
> - **Client Layer:** A responsive React 18 SPA built with Vite and TypeScript, utilizing Tailwind CSS for a modern glassmorphic interface, and the InsForge SDK for client-side JWT lifecycle management.  
> - **API Gateway:** An asynchronous FastAPI service utilizing Uvicorn, SlowAPI rate limiting, and Pydantic request contracts.  
> - **Machine Learning Core:** Powered by a dual-model registry featuring ModernBERT V5 as primary and DistilRoBERTa V2 as a verified rollback target. The pipeline implements Neural Feature Fusion: a 768-dimensional transformer embedding is projected to 256-D, a standardized 20-dimensional stylometric vector is projected to 64-D, concatenated into a 320-dimensional joint space, and evaluated by a feedforward classifier.  
> - **Fault-Tolerance:** An automated provider cascade silently routes requests through external LLMs if the local PyTorch runtime becomes unavailable, preserving API contract integrity.  
> - **Provenance & Persistence:** Analyses are recorded to an InsForge PostgreSQL database and sealed with a SHA-256 digital signature."

---

## 3. CORE ARCHITECTURAL NUMBERS TO MEMORIZE

| Parameter | Exact Value | Where in Codebase? | Why it Matters? |
|---|---|---|---|
| **Semantic Dimension** | **768-D** | `verity_model.py:L12` | Standard hidden embedding output from ModernBERT and DistilRoBERTa |
| **Semantic Projection** | **256-D** | `verity_model.py:L18` | Dimension reduction to prevent semantic features from overwhelming stylometrics |
| **Stylometric Features** | **20-D** | `stylometrics.py:L33` | Handcrafted linguistic features (burstiness, TTR, punctuation frequencies) |
| **Stylometric Projection**| **64-D** | `verity_model.py:L26` | Projected dimension for syntactic writing habits |
| **Joint Fusion Space** | **320-D (256 + 64)** | `verity_model.py:L34` | Exact fused tensor dimension passed to classifier head |
| **Hidden Dense Layer** | **128-D** | `verity_model.py:L36` | Intermediate classification layer with BatchNorm, ReLU, Dropout(0.3) |
| **Final Output Logit** | **1-D** | `verity_model.py:L40` | Single raw output logit converted via Sigmoid to $[0.0, 1.0]$ |
| **V5 Decision Threshold**| **0.70** | `v5_config.py:L14` | Calibrated threshold prioritizing Precision to prevent false accusations |
| **V2 Decision Threshold**| **0.50** | `fusion_model.py:L47` | Standard symmetric binary classification threshold |
| **Min Character Bound** | **50 chars** | `router.py:L63` | Minimum length for reliable statistical stylometrics |
| **Max Character Bound** | **100,000 chars** | `router.py:L65` | Server memory exhaustion and DoS protection bound |
| **Max Document Chunks** | **50 chunks** | `text_chunking.py` | Maximum bounded chunk count for document processing |
| **Upload File Limits** | **10MB, 200 pages** | `document_parser.py` | Resource exhaustion protection for PDF and DOCX uploads |

---

## 4. TOP 10 TECHNICAL INTERVIEW QUESTIONS & MODEL ANSWERS

### Q1: "Why combine Stylometric features with deep Transformer embeddings?"
- **Tenglish:**  
  "Transformers text meaning (semantics) ni baga understand chesukuntayi, kani text paraphrase chesinappudu meaning marchakunda syntactic style alter avvocchu. Stylometrics measures sentence length variation (burstiness), punctuation rhythm, and type-token ratio. Rendu fuse cheyadam valla, model *what* is written tho patu *how* it is written ni chusi, adversarial attacks ni resist chestundi."
- **English:**  
  "While pretrained transformers capture deep semantic context, they are prone to distribution shifts when text is paraphrased. Stylometrics captures domain-agnostic writing habits like burstiness and punctuation rhythm. Fusing semantic embeddings with stylometrics provides an orthogonal feature boundary that significantly increases adversarial robustness."

### Q2: "Why is the decision threshold set to 0.70 for ModernBERT V5 instead of 0.50?"
- **Tenglish:**  
  "Binary classification lo 0.50 standard. Kani AI text detection lo False Positive (oka genuine student essay ni AI ani tappuga accuse cheyyadam) chala catastrophic consequence untundi! 0.70 threshold set cheyadam valla manam high precision ki trade-off chesam. Model ki overwhelming mathematical proof unte thappa 'AI' ani declare cheyyadu."
- **English:**  
  "In text attribution, the penalty for a False Positive is asymmetrical: falsely accusing a student or professional of submitting AI content damages reputation and trust. Setting the threshold at 0.70 heavily optimizes for precision over recall, ensuring the model only emits an AI prediction when evidence is definitive."

### Q3: "In your V2 registry, in-domain F1 is recorded as 1.0. Does this mean your model is 100% accurate?"
- **Tenglish:**  
  "No, absolutely not! HC3 dataset in-domain holdout split meeda F1 1.0 ravadam ante distribution convergence matrame. Real world out-of-domain benchmark (RAID) meeda F1 0.875 and V5 meeda 0.645 untundi. Real world data lo prompt engineering, paraphrasing, and domain shifts untayi kabatti no detection model is 100% perfect."
- **English:**  
  "An in-domain F1 of 1.0 on HC3 indicates successful convergence on that specific distribution, not real-world infallibility. On held-out out-of-domain benchmarks like the RAID perturbation suite, F1 scales to 0.645–0.875. In production, real-world accuracy is always bounded by domain shifts and adversarial rewriting."

### Q4: "How does the backend prevent server crashes if PyTorch fails or runs out of memory?"
- **Tenglish:**  
  "Mana `ProviderManager` class lo fallback cascade mechanism undi. Local PyTorch inference fail aythe, exception catch chesi silently external LLM provider (Google Gemini or Groq) ki request proxy chestundi. Returned response exact identical JSON schema loki format ayyi return avtundi, so frontend eppudu 500 error chudadu."
- **English:**  
  "Our `ProviderManager` orchestrates an automated fallback cascade. If the local PyTorch runtime raises an exception or runs out of GPU/CPU memory, it seamlessly proxies the text to external LLMs (Google Gemini, Groq, or OpenRouter) while preserving the exact API JSON contract, ensuring 100% uptime for the user."

### Q5: "How does your Compare page avoid displaying NaN%?"
- **Tenglish:**  
  "Mana `frontend/src/utils/probability.ts` lo `normalizeProbability` function undi. Missing, null, undefined, strings without numbers, or non-finite numbers ni reject chesi `null` return chestundi. Both original and adversarial scores valid floats aythe thappa delta calculate cheyyadu; lekapothe placeholder `—` chupistundi. Invalid numbers ni blind ga 0 cheyyaledu."
- **English:**  
  "In `frontend/src/utils/probability.ts`, we implement strict boundary validation. We inspect incoming scores for finite bounds, rejecting `NaN`, `Infinity`, and unparseable strings. The comparison engine only computes the delta when both inputs resolve to valid bounded floats; otherwise, it emits a graceful fallback state without silently coercing missing data to zero."

### Q6: "How do you process large documents (PDFs/DOCXs) that exceed the transformer 512 token context limit?"
- **Tenglish:**  
  "Manam `chunk_document_bounded()` dwara document ni bounded character segments (up to 1500 chars, max 50 chunks) ga split chestam. Prathi chunk ni independent ga evaluate chesi, document-level AI probability ni **word-weighted average** dwara calculate chestam:  
  $$P = \frac{\sum (P_i \times W_i)}{\sum W_i}$$"
- **English:**  
  "We implement bounded document chunking in `backend/ml/text_chunking.py`. Large documents are split into up to 50 bounded segments. Each segment is evaluated by the detector, and the final document score is aggregated via a word-weighted average, giving greater statistical importance to substantive sections."

### Q7: "How was the Section 9/24 failure in complex document paraphrasing fixed?"
- **Tenglish:**  
  "Complex documents lo Section 9 formulas (`768 → 256`), markdown tables, and headings unnapudu generative LLM fail aindi. Manam `_is_structural_or_factual()` check create chesam. Structural outlines, tables, and mathematical symbols unte, engine vaatini rewrite cheyyakunda **preserves them intact**, preventing document corruption."
- **English:**  
  "We addressed structural section degradation in `backend/services/llm_providers.py` by introducing `_is_structural_or_factual()`. It identifies markdown tables, bullet hierarchies, and mathematical symbols (e.g. `→`, `≥`, `≤`), preserving those structural sections intact while rewriting narrative prose, ensuring formula and outline integrity."

### Q8: "How do you prevent data leakage during model training?"
- **Tenglish:**  
  "HC3 dataset lo paired human and ChatGPT answers untayi. Manam sample-level split kakunda **Question-Level Split** chesam. Oka question train split lo unte, dani human answer and AI answer rendoo Train lone untayi. Validation and Test splits lo aa question eppudu raadu. Scaler kuda strictly train set meeda matrame fit chesam."
- **English:**  
  "We enforced strict question-level partitioning on HC3. Both the human and AI answers for a given prompt are partitioned exclusively into Train or Validation, eliminating question-prompt contamination. Furthermore, our `SimpleScaler` mean and standard deviation were fit exclusively on training data."

### Q9: "What database does VERITY use and how are audit records stored?"
- **Tenglish:**  
  "VERITY InsForge BaaS (PostgreSQL) use chestundi. Auth `auth.users` handle chestundi. Analyses `analyses` table lo, humanizations `humanizations` table lo, comparisons `comparisons` table lo save avtayi. Offline or guest users kosam user-scoped `localStorage` resilient cache kuda undi."
- **English:**  
  "VERITY utilizes InsForge, a managed PostgreSQL BaaS platform. Authentication is managed via JWT sessions against `auth.users`. Scans, humanizations, and comparisons are persisted to relational tables (`analyses`, `humanizations`, `comparisons`), with a resilient user-scoped client-side fallback cache."

### Q10: "What is the difference between Percentage and Percentage Points in the Compare page?"
- **Tenglish:**  
  "Percentage ante relative change ($\frac{New - Old}{Old}$). Percentage Points ante direct arithmetic subtraction ($New - Old$). If AI probability drops from 90% to 40%, the change is $40 - 90 = -50$ percentage points. Mana UI explicitly 'percentage points' ani chupistundi."
- **English:**  
  "Percentage represents a relative ratio, while percentage points represent the absolute arithmetic difference between two percentages. A drop from 90% to 40% is a 50 percentage point drop (or a 55.5% relative decrease). Our UI explicitly displays 'percentage points' for mathematical precision."

---

## 5. QUICK MENTAL FLASHCARDS

- **ModernBERT Context:** Native 8192 tokens (configured to 512/1024).
- **DistilRoBERTa Context:** 512 tokens.
- **Fusion Space:** 320 dimensions (256-D semantic projection + 64-D stylometric projection).
- **Number of Stylometric Features:** Exactly 20 distinct metrics.
- **Decision Thresholds:** 0.70 for ModernBERT V5, 0.50 for DistilRoBERTa V2.
- **BCEWithLogitsLoss:** Combines Sigmoid activation and Binary Cross Entropy into one numerically stable function.
- **AdamW Optimizer:** Learning rate $1 \times 10^{-4}$, weight decay $0.01$.
- **FastAPI Port:** Default `8000`. Frontend Vite port: `5173`.
- **Database Engine:** InsForge PostgreSQL BaaS via `@insforge/sdk`.

---

*End of Interview Revision Guide.*
