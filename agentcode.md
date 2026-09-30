# VERITY --- Full Application Build Instructions for Antigravity

## 0. IMPORTANT --- INSFORGE SETUP

Before starting application development, configure InsForge as the
backend.

**PASTE THE INSFORGE CLI/API KEY ON THIS LINE:**

`INSFORGE_API_KEY = PASTE_YOUR_INSFORGE_API_KEY_HERE`

Use the key only through the InsForge CLI/environment as required. Never
hardcode or expose it in frontend source code, commits, logs,
screenshots, or API responses.

Run the InsForge setup according to the official CLI instructions
already provided:

``` bash
npx @insforge/cli login --user-api-key uak_nrHpnTjyZqB6e5ocJ9wSk-GN2W27jmkNsVnybJ44A24
npx @insforge/cli create
```

If this directory is already linked to an InsForge project, use the
appropriate link command instead.

After setup: 1. Read `AGENTS.md`. 2. Follow the InsForge CLI skill for
backend infrastructure. 3. Follow the InsForge app-code skill for
application code. 4. Verify the generated/configured InsForge backend
before continuing. 5. Do not replace InsForge with MySQL, SQLite,
Firebase, Supabase, or another database.

------------------------------------------------------------------------

# 1. PROJECT

Build a complete production-style web application named:

**VERITY**

Tagline:

**See Beyond the Words.**

VERITY is an AI-generated text detection and humanization application.

The application should allow a user to:

-   Create an account and sign in.
-   Paste or enter text.
-   Detect whether the text is AI-generated or human-written.
-   Show an AI probability percentage.
-   Show a human probability percentage.
-   Provide a confidence indicator.
-   Show a concise explanation of the detection result.
-   Analyze writing/stylometric characteristics.
-   Humanize/rewrite AI-generated text using an LLM.
-   Re-check the humanized text.
-   Compare original and humanized versions.
-   Save analysis history.
-   View previous analyses.
-   Delete history items.
-   Access only their own saved data.

The AI detector should follow the project's research direction:

**Transformer semantic features + stylometric features + feature
fusion + paraphrase-aware robustness evaluation.**

The existing research document describes RoBERTa/DeBERTa for semantic
representation, stylometric features such as sentence length, vocabulary
diversity, POS and punctuation, feature fusion, paraphrase-aware
training, and robustness testing.

Do not reduce the project to a simple LLM API wrapper.

------------------------------------------------------------------------

# 2. EXISTING PROJECT FILES

The project root currently contains:

-   `.env`
-   `ui.png`

`ui.png` is the approved visual reference for the landing-page
direction.

Use the attached UI reference image as the primary visual inspiration.

The `.env` already contains API keys for:

-   `GOOGLE_API_KEY`
-   `NVIDIA_API_KEY`
-   `GROQ_API_KEY`
-   `OPENROUTER_API_KEY`

Do not expose any of these keys in frontend code.

Do not print them in logs.

Do not commit them.

Use environment variables only.

Do not replace working keys with hardcoded values.

------------------------------------------------------------------------

# 3. VISUAL DESIGN --- VERY IMPORTANT

The application must feel like a premium modern SaaS product.

Use the provided `ui.png` as the visual reference.

Do NOT create a generic "AI generated website".

Design language:

-   Dark cinematic interface
-   Near-black background
-   Purple/lavender accent
-   Subtle blue-violet ambient glow
-   Premium glassmorphism
-   Thin borders
-   Soft shadows
-   Large editorial typography
-   Strong whitespace
-   Minimal interface
-   Elegant gradients
-   Subtle grain/noise
-   Smooth scroll animations
-   High-end SaaS visual hierarchy
-   Refined micro-interactions
-   Minimal icons
-   Premium cards
-   Subtle hover states
-   No excessive neon
-   No cartoon graphics
-   No unnecessary 3D everywhere
-   No template-looking sections

The visual identity must remain consistent across:

-   Landing page
-   Login
-   Sign up
-   Dashboard
-   Analyzer
-   Results
-   Humanizer
-   Compare
-   History
-   Profile/settings
-   Loading states
-   Empty states
-   Error states

Use the same typography, spacing system, borders, radii, shadows and
color tokens everywhere.

------------------------------------------------------------------------

