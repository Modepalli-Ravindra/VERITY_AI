<div align="center">
  <h1>👁️ VERITY</h1>
  <p><b>See Beyond the Words.</b></p>
  <p><i>An advanced AI-generated text detection and humanization platform featuring transformer semantic representation and stylometric feature fusion.</i></p>
</div>

## 📚 Technical Documentation & ML Learning Guide

For complete, line-by-line architectural breakdowns, forensic evidence, and Machine Learning fundamentals written in conversational Telugu-English (Tenglish) with standard English terminology:

- 📖 **[VERITY AI Complete Technical Guide](docs/VERITY_AI_COMPLETE_TECHNICAL_GUIDE.md)**: Exhaustive A-to-Z textbook and architectural forensic audit covering all 18 phases:
  - Phase 1: Forensic Evidence & Repository Inventory
  - Phase 2: Project Overview & Core Philosophy
  - Phase 3: Complete Frontend Architecture (React 18, Vite, TypeScript, Tailwind)
  - Phase 4: Backend Engineering & FastAPI Lifecycle
  - Phase 5: Database & Persistence Architecture (InsForge BaaS PostgreSQL)
  - Phase 6: Machine Learning Fundamentals from Absolute Zero
  - Phase 7: Detection Models: ModernBERT V5 vs DistilRoBERTa V2
  - Phase 8: The 20 Stylometric & Linguistic Features Deep Dive
  - Phase 9: Feature Fusion Mathematics (768-D + 20-D → 320-D Joint Space)
  - Phase 10: Training Pipeline, HC3/RAID Datasets & Leakage Prevention
  - Phase 11: Model Evaluation, Metrics & Real-World Accuracy
  - Phase 12: Pin-to-Pin Inference Pipeline Walkthrough
  - Phase 13: Document Intelligence (PDF, DOCX, TXT bounded chunking)
  - Phase 14: Comparison Engine & Adversarial Robustness Lab
  - Phase 15: Paraphrasing, Humanization & Section 9/24 Preservation
  - Phase 16: Complete Audit of All 22 Platform Capabilities
  - Phase 17: Security, Rate Limiting, Redaction & Reliability
  - Phase 18: Technical Glossary (A to Z) & Master Interview Preparation
- ⚡ **[VERITY AI Quick Interview Revision](docs/VERITY_AI_INTERVIEW_REVISION.md)**: High-yield cheat sheet with 30-second and 2-minute elevator pitches, key architectural numbers (768-D + 20-D → 320-D, thresholds 0.70 / 0.50), top 10 technical interview Q&As, and quick mental flashcards.

---

## 📖 Overview

**VERITY** is a premium, full-stack SaaS application designed to accurately detect AI-generated text and optionally paraphrase (humanize) it to read naturally. Built on cutting-edge research in NLP, VERITY moves beyond simple LLM wrappers by utilizing a hybrid approach: **Transformer semantic features + stylometric features + feature fusion + paraphrase-aware robustness evaluation.**

## ✨ Primary Detection Engine & Dual-Engine Architecture
- **Primary Detector: ModernBERT V5**: Powered by `answerdotai/ModernBERT-base` (768-D contextual semantic embeddings with 1024-token sequence context) fused with 20-dimensional syntactic burstiness and stylometric density features into a 320-D classification head (`backend/ml/experimental/model/best_model.pt`, 679 MB).
  - Calibrated Decision Boundary: `0.70` (Empirically tuned to eliminate False Positives).
  - Benchmark Performance: `0.998 F1` on HC3 in-domain dataset; `0.645 F1` on RAID out-of-domain evaluation.
- **Validated Rollback: DistilRoBERTa V2**: Standby fallback engine (`backend/models/verity_detector_v2/best_model.pt`) with calibrated threshold `0.50`, `1.000 F1` in-domain, `0.875 F1` out-of-domain, and `<500ms` CPU latency. Switchable instantly without server restarts.
- **Decoupled LLM Writing Intelligence**: ModernBERT and DistilRoBERTa are classification models, not text-generation engines. Humanization is executed by dedicated external LLM services across 4 calibrated tone profiles (`Natural`, `Professional`, `Academic`, `Casual`) with automatic failover, Retry-After rate-limit management, and 100% document structure preservation.
- **Document Intelligence & Full Text Preservation**: Complete DOCX, PDF, and TXT parsing with magic-byte validation, bounded multi-chunk processing ($\le 50$ evaluation segments), and strict guarantees preserving 100% of extracted text (verified on 7,784-word documents, 57,902 characters without truncation).
- **Verifiable Content Provenance**: SHA-256 document hashing, immutable Verification IDs, signed QR codes, and privacy-safe public verification portal.

---

VERITY maintains strict separation of concerns across its frontend, backend services, and machine learning pipelines.

### Frontend
*   **Framework**: React 18, Vite (Proxy routing `/api` to port 8001)
*   **Styling**: Vanilla CSS, Tailwind CSS, Framer Motion
*   **Aesthetics**: VERITY dark forest-green/black theme (`#0a150c`) with lime sprout accents (`var(--color-lime-sprout)`)

