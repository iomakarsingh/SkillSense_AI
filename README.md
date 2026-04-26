# ⚡ SkillSense AI

## AI-Powered Skill Assessment & Personalized Learning Plan Agent

A production-quality, full-stack AI system that extracts skills from a resume and job description, performs adaptive technical assessment, computes deterministic scores, and generates a personalized learning roadmap.

---

# 🧠 Overview

SkillSense AI bridges the gap between **claimed skills** and **actual ability**.

It:

* Compares Resume vs Job Description
* Identifies missing and weak skills
* Conducts adaptive skill assessment
* Computes real skill scores
* Generates a structured learning roadmap

---

# 🏗️ System Architecture

```
                ┌──────────────────────┐
                │      Frontend        │
                │   (React - Vite)     │
                │----------------------│
                │ Upload Resume & JD   │
                │ Assessment UI        │
                │ Results Dashboard    │
                └─────────┬────────────┘
                          │ REST API
                          ▼
                ┌──────────────────────┐
                │       Backend        │
                │   (Node + Express)   │
                ├──────────────────────┤
                │ Controllers          │
                │ Services             │
                │ Utils                │
                └─────────┬────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
   ┌───────────┐   ┌──────────────┐   ┌──────────────┐
   │  AI Layer │   │ Gap Analysis │   │ Scoring Logic│
   │  (Groq)   │   │ (Pure Logic) │   │ Deterministic│
   └───────────┘   └──────────────┘   └──────────────┘
```

### Key Design Decisions

* AI is used only for extraction, questioning, and evaluation
* Gap analysis is handled using backend logic
* Scoring is deterministic and computed server-side
* Ensures consistency, reliability, and control

---

# ⚙️ Scoring & Logic

## 🔹 Gap Analysis (Deterministic)

* Missing Skills = JD Skills – Resume Skills
* Weak Skills = Medium + Weak
* Match % = (Matched Skills / Total JD Skills) × 100

> This is computed using backend logic, not AI.

---

## 🔹 Adaptive Assessment

For each weak/missing skill:

1. Generate a question
2. Evaluate answer
3. Adjust difficulty

| Score | Next Level |
| ----- | ---------- |
| < 5   | Easy       |
| 5–7   | Medium     |
| > 7   | Hard       |

---

## 🔹 Scoring Formula

```
Final Score = (Relevance × 0.4) 
            + (Accuracy × 0.3) 
            + (Depth × 0.3)
```

* AI provides raw scores
* Final computation is done in backend

---

## 🔹 Reliability Mechanisms

* JSON validation for all AI responses
* Retry mechanism (3 attempts)
* Controlled prompts
* Session state management

---

# 🚀 Quick Start

### Prerequisites

* Node.js 18+
* Groq API Key

---

### Backend Setup

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

---

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

### Run Application

Open:

```
http://localhost:5174
```

---

# 🌍 Deployment

### Backend (Recommended: Render)

* Build: `npm install`
* Start: `npm start`

### Frontend (Recommended: Vercel)

* Build: `npm run build`
* Output: `dist`

### Environment Variables

Backend:

```
GROQ_API_KEY=your_key
NODE_ENV=production
FRONTEND_URL=your_frontend_url
```

Frontend:

```
VITE_API_URL=your_backend_url
```

---

# 📁 Project Structure

```
project/
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   │   ├── aiService.js
│   │   ├── parsingService.js
│   │   └── scoringService.js
│   ├── utils/
│   └── app.js
│
└── frontend/
    ├── pages/
    ├── components/
    ├── context/
    └── services/
```

---

# 🔌 API Reference

### POST /analyze

```json
{
  "resume": "...",
  "jd": "..."
}
```

Response:

```json
{
  "matchPercentage": 62,
  "strongSkills": ["React"],
  "weakSkills": ["Docker"],
  "missingSkills": ["MongoDB"]
}
```

---

### POST /assessment/start

```json
{ "sessionId": "uuid" }
```

---

### POST /assessment/answer

```json
{ "sessionId": "uuid", "answer": "..." }
```

---

### GET /results/:sessionId

Returns final scores + learning plan

---

# 📊 Sample Input & Output

## Input

Resume:

```
React developer with JavaScript experience
```

Job Description:

```
Looking for React, Node.js, MongoDB developer
```

---

## Output (Analysis)

```json
{
  "matchPercentage": 50,
  "strongSkills": ["React"],
  "weakSkills": ["JavaScript"],
  "missingSkills": ["Node.js", "MongoDB"]
}
```

---

## Output (Evaluation)

```json
{
  "relevance": 7,
  "accuracy": 6,
  "depth": 5,
  "finalScore": 6.1
}
```

---

## Output (Learning Plan)

```json
{
  "week": 1,
  "focus": "Node.js Basics",
  "topics": ["Event Loop", "Async Programming"]
}
```

---

# 🎯 Key Highlights

* Hybrid AI + deterministic system
* Adaptive questioning mechanism
* Backend-controlled scoring
* Reliable AI handling
* Real-world hiring use-case

---

# 🚀 Conclusion

SkillSense AI goes beyond resume screening by:

* Evaluating real technical skills
* Providing measurable scoring
* Delivering structured learning plans

It can be extended into a full-scale **AI hiring assistant platform**.

---