# 4. RESPONSIVENESS

Responsiveness is mandatory.

The application must work properly on:

### Desktop / Laptop

-   1440px
-   1280px
-   1024px

### Tablet

-   768px
-   820px
-   1024px

### Mobile

-   390px
-   414px
-   430px
-   360px

Do not simply shrink desktop layouts.

Create proper responsive layouts.

Requirements:

-   Responsive navbar
-   Mobile navigation menu
-   Responsive hero
-   Responsive glass cards
-   Responsive text editor
-   Responsive result charts
-   Responsive dashboard sidebar
-   Responsive tables
-   Responsive comparison view
-   Responsive modals
-   Touch-friendly buttons
-   No horizontal overflow
-   No clipped text
-   No overlapping elements
-   No broken charts
-   No tiny unreadable text
-   Maintain visual hierarchy on small screens

Test every major page at mobile, tablet and desktop widths.

------------------------------------------------------------------------

# 5. TECHNOLOGY

Use:

-   React
-   Vite
-   Tailwind CSS
-   Framer Motion
-   Remotion (https://www.remotion.dev)
-   InsForge backend
-   InsForge authentication
-   InsForge database/storage capabilities where appropriate
-   Python FastAPI for the AI/ML service
-   Transformer model for AI-text detection
-   Stylometric feature extraction
-   LLM API for humanization/paraphrasing

Do NOT use Fastify.

Do NOT add unnecessary backend frameworks.

Do NOT replace the existing technology choices without a strong
technical reason.

Keep frontend and AI/ML responsibilities cleanly separated.

------------------------------------------------------------------------

# 6. AUTHENTICATION

Implement complete authentication using InsForge.

Required:

-   Sign Up
-   Login
-   Logout
-   Session persistence
-   Protected routes
-   Redirect unauthenticated users to login
-   Redirect authenticated users to dashboard
-   Auth loading state
-   Invalid credentials handling
-   Registration validation
-   Password validation
-   User session handling

Never store passwords manually in the application database.

Use InsForge's authentication functionality.

------------------------------------------------------------------------

# 7. DATABASE

Use InsForge as the application's backend/database.

Create a clean schema for the application.

Suggested logical entities:

## profiles

-   id
-   user_id
-   display_name
-   created_at
-   updated_at

## analyses

-   id
-   user_id
-   original_text
-   ai_probability
-   human_probability
-   classification
-   confidence
-   explanation
-   model_used
-   word_count
-   character_count
-   created_at

## humanizations

-   id
-   user_id
-   analysis_id
-   original_text
-   humanized_text
-   model_used
-   created_at

## analysis_features

-   id
-   analysis_id
-   sentence_length
-   vocabulary_diversity
-   punctuation_score
-   pos_features
-   stylometric_summary
-   created_at

Use the exact InsForge-supported schema/API patterns from `AGENTS.md`
and the InsForge skill.

Every user-specific record must be associated with the authenticated
user's ID.

Users must never be able to read another user's history.

------------------------------------------------------------------------

# 8. APPLICATION ROUTES

Create a clean route structure.

Public:

-   `/`
-   `/login`
-   `/signup`

Protected:

-   `/dashboard`
-   `/analyze`
-   `/humanize`
-   `/compare`
-   `/history`
-   `/settings`

Optional:

-   `/pricing`
-   `/about`

The landing page should be accessible without login.

Analyzer functionality should require authentication.

------------------------------------------------------------------------

# 9. LANDING PAGE

Build a premium landing page based strongly on `ui.png`.

## Navbar

Left:

**VERITY**

Navigation:

-   Home
-   Features
-   How It Works
-   Pricing
-   About

Right:

-   Theme control if implemented
-   Sign In
-   Get Started

On mobile:

-   Hamburger menu
-   Smooth mobile drawer
-   Clear CTA

------------------------------------------------------------------------

## Hero

Headline:

**See Beyond\
the Words.**

Highlight:

**Words.**

Use the purple/lavender accent.

Supporting text:

**Detect AI-generated text, understand its patterns, and humanize it
naturally.**

Buttons:

**Try It Now**

**Watch Demo**

Hero visual:

Create premium floating glass analysis cards.

Example:

**AI Generated**\
87%

and

**Human Written**\
13%

These values are visual/demo values only on the landing page.

Do not present them as real product statistics.

Use an abstract cinematic background inspired by the reference.

------------------------------------------------------------------------

# 10. PRODUCT PREVIEW SECTION

Create an interactive-looking analyzer preview.

Tabs:

-   Detect
-   Humanize
-   Compare

Text editor:

"Paste your text here to check whether it is AI-generated or
human-written..."

Show:

-   Character count
-   Word count
-   Clear
-   Analyze

Right-side information:

-   AI Detection
-   Detailed Analysis
-   Humanization
-   Privacy

The preview should look like a real product interface, not a static
marketing screenshot.

------------------------------------------------------------------------

# 11. FEATURES

Section heading:

**More Than Just Detection.**

Feature cards:

### AI Detection

Detect AI-generated and human-written text.

### Text Humanization

Rewrite text naturally using an LLM.

### Detailed Analysis

Show probability, confidence and writing-style evidence.

### History & Save

Save and revisit previous analyses.

### Paraphrase Robustness

Evaluate detection after rewriting/paraphrasing.

### Cross-Model Evaluation

Allow the research backend to evaluate different model-generated text
where supported.

------------------------------------------------------------------------

# 12. HOW IT WORKS

Heading:

**Simple. Fast. Reliable.**

Four steps:

01 --- Paste Text\
02 --- Analyze\
03 --- Understand the Result\
04 --- Humanize

Create a premium timeline with subtle animated nodes.

------------------------------------------------------------------------

# 13. DASHBOARD

After login, show a premium dashboard.

Dashboard should contain:

-   Sidebar
-   Overview
-   New Analysis button
-   Recent analyses
-   AI detection summary
-   Humanization usage
-   Recent history
-   Quick actions

Mobile:

Sidebar becomes a drawer/bottom navigation style where appropriate.

------------------------------------------------------------------------

# 14. ANALYZER PAGE

Main workspace:

Left/main area:

-   Large text editor
-   Character count
-   Word count
-   Clear
-   Analyze button

Optional right panel:

-   AI probability
-   Human probability
-   Classification
-   Confidence
-   Key signals
-   Stylometric summary

Use loading animation while analyzing.

Do not freeze the entire UI.

------------------------------------------------------------------------

# 15. RESULT EXPERIENCE

After analysis, show a polished result card.

Example structure:

### Result

**Likely AI Generated**

AI Probability:

**87%**

Human Probability:

**13%**

Confidence:

**High**

Then show:

### Why?

Concise explanation based on the actual detector output.

Then:

### Writing Signals

-   Sentence structure
-   Vocabulary diversity
-   Punctuation patterns
-   POS distribution
-   Other stylometric indicators

Do not invent evidence.

Only show values returned by the backend.

------------------------------------------------------------------------

# 16. HUMANIZER

The Humanize page should contain:

Left:

Original text

Right:

Humanized text

Actions:

-   Humanize
-   Copy
-   Download
-   Re-check

Use the LLM APIs from `.env`.

Implement a provider abstraction so the backend can select a configured
provider.

Possible providers from the available environment keys:

-   Google
-   NVIDIA
-   Groq
-   OpenRouter

Do not expose API keys to the browser.

The humanizer prompt should preserve:

-   Original meaning
-   Important facts
-   Numbers
-   Names
-   Citations
-   Technical terminology

It should primarily modify wording, sentence flow and stylistic
patterns.

Do not claim that humanization guarantees bypassing every AI detector.

------------------------------------------------------------------------

# 17. COMPARE PAGE

Create a premium side-by-side comparison:

### Original

Original text

### Humanized

Humanized text

Show:

-   Original AI probability
-   Humanized AI probability
-   Difference
-   Word count difference
-   Character count difference

Add a clear visual comparison.

Mobile should switch to stacked cards.

------------------------------------------------------------------------

# 18. HISTORY PAGE

Display saved analyses.

Each item:

-   Date
-   Short text preview
-   AI probability
-   Classification
-   Model
-   Actions

Actions:

-   Open
-   Re-analyze
-   Humanize
-   Delete

Include:

-   Search
-   Filter
-   Empty state
-   Loading state
-   Error state

All data must come from the authenticated user's InsForge records.

------------------------------------------------------------------------

# 19. SETTINGS

Include:

-   Profile
-   Display name
-   Account information
-   Appearance
-   Session/logout
-   Basic preferences

Do not expose secret API keys.

------------------------------------------------------------------------

# 20. AI/ML ARCHITECTURE

The actual detector should be designed around:

**Input Text**

↓

**Preprocessing**

↓

**Transformer Encoder**

RoBERTa / DeBERTa

↓

**Semantic Representation**

-   

**Stylometric Feature Extraction**

Examples:

-   Sentence length
-   Word length
-   Vocabulary diversity
-   POS distribution
-   Punctuation
-   Word-level statistics

↓

**Feature Fusion**

↓

**Classifier**

↓

**AI / Human / Uncertain**

↓

**Probability + Confidence + Explanation**

Keep the model service isolated from the frontend.

------------------------------------------------------------------------

# 21. PARAPHRASE-AWARE TRAINING

The research direction requires:

Original AI text

-   

Paraphrased AI text

→ same AI label.

Support transformation levels:

-   None
-   Light
-   Medium
-   Strong
-   LLM paraphrase
-   Layered perturbation

The system should allow robustness experiments later.

------------------------------------------------------------------------

# 22. ROBUSTNESS METRICS

Backend/research code should support:

-   Accuracy
-   Precision
-   Recall
-   F1
-   MCC
-   AUROC

Important metric:

**Performance Drop = F1(original) − F1(paraphrased)**

Do not hardcode research results.

------------------------------------------------------------------------

# 23. IMPORTANT RESEARCH HONESTY

Do not claim:

-   100% AI detection
-   Perfect accuracy
-   Guaranteed AI detection
-   Guaranteed humanization
-   Guaranteed detector bypass
-   Fake production statistics

The UI can show demo values on marketing sections, but label them as
illustrative where necessary.

Real analyzer results must come from the actual backend/model.

------------------------------------------------------------------------

# 24. API DESIGN

Create clean API boundaries.

Suggested endpoints:

### Auth

Handled by InsForge.

### Analysis

`POST /api/analyze`

Input:

``` json
{
  "text": "..."
}
```

Output:

``` json
{
  "classification": "AI",
  "ai_probability": 0.87,
  "human_probability": 0.13,
  "confidence": 0.91,
  "explanation": "...",
  "stylometric_features": {}
}
```

### Humanize

`POST /api/humanize`

Input:

``` json
{
  "text": "...",
  "provider": "..."
}
```

Output:

``` json
{
  "humanized_text": "...",
  "provider": "..."
}
```

### Recheck

`POST /api/recheck`

Input:

``` json
{
  "text": "..."
}
```

### History

Use InsForge directly according to the official skill/API patterns.

Do not invent unsupported InsForge APIs.

------------------------------------------------------------------------

# 25. ERROR HANDLING

Every API request needs:

-   Loading state
-   Success state
-   Error state
-   Retry option where appropriate

Handle:

-   Empty text
-   Text too long
-   API timeout
-   Model unavailable
-   Invalid provider
-   Authentication expiry
-   Database failure
-   Network failure

Show user-friendly error messages.

Never expose stack traces or API secrets.

------------------------------------------------------------------------

# 26. PERFORMANCE

Optimize for a smooth experience.

Requirements:

-   Lazy-load heavy components
-   Avoid unnecessary API calls
-   Debounce where appropriate
-   Show skeleton loaders
-   Keep animations GPU-friendly
-   Avoid excessive blur effects
-   Avoid huge unnecessary dependencies
-   Do not block the main UI during long analysis
-   Cache appropriate UI state

------------------------------------------------------------------------

# 27. ACCESSIBILITY

Include:

-   Keyboard navigation
-   Visible focus states
-   Semantic buttons
-   Proper labels
-   Sufficient contrast
-   Accessible forms
-   ARIA labels where needed

------------------------------------------------------------------------

# 28. ANIMATIONS

Use Framer Motion.

Animation style:

-   Smooth
-   Slow enough to feel premium
-   Subtle
-   Purposeful

Use:

-   Fade
-   Slide
-   Scale
-   Blur-to-clear
-   Staggered cards
-   Hover elevation
-   Scroll reveal

Avoid:

-   Excessive bouncing
-   Constant floating elements
-   Distracting animations
-   Overuse of neon glow

------------------------------------------------------------------------

# 29. CODE QUALITY

Use:

-   Reusable components
-   Clear folder structure
-   Centralized API utilities
-   Environment configuration
-   Type-safe patterns where appropriate
-   Consistent naming
-   Small maintainable components

Do not create one giant component.

Do not duplicate UI unnecessarily.

Do not modify working business logic without reason.

------------------------------------------------------------------------

# 30. SECURITY

Mandatory:

-   Never expose API keys in frontend JavaScript
-   Never expose `.env` values to users
-   Never commit secrets
-   Validate backend input
-   Authenticate protected APIs
-   Authorize user-owned records
-   Sanitize/validate text inputs
-   Do not log secrets
-   Do not store passwords manually

------------------------------------------------------------------------

# 31. BUILD ORDER

Follow this order:

### Phase 1

Inspect the existing project.

### Phase 2

Set up InsForge.

### Phase 3

Read `AGENTS.md` and follow the InsForge skills.

### Phase 4

Set up authentication.

### Phase 5

Create database schema.

### Phase 6

Create backend/API structure.

### Phase 7

Create AI detector service structure.

### Phase 8

Integrate Transformer + stylometric pipeline.

### Phase 9

Integrate LLM humanization.

### Phase 10

Build landing page.

### Phase 11

Build authentication pages.

### Phase 12

Build dashboard.

### Phase 13

Build analyzer.

### Phase 14

Build result page.

### Phase 15

Build humanizer.

### Phase 16

Build compare.

### Phase 17

Build history.

### Phase 18

Build settings.

### Phase 19

Connect real backend data.

### Phase 20

Test responsive layouts.

### Phase 21

Test authentication/security.

### Phase 22

Run production build.

------------------------------------------------------------------------

# 32. FINAL QUALITY CHECK

Before declaring the application complete, verify:

-   Landing page matches `ui.png` design direction.
-   Desktop layout works.
-   Tablet layout works.
-   Mobile layout works.
-   Sign up works.
-   Login works.
-   Logout works.
-   Protected routes work.
-   InsForge database works.
-   User isolation works.
-   Text analysis works.
-   AI probability works.
-   Human probability works.
-   Stylometric analysis works.
-   Humanization works.
-   Re-check works.
-   Compare works.
-   History works.
-   Delete history works.
-   Loading states work.
-   Error states work.
-   No API key is exposed.
-   No horizontal overflow.
-   No console errors.
-   Production build succeeds.

Do not stop after generating only the UI.

Build the complete application end-to-end while preserving the project's
existing functionality.

The final result should feel like a real premium product called
**VERITY**, not a college-project template.

------------------------------------------------------------------------

# 33. REMOTION AGENT SKILL

Use Remotion as an optional visual/motion layer for VERITY.

Reference:
https://www.remotion.dev

Before implementing Remotion-based features:
1. Read the official Remotion documentation and Agent Skills.
2. Install/use the Remotion skill according to the current official instructions.
3. Do not replace React/Tailwind/Framer Motion with Remotion for normal website UI.
4. Use Remotion only where programmatic video or advanced motion graphics provide real value.

Use Remotion for:
- VERITY product demo video
- "Watch Demo" experience
- AI detection visualization
- Animated text-analysis sequences
- Product walkthroughs
- Premium cinematic motion graphics
- Optional marketing/demo videos

Keep the main application architecture unchanged:
React + Vite + Tailwind CSS + Framer Motion + InsForge + FastAPI.

Do not introduce Remotion into the core analyzer, authentication, database, or AI detection logic.

If Remotion Agent Skills are available, configure them and use them according to the official documentation.

------------------------------------------------------------------------

# VERITY — AGENT SKILLS SETUP & FULL BUILD

You are working on the VERITY project.

Before modifying or building the application, inspect the existing project files, `agentcode.md`, `ui.png`, `.env`, and any existing `AGENTS.md`.

Do NOT overwrite or remove existing working functionality.

---

## 1. FIRST: CONFIGURE THE REQUIRED AGENT SKILLS

Use the official/current documentation for each skill.

Install/configure only the skills that are actually useful for this project.

### REQUIRED

#### InsForge
Use InsForge for:
- Authentication
- Database
- User profiles
- Analysis history
- Humanization history
- User-specific data access
- Backend infrastructure

Follow the existing InsForge setup instructions in `agentcode.md` and `AGENTS.md`.

Do not replace InsForge with Firebase, Supabase, MySQL or SQLite.

---

#### Remotion

Use Remotion only for:
- VERITY product demo
- Watch Demo experience
- Cinematic product walkthrough
- AI detection animation
- Humanization animation
- Marketing/demo video

Do NOT use Remotion for normal website UI.

Use the official Remotion Agent Skills and documentation.

If the official skill installation is required, install it using the currently documented method.

---

#### Frontend / UI

Use the appropriate frontend/UI skill for:

- Premium SaaS UI
- Responsive layouts
- Accessibility
- Design consistency
- Modern React patterns
- Mobile/tablet/desktop layouts
- Performance

The attached `ui.png` is the primary visual reference.

Do not create a generic AI-generated website.

---

#### Chrome DevTools / Browser Testing

Use the appropriate browser/Chrome DevTools skill for:

- Testing the actual application
- Checking console errors
- Testing authentication flows
- Testing API requests
- Testing responsive layouts
- Checking mobile/tablet/desktop behavior
- Debugging UI problems
- Checking network failures
- Performance inspection

Test at minimum:

Desktop:
1440px
1280px
1024px

Tablet:
1024px
820px
768px

Mobile:
430px
414px
390px
360px

Fix issues discovered during testing.

---

#### Security

Use the appropriate security/code-review skill.

Pay special attention to:

- API key exposure
- `.env`
- Authentication
- Authorization
- Protected routes
- User data isolation
- InsForge database permissions
- Backend validation
- API input validation
- Secret leakage
- Client-side exposure of provider keys

Never expose:

GOOGLE_API_KEY
NVIDIA_API_KEY
GROQ_API_KEY
OPENROUTER_API_KEY
INSFORGE credentials

in frontend source code.

---

#### Testing

Use the appropriate testing skill for:

- Authentication
- Protected routes
- Analyzer API
- Humanization API
- Database operations
- History
- Delete operations
- Error states
- Responsive UI

Do not stop after the UI visually works.

Test actual functionality.

---

## 2. AI / ML

Use appropriate Python/ML/Transformer practices for the AI detector.

The detector should follow the project's research architecture:

Text
↓
Preprocessing
↓
Transformer semantic representation
+
Stylometric features
↓
Feature Fusion
↓
Classifier
↓
AI / Human / Uncertain
↓
Probability + Confidence + Explanation

Transformer:

RoBERTa or DeBERTa

Stylometric features include:

- Sentence length
- Word length
- Vocabulary diversity
- POS
- Punctuation
- Word-level statistics

The detector should NOT simply call an LLM and ask:

"Is this AI generated?"

The actual detection architecture should remain an ML-based detector.

---

## 3. LLM PROVIDERS

The existing `.env` contains:

GOOGLE_API_KEY
NVIDIA_API_KEY
GROQ_API_KEY
OPENROUTER_API_KEY

Use these only from the backend/server side.

Create a provider abstraction so VERITY can use an available configured LLM provider for:

- Humanization
- Paraphrasing
- Optional explanation assistance where appropriate

Do not expose provider keys to React.

Do not hardcode API keys.

Do not print API keys in logs.

---

## 4. CORE VERITY USER FLOW

Implement this complete flow:

Landing Page
↓
Sign Up / Login
↓
Dashboard
↓
Paste Text
↓
Analyze
↓
AI Probability
↓
Human Probability
↓
Confidence
↓
Stylometric Analysis
↓
Explanation
↓
Humanize
↓
Re-check Humanized Text
↓
Compare Original vs Humanized
↓
Save History

---

## 5. UI DIRECTION

Use `ui.png` as the primary visual reference.

The design must feel:

- Premium
- Cinematic
- Minimal
- Dark
- Editorial
- Modern
- Sophisticated
- Product-focused

Use:

- Black/near-black background
- Purple/lavender accents
- Subtle blue-violet gradients
- Glassmorphism
- Thin borders
- Large typography
- Strong spacing
- Subtle grain
- Smooth Framer Motion animations
- Premium hover states
- Minimal icons

Avoid:

- Generic AI templates
- Excessive neon
- Cartoon illustrations
- Overloaded gradients
- Excessive glass effects
- Unnecessary 3D
- Cheap-looking dashboard cards

---

## 6. RESPONSIVENESS

This is mandatory.

The final application must work perfectly on:

Mobile
Tablet
Laptop
Desktop

No:

- Horizontal scrolling
- Overflow
- Clipped content
- Broken cards
- Overlapping text
- Tiny buttons
- Broken navigation
- Broken charts
- Unusable editors

Create proper responsive layouts rather than simply scaling desktop layouts down.

---

## 7. REMOTION + FRAMER MOTION

Use:

Framer Motion
→ normal website animations

Remotion
→ actual programmatic video/demo experiences

Do not use Remotion where CSS/Framer Motion is sufficient.

Create the Watch Demo experience only if it genuinely improves the product.

---

## 8. DO NOT CHANGE THE CORE STACK

Use:

React
Vite
Tailwind CSS
Framer Motion
InsForge
Python
FastAPI
Transformer model
Stylometric analysis
LLM APIs

Do NOT introduce Fastify.

Do NOT introduce another database.

Do NOT replace existing working architecture without a clear technical reason.

---

## 9. BUILD ORDER

Follow this order:

1. Inspect existing project
2. Inspect `agentcode.md`
3. Read `AGENTS.md`
4. Configure required skills
5. Configure InsForge
6. Configure authentication
7. Configure database
8. Configure backend/API
9. Configure AI/ML service
10. Configure LLM provider abstraction
11. Build landing page
12. Build authentication pages
13. Build dashboard
14. Build analyzer
15. Build result interface
16. Build humanizer
17. Build comparison
18. Build history
19. Build settings
20. Add Remotion demo where appropriate
21. Test functionality
22. Test responsiveness
23. Run security checks
24. Run production build
25. Fix all errors

---

## 10. IMPORTANT

Do not just generate files and stop.

Actually run the application.

Inspect the browser.

Test the major user flows.

Fix errors.

Verify:

- Login
- Signup
- Logout
- Protected routes
- InsForge database
- User-specific history
- AI analysis
- Humanization
- Re-analysis
- Compare
- History
- Delete
- Responsive UI
- API failures
- Loading states
- Error states

Only consider the project complete after the application is actually working end-to-end.

The final product must feel like a real premium SaaS product:

# VERITY

## See Beyond the Words.

---

# PROJECT CLEANUP & ARCHITECTURE HYGIENE SKILL

Before finalizing the project, audit the entire repository and remove unnecessary files, folders, duplicate implementations, unused components, dead code, obsolete configuration, and temporary/generated artifacts.

IMPORTANT:
Do NOT blindly delete files.

Before deleting anything:
1. Check whether the file/folder is imported or referenced anywhere.
2. Check package.json dependencies and scripts.
3. Check environment/configuration references.
4. Check routing references.
5. Check API/backend references.
6. Check InsForge configuration.
7. Check build/deployment configuration.
8. Check whether the file is required by an installed Agent Skill.
9. Check whether the file is required by Vite, React, Tailwind, FastAPI, Python, or the current project structure.
10. Preserve all required functionality.

## TARGET ARCHITECTURE

Keep the project organized into clear areas:

frontend/
  components/
  pages/
  layouts/
  hooks/
  services/
  lib/
  assets/
  styles/

backend/
  app/
  api/
  models/
  services/
  ml/
  utils/
  tests/

Only create folders that are actually needed.

Do not create empty folders.

## REMOVE WHEN SAFE

Remove:
- Unused components
- Duplicate components
- Unused pages
- Dead routes
- Unused hooks
- Unused utilities
- Duplicate API clients
- Old API implementations
- Temporary files
- Debug files
- Test files that are no longer relevant
- Generated artifacts that should not be committed
- Old UI versions
- Duplicate CSS files
- Unused images/assets
- Unused Python modules
- Unused scripts
- Empty folders
- Obsolete configuration files

Do NOT delete:
- package.json
- lock files
- .env
- .gitignore
- AGENTS.md
- required InsForge configuration
- required Agent Skills
- Vite/Tailwind configuration
- FastAPI entry point
- ML model files/configuration that are actually used
- required deployment configuration

## DEPENDENCY CLEANUP

Inspect package.json and Python dependencies.

Remove dependencies only when:
- They are not imported anywhere.
- They are not required by scripts/configuration.
- They are not required by the current framework/tooling.

After dependency cleanup:
- Reinstall dependencies.
- Run the development build.
- Run the production build.
- Fix any dependency errors.

## FRONTEND CLEANUP

Ensure frontend has:
- One canonical API client
- One authentication integration
- One design system/token source
- One routing implementation
- Reusable components
- No duplicate pages
- No unused UI components
- No dead CSS

Do not create multiple versions such as:
`Button.jsx`
`ButtonNew.jsx`
`ButtonFinal.jsx`
`ButtonV2.jsx`

Keep only the canonical implementation.

## BACKEND CLEANUP

Ensure backend has:
- One canonical FastAPI application entry point
- Clear API routes
- Clear service layer
- Clear ML/detection layer
- Clear LLM provider layer
- No duplicate API implementations
- No unused server files
- No obsolete frameworks

Fastify must NOT be introduced.

## FILE NAMING

Use consistent naming.

Avoid:
- `final`
- `final2`
- `new`
- `new2`
- `old`
- `backup`
- `temp`
- `test123`
- `copy`
- `unused`

unless genuinely required.

## AFTER CLEANUP

Generate a concise cleanup report containing:

### Removed
List files/folders removed.

### Kept
Important files/folders retained and why.

### Dependencies Removed
List unused dependencies removed.

### Architecture
Show the final frontend/backend folder structure.

### Verification
Confirm:
- Application starts
- Production build succeeds
- Frontend routes work
- Backend starts
- API calls work
- Authentication works
- InsForge works
- AI analysis works
- Humanization works
- No broken imports
- No missing modules
- No console errors

IMPORTANT:
The cleanup must NEVER change the application's intended functionality or visual design.

Prioritize:
**Clean architecture > fewer files.**

Do not delete something merely because it looks unused. Verify it first.

---

# PLAYWRIGHT E2E TESTING SKILL

Set up Playwright E2E testing for VERITY.

Use the already available Playwright installation.

Create a proper automated E2E test suite and integrate it into the project.

Test these critical flows:

1. Landing page
- Page loads successfully
- Navbar works
- CTA buttons work
- No console errors

2. Authentication
- Sign up
- Login
- Logout
- Protected route access
- Session persistence
- Invalid login handling

3. Dashboard
- Loads after authentication
- Navigation works
- User-specific data is displayed

4. AI Analyzer
- Text can be entered
- Analyze button works
- Loading state works
- Result is displayed
- AI probability is displayed
- Human probability is displayed
- Confidence is displayed
- Explanation is displayed

5. Humanizer
- Text can be submitted
- Humanized result is displayed
- Copy action works
- Re-check works

6. Compare
- Original and humanized text are displayed
- Comparison results are displayed
- Mobile layout works

7. History
- Analysis is saved
- History appears
- Search/filter works if implemented
- Open works
- Delete works
- User cannot access another user's history

8. Responsive testing
Run tests at:
- Desktop: 1440x900
- Desktop: 1280x800
- Tablet: 1024x768
- Tablet: 820x1180
- Mobile: 430x932
- Mobile: 390x844
- Mobile: 360x800

Check:
- No horizontal overflow
- No overlapping elements
- No clipped text
- Navigation works
- Buttons are accessible
- Forms work
- Cards remain readable

9. API / Network
Verify important API requests.
Detect failed requests.
Do not expose API keys.

10. Console
Fail tests when unexpected console errors occur.

Use a clean structure such as:

e2e/
  auth.spec.ts
  analyzer.spec.ts
  humanizer.spec.ts
  history.spec.ts
  responsive.spec.ts
  landing.spec.ts

Add appropriate Playwright configuration.

Add useful npm scripts such as:

npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:report

Do not create duplicate testing frameworks.

Do not modify application functionality just to make tests pass.

After implementation, actually run the Playwright tests and fix genuine application issues discovered by the tests.

Finally provide:
- Tests created
- Tests passed
- Tests failed
- Issues fixed
- Remaining issues, if any
