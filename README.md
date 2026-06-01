<div align="center">

# ◈ RecruitIQ

### AI-Powered Career Intelligence Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-AI-6C47FF?style=for-the-badge&logo=openai&logoColor=white)](https://openrouter.ai/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

Upload your resume. Match any job. Get AI career coaching — all in one place.

</div>

---

## Screenshots

**1 — Resume Upload**

![Resume Upload](https://raw.githubusercontent.com/ris-gzp/RecruitIQ/main/docs/screenshots/resume-upload.svg)

> Drag-and-drop PDF upload with an animated drop zone. Hit **Analyze Resume** and the AI extracts your profile in seconds.

**2 — Resume Intelligence Report**

![Resume Intelligence Report](https://raw.githubusercontent.com/ris-gzp/RecruitIQ/main/docs/screenshots/resume-intelligence.svg)

> Your AI-generated career profile: name, title, years of experience, key skills, a professional summary, strengths, and growth areas.

**3 — AI Career Advisor**

![AI Career Advisor](https://raw.githubusercontent.com/ris-gzp/RecruitIQ/main/docs/screenshots/ai-advisor.svg)

> Conversational career coach with full resume context. Use Quick Q&A chips to trigger **mock interview mode** — the AI answers as you, in first person.

---

## Features

- **Resume Intelligence** — Upload any PDF resume and receive an instant AI-generated profile: candidate name, title, years of experience, key skills, strengths, improvement areas, and a 2-sentence professional summary.

- **Job Description Matcher** — Paste any job posting and get a scored compatibility report (0–100) with matched skills, missing skills, ATS optimization tips, and a personalized recommendation.

- **AI Career Advisor** — Conversational career coach with full resume context. Ask for interview prep, salary guidance, career path advice — or trigger **mock interview mode** where the AI answers as the candidate in first-person.

- **Session-Based Privacy** — Resume data is stored in-memory per session and never persisted to disk. Data is discarded on server restart.

- **Glassmorphism UI** — Dark-mode React frontend with animated mesh backgrounds, gradient orbs, and smooth transitions — no UI framework, pure CSS.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (React 18)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ ResumeUpload │  │  JobMatcher  │  │ ChatAdvisor  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         └─────────────────┴──────────────────┘          │
│                      Vite Dev Proxy                     │
└───────────────────────────┬─────────────────────────────┘
                            │ /api/*
┌───────────────────────────▼─────────────────────────────┐
│                  FastAPI Backend (Python)                │
│  POST /api/upload-resume  →  PDF parse + AI analysis    │
│  POST /api/match-job      →  Resume × JD scoring        │
│  POST /api/chat           →  Conversational AI          │
└───────────────────────────┬─────────────────────────────┘
                            │ OpenAI-compatible SDK
┌───────────────────────────▼─────────────────────────────┐
│               OpenRouter  (openrouter/auto)              │
│         Routes to best available model automatically     │
└─────────────────────────────────────────────────────────┘
```

**Data flow:**
1. User uploads PDF → `pypdf` extracts text → sent to OpenRouter for structured analysis
2. Session ID returned to frontend — resume text lives in server memory for the session
3. Job match and chat endpoints look up the session to include resume context in prompts

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + Vite | SPA with tab-based navigation |
| **Styling** | Pure CSS (glassmorphism) | No UI framework dependency |
| **Backend** | FastAPI + Uvicorn | REST API, file upload, CORS |
| **PDF Parsing** | pypdf | Extract selectable text from PDFs |
| **AI / LLM** | OpenRouter (`openrouter/auto`) | Auto-routes to best available model |
| **AI Client** | OpenAI Python SDK | OpenRouter is OpenAI-API-compatible |
| **Config** | python-dotenv | Load `.env` for API keys |

---

## Local Setup

### Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.10 or higher |
| Node.js | 18 or higher |
| npm | 9 or higher |
| OpenRouter API key | [Get one free](https://openrouter.ai/keys) |

---

### Quick Start — Windows (Recommended)

After completing the one-time setup below, you can launch and stop the entire stack with a single double-click.

| Script | What it does |
|--------|-------------|
| `start.bat` | Opens two Windows Terminal tabs — backend and frontend — then auto-launches the app in your browser |
| `stop.bat` | Finds and kills all processes on ports 8000, 5173, and 5174 |

```
# Launch everything
> double-click start.bat
  Tab 1 → activates venv, starts uvicorn on :8000
  Tab 2 → runs npm run dev on :5173
  Browser opens http://localhost:5173 automatically after 4 s

# Shut everything down
> double-click stop.bat
  [STOPPED] Backend  (uvicorn) -- PID 12345
  [STOPPED] Frontend (Vite)    -- PID 67890
```

> **Note:** `start.bat` requires [Windows Terminal](https://aka.ms/terminal) (`wt.exe`), which comes pre-installed on Windows 11. The one-time setup (venv creation, `pip install`, `npm install`) must be done manually the first time — see steps 2 and 3 below.

---

### 1. Clone the repository

```bash
git clone https://github.com/ris-gzp/RecruitIQ.git
cd RecruitIQ
```

---

### 2. Backend setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**Create your environment file:**

```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Open `.env` and add your key:

```env
OPENROUTER_API_KEY=sk-or-v1-...your-key-here...
```

**Start the backend:**

```bash
uvicorn main:app --reload --port 8000
```

The API is now live at `http://localhost:8000`.  
Interactive docs: `http://localhost:8000/docs`

---

### 3. Frontend setup

Open a **new terminal tab**:

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

> The Vite proxy forwards all `/api/*` requests to `http://localhost:8000` automatically — no CORS configuration needed.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | Yes | Your OpenRouter API key. Get one at [openrouter.ai/keys](https://openrouter.ai/keys). Free tier available. |

The `.env` file is listed in `.gitignore` and **will never be committed to version control**.

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check — returns model name |
| `POST` | `/api/upload-resume` | Upload PDF, returns `session_id` + analysis JSON |
| `POST` | `/api/match-job` | Score resume against a job description |
| `POST` | `/api/chat` | Conversational AI with resume context |

### Example — Upload Resume

```bash
curl -X POST http://localhost:8000/api/upload-resume \
  -F "file=@resume.pdf"
```

### Example — Match Job

```bash
curl -X POST http://localhost:8000/api/match-job \
  -H "Content-Type: application/json" \
  -d '{"session_id": "<your-session-id>", "job_description": "We are looking for a Senior Python Engineer..."}'
```

---

## Project Structure

```
RecruitIQ/
├── start.bat                # One-click launcher — opens both servers in Windows Terminal
├── stop.bat                 # One-click stopper — kills processes on ports 8000/5173/5174
├── backend/
│   ├── main.py              # FastAPI app — all endpoints and AI logic
│   ├── requirements.txt     # Python dependencies
│   ├── .env.example         # Environment variable template
│   └── test_gemini.py       # Quick API connectivity test
├── frontend/
│   ├── index.html           # HTML entry point with fonts and favicon
│   ├── vite.config.js       # Vite config + /api proxy
│   ├── package.json
│   └── src/
│       ├── main.jsx         # React entry point
│       ├── App.jsx          # Root component, tab navigation, session state
│       ├── App.css          # Global design system (glassmorphism tokens)
│       ├── index.css        # CSS reset and base styles
│       └── components/
│           ├── ResumeUpload.jsx   # PDF drop-zone + analysis display
│           ├── JobMatcher.jsx     # JD input + score ring + skill diff
│           └── ChatAdvisor.jsx    # Chat UI + quick Q&A chips
├── docs/
│   └── screenshots/         # SVG mockup images used in this README
├── .gitignore
└── README.md
```

---

## Notes

- Resume text is stored **in-memory only** — it is lost on server restart. No database required.
- The model is set to `openrouter/auto` which lets OpenRouter pick the best available model. You can pin a specific model (e.g. `anthropic/claude-3-5-sonnet`) by changing `MODEL` in `backend/main.py`.
- PDFs must contain **selectable text**. Scanned image PDFs are not supported.
- For production deployment, replace the in-memory `sessions` dict with Redis or a proper session store.

---

<div align="center">

Made with purpose · Powered by [OpenRouter](https://openrouter.ai/)

</div>