### Backend API
*   **Framework**: FastAPI, Python 3.13 / 3.12 / 3.11, Uvicorn (Port 8001)
*   **ML Engine**: PyTorch, HuggingFace Transformers (`answerdotai/ModernBERT-base`, `distilroberta-base`)
*   **Security & Rate Limiting**: SlowAPI, InsForge JWT Authentication, Zip-bomb / Decompression ratio defense

---

## 🚀 Local Development Workflow

### 1. Environment Configuration
Create `.env` in the repository root:
```ini
# Primary Detection Engine ('modernbert' or 'distilroberta-base')
VERITY_PRIMARY_MODEL=modernbert

# Standby Transformer Model
VERITY_TRANSFORMER_MODEL=distilroberta-base

# Humanization LLM Providers
GOOGLE_API_KEY=your_google_key
GROQ_API_KEY=your_groq_key
OPENROUTER_API_KEY=your_openrouter_key
NVIDIA_API_KEY=your_nvidia_key
```

### 2. Backend Startup (Port 8001)
The Vite frontend dev server proxies all `/api` calls to port `8001`. Always start the backend on port `8001`:
```bash
# Windows (PowerShell / Command Prompt)
.venv\Scripts\python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8001 --reload

# Linux / macOS
source .venv/bin/activate
uvicorn backend.app.main:app --host 127.0.0.1 --port 8001 --reload
```

#### Resolving Port 8001 Conflicts (WinError 10048)
If you see `ERROR: [Errno 10048] error while attempting to bind on address ('127.0.0.1', 8001)`:
```powershell
# 1. Identify the process holding port 8001:
netstat -ano | findstr :8001

# 2. Check the process name using the PID from the last column:
tasklist /FI "PID eq <PID>"

# 3. If stale, terminate the process:
taskkill /F /PID <PID>

# 4. Restart the backend:
.venv\Scripts\python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8001
```

### 3. Frontend Startup
```bash
cd frontend
npm install
npm run dev
# Vite runs at http://localhost:5173 with automatic proxying to backend:8001
```

---

## 🗄️ Database Schema Overview (InsForge)

VERITY utilizes a relational schema to manage user data securely:
*   **`profiles`**: User details and display names.
*   **`analyses`**: Stores original text, AI/Human probabilities, confidence scores, and explanations.
*   **`humanizations`**: Links to `analyses` and stores the re-written text and the model used.
*   **`analysis_features`**: Stores raw stylometric data (sentence length, vocab diversity, POS scores) for deep insights.

*User isolation is strictly enforced via InsForge Row Level Security (RLS) policies.*

---

## 🧪 Testing Suites & Verification

### Complete Backend Automated Test Suite
```bash
# 1. Full Document Humanizer & Regression Suite (7,784 words, chunking, Section 9 fix)
.venv\Scripts\python -m pytest tests/test_full_document_humanizer.py -v

# 2. ModernBERT V5 Architecture & Inference Tests
.venv\Scripts\python -m pytest tests/test_v5_architecture.py tests/test_v5_experimental.py -v

# 3. Document Intelligence (PDF, DOCX, TXT bounded parsing & defenses)
.venv\Scripts\python -m pytest tests/test_document_intelligence.py -v

# 4. Humanizer 2.0 (4 tone profiles, entity preservation, validation bounds)
.venv\Scripts\python -m pytest tests/test_humanizer_v2.py -v

# 5. Security, Auth, Rate Limits & Privacy Redaction Tests
.venv\Scripts\python -m pytest tests/test_security_slice4.py -v
```

### End-to-End (E2E) Browser Testing (Playwright)
```bash
cd frontend
# Run Full Document & Platform E2E Tests
npx playwright test e2e/document_humanizer.spec.ts --project="Desktop Chrome 1440x900"
```

### V5 ModernBERT Kaggle GPU Training Pipeline
To retrain the experimental V5 ModernBERT model on a Kaggle GPU instance:
1. **Setup**: Clone the repo and install dependencies (`transformers`, `torch`, `scikit-learn`, `pandas`).
2. **Strict Deduplication**: Run `verify_raid_split.py` or manually remove overlapping hashes between `dataset/raid/raid_train_subset.csv` and `dataset/raid/raid_subset.csv` to create `dataset/raid/raid_train_clean.csv`.
3. **Training Command**:
```bash
python experiments/v5_modernbert/train_v5.py \
  --train_data dataset/hc3/all.jsonl dataset/raid/raid_train_clean.csv \
  --val_data dataset/hc3/val.jsonl \
  --epochs 3 \
  --batch_size 16 \
  --learning_rate 1e-4 \
  --transformer_learning_rate 2e-5 \
  --max_length 1024 \
  --output_dir backend/ml/experimental/model
```
4. **Evaluation Command**: Evaluate V5 against V2 strictly on untouched validation data:
```bash
python experiments/v5_modernbert/benchmark_v4_vs_v5.py
```
5. **Durable Backup**: Kaggle ephemeral storage will delete your checkpoints. You must download `backend/ml/experimental/model/best_model.pt` and `v5_scaler.json` locally or upload them to a private Hugging Face Model Hub repository. Do not commit large `.pt` checkpoints directly to the GitHub repository.

---

## 📜 License & Usage

VERITY is designed for both research and commercial SaaS application. Please ensure compliance with the respective terms of service for any third-party LLM APIs utilized in the humanization pipeline.

*See Beyond the Words.*
