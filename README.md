# ⚡ SkillSense AI — Skill Assessment & Personalized Learning Plan Agent

A production-quality, full-stack AI system that extracts skills from your resume and a job description, conducts an adaptive technical assessment, computes scored results using a deterministic formula, and generates a personalized weekly learning roadmap.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A **Groq API key** (free at [console.groq.com](https://console.groq.com))

### 1. Clone & Set Up Backend

```bash
cd backend
cp .env.example .env
# Edit .env and add your GROQ_API_KEY
npm install
npm run dev        # Starts on http://localhost:5000
```

### 2. Set Up Frontend

```bash
cd frontend
npm install
npm run dev        # Starts on http://localhost:5173
```

### 3. Open the App

Navigate to **http://localhost:5173** and start your assessment.

---

## 🌍 Deploy Globally (Production)

Recommended setup:
- Backend: Render (Web Service)
- Frontend: Vercel (Static Vite app)

### 1) Deploy Backend on Render

Create a new **Web Service** from your repo and set:

- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`

Environment variables on Render:

- `GROQ_API_KEY` = your Groq key
- `NODE_ENV` = `production`
- `PORT` = `5000` (optional; Render injects a port automatically)
- `FRONTEND_URL` = your Vercel production URL (add later after frontend deploy)
- `FRONTEND_ORIGINS` = optional comma-separated list of extra origins (preview URLs/custom domains)

After deploy, copy your backend URL, for example:
`https://skillsense-api.onrender.com`

### 2) Deploy Frontend on Vercel

Import the same repo in Vercel and set:

- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`

Frontend environment variable:

- `VITE_API_URL` = your Render backend URL (for example `https://skillsense-api.onrender.com`)

Deploy and copy your frontend URL, for example:
`https://skillsense-ai.vercel.app`

### 3) Final CORS Step

Go back to Render backend env vars and set:

- `FRONTEND_URL` = your Vercel URL

If you use multiple domains, set:

- `FRONTEND_ORIGINS` = `https://skillsense-ai.vercel.app,https://www.yourdomain.com`

Redeploy backend once after updating env vars.

### 4) Verify

- Open frontend URL
- Confirm upload/analyze/assessment/results all work
- Check backend health endpoint: `/health`

---

## 📁 Project Structure

```
project/
├── backend/
│   ├── controllers/
│   │   ├── analyzeController.js      # POST /analyze
│   │   ├── assessmentController.js   # POST /assessment/start|answer
│   │   └── resultsController.js      # GET /results/:sessionId
│   ├── routes/
│   │   ├── analyze.js
│   │   ├── assessment.js
│   │   └── results.js
│   ├── services/
│   │   ├── aiService.js              # ALL LLM calls (Groq)
│   │   ├── parsingService.js         # Skill normalization + gap analysis (NO AI)
│   │   └── scoringService.js         # Weighted scoring math (NO AI)
│   ├── utils/
│   │   ├── sessionStore.js           # In-memory session management
│   │   ├── retryWrapper.js           # Exponential backoff retry
│   │   └── validator.js              # Input validation + JSON parsing
│   ├── .env                          # GROQ_API_KEY=your_key
│   └── app.js                        # Express entry point
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── LandingPage.jsx       # Hero + features + CTA
        │   ├── UploadPage.jsx        # Resume + JD text input
        │   ├── ProcessingPage.jsx    # Animated loading screen
        │   ├── AssessmentPage.jsx    # Chat-style assessment UI
        │   └── ResultsDashboard.jsx  # Match %, scores, gaps, roadmap
        ├── components/
        │   ├── SkillBadge.jsx        # Strength-coded chip
        │   ├── ScoreCard.jsx         # Per-skill score breakdown
        │   ├── GapChart.jsx          # Skill alignment bar chart
        │   ├── ChatBubble.jsx        # Question/answer/feedback bubbles
        │   └── LearningPlan.jsx      # Weekly roadmap cards
        ├── context/SessionContext.jsx # Global state (useReducer)
        └── services/api.js           # Axios API wrappers
```

---

## 🔌 API Reference

### POST /analyze
```json
// Request
{ "resume": "...", "jd": "..." }

// Response
{
  "sessionId": "uuid",
  "matchPercentage": 62,
  "strongSkills": ["Python", "React"],
  "weakSkills": ["Docker"],
  "missingSkills": ["Kubernetes", "GraphQL"],
  "skillMatrix": [{ "skill": "Docker", "status": "present", "strength": "Weak" }]
}
```

### POST /assessment/start
```json
{ "sessionId": "uuid" }
// Response: { skill, question, difficulty, questionIndex, totalQuestions }
```

### POST /assessment/answer
```json
{ "sessionId": "uuid", "answer": "CMD sets default command..." }
// Response: { evaluation, score, nextQuestion, difficulty, done }
```

### GET /results/:sessionId
```json
// Response: { matchPercentage, overallScore, skillScores, learningPlan, ... }
```

---

## 🧠 Scoring Formula

All scoring is computed server-side. AI only returns the three raw scores.

```
finalScore = (relevance × 0.4) + (accuracy × 0.3) + (depth × 0.3)
```

| Dimension | Weight | Meaning |
|---|---|---|
| Relevance | 40% | Did the answer address the question? |
| Accuracy | 30% | Were the technical facts correct? |
| Depth | 30% | How thoroughly was it explained? |

---

## 🔒 Environment Variables

| Variable | Description |
|---|---|
| `GROQ_API_KEY` | **Required.** Your Groq API key |
| `PORT` | Backend port (default: 5000) |
| `NODE_ENV` | `development` or `production` |
| `FRONTEND_URL` | Frontend URL for CORS in production |

---

## 🏗️ Architecture Principles

- **AI is isolated** — only `aiService.js` talks to Groq. No AI calls in controllers.
- **Gap analysis is deterministic** — `parsingService.js` uses pure JS math. Match % never depends on AI.
- **Scoring is server-side only** — `scoringService.js` formula, not delegated to the LLM.
- **All AI responses are JSON-validated** — `parseAndValidateJSON()` strips markdown and validates schema.
- **3-attempt retry with exponential backoff** — wraps every LLM call.
- **Sessions are in-memory** — swap `sessionStore.js` Map for Redis/MongoDB without changing the interface.

---

## 🎨 Frontend Pages

| Route | Page | Description |
|---|---|---|
| `/` | Landing | Hero, features, flow diagram |
| `/upload` | Upload | Resume + JD textarea inputs |
| `/processing` | Processing | Animated loading during AI analysis |
| `/assessment` | Assessment | Chat-style adaptive Q&A |
| `/results` | Dashboard | Match ring, score cards, gap chart, roadmap |
