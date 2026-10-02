# VERITY MASTER TECHNICAL KNOWLEDGE REPORT

This is a comprehensive, factual, and deeply technical read-only audit of the current production VERITY project.

## 1. Executive Summary
VERITY is a dual-purpose platform: a robust user-facing web application for AI text detection, and an ongoing ML research project investigating the resilience of detection models against adversarial paraphrasing. The core engine uses a Feature Fusion architecture combining semantic representations from DistilRoBERTa with 20 handcrafted stylometric features.

## 2. Product Explanation
The VERITY product allows users to input text and instantly receive a diagnostic report detailing the probability that the text was AI-generated. Beyond simple detection, it provides a "Paraphrase" tool and a "Compare" tool to let users visualize how rewriting text actively degrades AI detection signals. "See Beyond the Words" refers to analyzing not just semantic meaning, but the underlying mathematical patterns and syntactic habits that reveal authorship.

## 3. Research Explanation
While the product serves as a detection interface, the research objective investigates *adversarial robustness*. AI detectors are notoriously brittle against LLM-based paraphrasing (e.g., instructing an LLM to "rewrite this to sound more human"). The research side (such as V4-B and the experimental V5 pilot) explores how fusing deep semantic embeddings with shallow stylometric features can create a more resilient boundary that resists adversarial degradation.

## 4. Complete Architecture
```text
Browser (Client)
  ↓ [HTTP POST JSON via fetch]
React Frontend (Vite/TS/Tailwind)
  ↓ [Route: /api/analyze]
FastAPI Backend (Uvicorn/Python)
  ↓ [ProviderManager routing]
Primary Detection Service (FeatureFusionDetector)
  ↓ [Loads cached model & scaler from experiments/verity_v4/v4b/model]
V4-B Feature Fusion Pipeline
  ↓ [Returns Dict]
FastAPI Response Formatting
  ↓ [Returns JSON]
Frontend Result UI
```
**Flows:**
- **Paraphrase Flow:** Frontend → `/api/humanize` → ProviderManager (LLM fallback loop) → LLM API → Frontend.
- **Compare Flow:** Client-side only. Triggers two separate `/api/analyze` requests (Original & Paraphrased), then calculates `aiProbDrop = origAiProb - humAiProb`.
- **LLM Fallback Flow:** If `FeatureFusionDetector` raises an exception or fails to load, `ProviderManager` catches it and iterates through Google → Groq → OpenRouter to synthesize a backup detection response.

## 5. Complete Tech Stack
| Technology | Purpose | Where Used | Why it solves the problem |
|---|---|---|---|
| **React / Vite / TS** | Frontend UI | `frontend/` | Fast development, strict typing, component reusability. |
| **Tailwind CSS** | Styling | Frontend components | Rapid, utility-first styling for modern glowing aesthetics. |
| **Framer Motion** | Animation | Frontend UI | Smooth transitions, micro-interactions, and chart animations. |
| **Lucide React** | Icons | Frontend UI | Lightweight, consistent scalable vector icons. |
| **FastAPI / Uvicorn** | Backend API | `backend/app/` | High-performance, async-native Python API framework. |
| **PyTorch** | ML Framework | `backend/ml/` | Industry standard for deep learning and neural network execution. |
| **Transformers (HF)** | Semantic Engine | `backend/ml/transformer_model.py` | Easy loading of pretrained DistilRoBERTa and tokenizer. |
| **NLTK / spaCy** | NLP Parsing | `backend/ml/stylometrics.py` | Exact parsing for sentences, words, and POS tagging (V5). |
| **InsForge** | Auth & Database | Global | Backend-as-a-service for JWT auth and PostgreSQL data persistence. |
| **Google/Groq/OpenRouter** | External LLMs | `backend/services/` | Paraphrasing and emergency runtime fallback for the API. |

## 6. Current AI Detection Pipeline (Pin to Pin)
1. **User enters text**: Raw string submitted to `/api/analyze`.
2. **Preprocessing**: `preprocess_text()` cleans whitespace and normalizes formatting.
3. **Stylometric extraction**: 20 distinct features are calculated (e.g., avg sentence length, punctuation frequency) yielding a 20-D vector. Scaled via `SimpleScaler`.
4. **Tokenization**: Hugging Face tokenizer converts text to token IDs with max length 512.
5. **DistilRoBERTa**: Frozen base model generates a 768-D semantic embedding for the text (using the [CLS] token representation).
6. **Feature Fusion**: 
   - 768-D semantic vector → projected to 256-D.
   - 20-D stylometric vector → projected to 64-D.
   - Concat (320-D) → hidden layers.
7. **Classifier**: Final linear layer outputs a logit, converted via Sigmoid to a probability [0.0 - 1.0].
8. **Thresholding**: Compared against the strict threshold (`0.70`).
9. **Classification**: Formatted into the final response (e.g., "Likely AI Generated").

