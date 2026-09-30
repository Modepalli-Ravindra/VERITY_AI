<div align="center">
  <h1>👁️ VERITY</h1>
  <p><b>See Beyond the Words.</b></p>
  <p><i>An advanced AI-generated text detection and humanization platform featuring transformer semantic representation and stylometric feature fusion.</i></p>
</div>

---

## 📖 Overview

**VERITY** is a premium, full-stack SaaS application designed to accurately detect AI-generated text and optionally paraphrase (humanize) it to read naturally. Built on cutting-edge research in NLP, VERITY moves beyond simple LLM wrappers by utilizing a hybrid approach: **Transformer semantic features + stylometric features + feature fusion + paraphrase-aware robustness evaluation.**

## ✨ Core Features

*   **Advanced AI Text Detection**: Leverages `distilroberta-base` (or DeBERTa) to extract deep semantic representations and classify text as human or AI-generated.
*   **Stylometric Feature Analysis**: Evaluates writing characteristics such as sentence length, vocabulary diversity, Part-of-Speech (POS) distribution, and punctuation patterns.
*   **Text Humanization**: Uses integrated LLM APIs (Google, NVIDIA, Groq, OpenRouter) to paraphrase AI-generated text, improving natural flow while preserving original meaning, facts, and terminology.
*   **Side-by-Side Comparison**: Visually compare original and humanized texts, including probability shifts and word count differences.
*   **History & Analytics**: Save, review, and manage past analyses directly from your authenticated dashboard.
*   **Paraphrase Robustness**: Evaluates detection accuracy even after text has been altered by paraphrasers.
*   **Premium Interface**: A responsive, dark-mode cinematic interface featuring glassmorphism, smooth animations, and high-end SaaS visual hierarchy.

---

## 🏗️ Architecture & Technology Stack

VERITY maintains a strict separation of concerns between its user interface, backend services, and machine learning models.

### Frontend
*   **Framework**: React, Vite
*   **Styling**: Tailwind CSS, Framer Motion (for animations)
*   **Video/Renderings**: Remotion

### Backend API
*   **Framework**: Python, FastAPI
*   **Role**: Handles ML model inference, feature extraction, and orchestrates LLM humanization requests.

### Machine Learning (AI Service)
*   **Transformer Models**: HuggingFace (`distilroberta-base`)
*   **Execution**: Auto-detects and supports both CPU and CUDA.
*   **Pipeline**: Input Text → Preprocessing → Transformer Encoder → Semantic + Stylometric Extraction → Feature Fusion → Classification.

### Database & Authentication
*   **BaaS**: [InsForge](https://insforge.dev)
*   **Features Used**: Postgres database, secure user authentication, role-level security (RLS), and session management.

---

## 🚀 Installation & Setup

### Prerequisites
*   **Node.js** (v16+ recommended)
*   **Python** (3.9+ recommended)
*   **InsForge CLI** configured and linked to a project.

### 1. Environment Configuration
Create a `.env` file in the root of the project (you can copy `.env.example`).
```ini
# Machine Learning
VERITY_TRANSFORMER_MODEL=distilroberta-base

# LLM Providers for Humanization
GOOGLE_API_KEY=your_key_here
NVIDIA_API_KEY=your_key_here
GROQ_API_KEY=your_key_here
OPENROUTER_API_KEY=your_key_here
```
*(Note: InsForge backend keys should be configured via the InsForge CLI and stored in `.env.local`)*

### 2. Backend & ML Model Setup
```bash
# Install Python dependencies
pip install -r backend/requirements.txt

# Pre-download and cache the HuggingFace transformer model (Recommended)
python scripts/setup-model.py

# Start the FastAPI server (Runs on port 8000 by default)
python -m uvicorn backend.app.main:app --port 8000
```
*Note: If the setup script is skipped, the model will automatically download on the first API request.*

### 3. Frontend Setup
```bash
# Navigate to the frontend directory
cd frontend

# Install Node dependencies
npm install

# Start the Vite development server
npm run dev
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

## 🧪 Testing

### End-to-End (E2E) Testing
VERITY includes a suite of E2E tests for the frontend to ensure UI reliability and authentication flows.
```bash
cd frontend
npm run test:e2e
```

### ML Robustness & Evaluation
Scripts for training, evaluating, and diagnosing model accuracy on short texts and paraphrased datasets are located in `backend/ml/` and `scripts/`.

---

## 📜 License & Usage

VERITY is designed for both research and commercial SaaS application. Please ensure compliance with the respective terms of service for any third-party LLM APIs utilized in the humanization pipeline.

*See Beyond the Words.*