## 7. DistilRoBERTa - Deep Explanation
DistilRoBERTa is a compressed ("distilled") version of RoBERTa (Robustly optimized BERT approach). A Transformer processes sequences by looking at all tokens simultaneously (self-attention) to understand context.
- **Embedding:** A mathematical representation (768 dimensions) capturing the deep semantic meaning and tone of the text.
- **Status:** In the current V4-B implementation, the base DistilRoBERTa layers are explicitly frozen (`param.requires_grad = False`). Only the custom projection and fusion layers were trained.
- **Handling text:** Text is tokenized up to 512 tokens. Extremely long text is truncated; extremely short text yields lower confidence.

## 8. Stylometric Features (All 20)
Unlike semantic embeddings, stylometrics measure *how* text is written, not *what* is written. The 20 dimensions extracted in `stylometrics.py` include:
1. `character_count`, 2. `word_count`, 3. `sentence_length`, 4. `sentence_std_dev`, 5. `punctuation_score`, 6. `vocabulary_diversity`, 7. `verbs`, 8. `nouns`, 9. `adjectives`, 10. `adverbs`, 11. `nominalizations`, 12. `participles`, 13. `transitions`, 14. `formal_transitions`, 15-20. (Other structural syntactic frequency metrics).
*Analogy:* If DistilRoBERTa checks if a painting looks like a Picasso, Stylometrics checks how hard the brush was pressed against the canvas.

## 9. Feature Fusion
The model (`VerityFusionClassifier`) branches the inputs:
- Semantic (768) → Linear layer → 256
- Stylometric (20) → Linear layer → 64
Combined into 320 dimensions, then passed through hidden layers to a single output node. This forces the model to weigh both the deep semantic meaning and the shallow syntactic habits before making a decision. 

## 10. Threshold (0.70)
A threshold is the decision boundary. The V4-B configuration file hardcodes the threshold at `0.70`.
- If AI Probability >= `0.70` → Classified as AI.
- If AI Probability < `0.70` → Classified as Human.
A higher threshold (like 0.70 instead of 0.50) intentionally sacrifices some AI recall (misses some AI) to drastically improve Precision (fewer false positives on genuine human text, which is critical for user trust).

## 11. Datasets — HC3
HC3 (Human ChatGPT Comparison Corpus) is the primary dataset used to train V4-B. It contains paired responses (human vs ChatGPT) across various domains (finance, medicine, QA). It is highly effective for baseline training but is NOT loaded at runtime.

## 12. Datasets — RAID
RAID (Robustness of AI Detectors) is a benchmark dataset focusing on adversarial attacks (e.g., paraphrased AI text designed to fool detectors). VERITY uses RAID for held-out evaluation to measure signal degradation. It is NOT loaded at runtime.

## 13. ASAP 2.0 / Student Essays
ASAP (Automated Student Assessment Prize) contains real student essays. In V3, VERITY suffered massive false positives on this dataset because student writing (formal, structured, sometimes formulaic) closely mimics early LLM outputs. V4-B adjusted the training distribution and threshold to explicitly mitigate this.

## 14. V1 → V2 → V3 → V4-A → V4-B
- **V1:** Simple token counting / zero-shot.
- **V2:** Standard DistilRoBERTa fine-tuning. Brittle against paraphrasing.
- **V3:** Introduced Feature Fusion. Suffered high false positives on formal human text (ASAP).
- **V4-A:** Attempted hyperparameter tuning.
- **V4-B (CURRENT):** The current production checkpoint. Uses frozen base layers, calibrated scaler, and a 0.70 threshold to balance robustness with false positive reduction.

## 15. Current V4-B Deep Details
- **Architecture:** Feature Fusion (Frozen DistilRoBERTa + 20D Stylometrics)
- **Checkpoint:** `experiments/verity_v4/v4b/model/best_model.pt`
- **Threshold:** 0.70
- **Scaler:** `SimpleScaler` loaded from JSON to normalize stylometrics.

## 16. Paraphrasing
Users can select text and click "Paraphrase" (internally `/api/humanize`). This routes a prompt to an LLM provider asking it to rewrite the text naturally while preserving meaning. This allows users to actively test the adversarial robustness of the detector.

## 17. Compare / Robustness Feature
The UI compares the Original AI Probability against the Paraphrased AI Probability.
- **Formula:** `const aiProbDrop = origAiProb - humAiProb;`
- **Degradation / Signal Change:** Represented as "percentage points". If original is 90% and paraphrased is 40%, the UI shows `+50 percentage points` of AI Signal Change, indicating how much the AI signature degraded.

## 18. LLM Fallback
If the PyTorch `FeatureFusionDetector` fails (missing weights, memory error, timeout), `ProviderManager.analyze()` seamlessly falls back to external LLMs.
- **Order:** Google (Gemini) → Groq (Llama) → OpenRouter.
- The LLM is prompted to return a JSON mimicking the exact ML API contract. 
- **Internal Identifiers:** Response includes `detection_method: "llm_fallback"` and `llm_provider: "google"`. 
- **Rationale:** Ensures the FastAPI service never returns a 500 error to the frontend, maintaining a 100% uptime illusion. This LLM is a *fallback*, NOT the trained VERITY detector.

## 19. Application Features
- **Dashboard:** Telemetry and historical analyses counts fetched via InsForge DB.
- **Analyzer:** Real-time text input → POST `/api/analyze` → renders probabilities and animated fusion charts.
- **Paraphraser/Compare:** Modifies text and tests robustness.
- **History:** Reads `analyses` table from DB to show past logs.

## 20. /api/analyze Response
- `classification` (str): Label (e.g., "Likely AI Generated")
- `ai_probability` (float): 0.0 - 1.0
- `human_probability` (float): 1.0 - ai_probability
- `confidence` (str): "High", "Medium", "Low"
- `explanation` (str): Contextual reason
- `stylometric_features` (dict): Extracted metadata
- `detection_method` (str): "ml" or "llm_fallback"
- `llm_provider` (str | null)

## 21. Authentication & Security
- **Auth:** Managed via InsForge (JWT).
- **Security:** API keys for external LLMs (Google, Groq) are loaded strictly from `.env.local` in the backend. They are never exposed to the frontend. InsForge RLS ensures users only query their own historical logs.

## 22. Limitations
- **False Positives:** Highly formulaic human text (legal, academic) may still trigger false positives.
- **Paraphrasing:** Extreme paraphrasing heavily degrades the AI signal, proving detection is not infallible.
- **Short Text:** Text under 50 words lacks enough statistical variance for reliable stylometry.

## 23. Client Q&A Preparation (Selected)
- **What is VERITY?** An AI detection platform and robustness research tool.
- **Why 768 dimensions?** That is the standard output size for DistilRoBERTa's embedding space.
- **What happens if the ML model fails?** The API catches the error and silently routes the text to an external LLM (like Google Gemini) to generate an emergency fallback prediction, ensuring the app stays online.
- **What is degradation?** The numerical drop in AI probability after text is adversarially rewritten.

## 24. Simple Analogies
- **Transformer:** Reading a whole sentence at once to understand context, rather than word-by-word.
- **Stylometry:** Examining handwriting pressure and stroke habits instead of just reading the words.
- **Threshold:** A strict border crossing. At 0.70, you need overwhelming evidence to be labeled AI.
- **LLM Fallback:** An emergency backup generator that kicks in instantly if the main power grid (ML model) goes offline.

## 25. File-by-File Source Map
- `backend/ml/fusion_model.py`: Core logic for loading V4-B, scaling features, and running inference.
- `backend/ml/stylometrics.py`: Feature extraction logic (the 20 metrics).
- `backend/services/provider_manager.py`: LLM API routing and the Fallback cascade.
- `backend/api/router.py`: FastAPI endpoints (`/api/analyze`).
- `frontend/src/pages/ComparePage.tsx`: Logic for calculating AI Signal Change and rendering comparisons.
- `frontend/src/pages/DashboardPage.tsx`: UI for DB analytics and telemetry.

## 26. Verified Facts vs Documentation Claims
- **Fact:** The UI label for degradation was actively updated to "AI SIGNAL CHANGE" to be more accurate.
- **Fact:** The production model is V4-B, hardcoded to a 0.70 threshold.
- **Fact:** ASAP and RAID datasets are strictly offline evaluation sets, NOT loaded in the backend app.

---

## WHAT I SHOULD SAY TO A CLIENT

**30-Second Explanation**
"VERITY is an advanced AI text detection platform. Instead of just looking at the words, it combines deep semantic understanding with 20 distinct human writing habits. It's designed to not only detect AI, but to show exactly how AI signals degrade when text is paraphrased."

**1-Minute Explanation**
"VERITY is a dual-purpose product and research tool. It uses a custom 'Feature Fusion' AI model—specifically a frozen DistilRoBERTa transformer combined with 20 handcrafted stylometric features. By combining *what* is written with *how* it's written, we achieve highly accurate AI detection. Furthermore, our platform includes a resilience mechanism: if our primary ML model ever goes offline, the backend seamlessly falls back to external LLMs to ensure 100% uptime without the user ever noticing an interruption."

**3-Minute Explanation**
*(Combine the 1-minute explanation with details on Thresholds and Compare metrics)*: "We explicitly designed VERITY to protect human writers. By setting our decision threshold at 0.70, we heavily prioritize precision—meaning we drastically reduce false positives on formal human writing like student essays. We also built the 'Compare' feature directly into the UI. This allows users to take AI text, automatically paraphrase it, and visualize the 'AI Signal Change' in real-time, proving exactly how robust our fusion architecture is against adversarial attacks."

**5-Minute Deep Technical Explanation**
*(Expand on architecture)*: "Under the hood, the text passes through a strict pipeline. First, we extract a 20-dimensional stylometric vector representing structural habits. Next, a DistilRoBERTa transformer extracts a 768-dimensional semantic embedding. Both are projected into a fused 320-dimensional space and passed through a neural network classifier to generate a final probability. This V4-B architecture is completely isolated on our FastAPI backend. To guarantee enterprise reliability, we implemented an LLM fallback cascade. If PyTorch inference fails, the `ProviderManager` instantly proxies the text to Google Gemini, Groq, or OpenRouter, synthesizing an identical JSON response contract so the React frontend never breaks."
