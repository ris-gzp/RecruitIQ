import json
import os
import uuid
import io
from typing import List

import openai
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

try:
    from pypdf import PdfReader
except ImportError:
    from PyPDF2 import PdfReader  # type: ignore[no-redef]

load_dotenv()

client = openai.OpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1",
)

MODEL = "openrouter/auto"

app = FastAPI(title="RecruitIQ", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all so unhandled exceptions always return valid JSON instead of plain-text."""
    return JSONResponse(
        status_code=500,
        content={"detail": f"Unexpected server error: {type(exc).__name__}: {exc}"},
    )


sessions: dict = {}


class JobMatchRequest(BaseModel):
    session_id: str
    job_description: str


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    session_id: str
    message: str
    history: List[ChatMessage] = []


# ── Helpers ───────────────────────────────────────────────────────────────────

def extract_pdf_text(pdf_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(pdf_bytes))
    text = ""
    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted + "\n"
    return text.strip()


def safe_json_parse(text: str, fallback: dict) -> dict:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find('{')
        end = text.rfind('}') + 1
        if start != -1 and end > start:
            try:
                return json.loads(text[start:end])
            except Exception:
                pass
    return fallback


def ai_generate(system: str, prompt: str, max_tokens: int = 4000) -> str:
    """Single-turn generation via OpenRouter's OpenAI-compatible endpoint."""
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user",   "content": prompt},
        ],
        max_tokens=max_tokens,
        temperature=0.3,
    )
    return response.choices[0].message.content or ""


def _map_openrouter_error(exc: Exception) -> HTTPException:
    """Translate openai SDK errors to HTTP exceptions with friendly messages."""
    if isinstance(exc, openai.AuthenticationError):
        return HTTPException(
            status_code=500,
            detail="Invalid OpenRouter API key. Set OPENROUTER_API_KEY in your .env file.",
        )
    if isinstance(exc, openai.RateLimitError):
        return HTTPException(status_code=429, detail="API rate limit reached. Please try again later.")
    if isinstance(exc, openai.BadRequestError):
        return HTTPException(status_code=400, detail=f"Bad request to AI service: {exc}")
    return HTTPException(status_code=502, detail=f"AI service error: {exc}")


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return JSONResponse({"status": "ok", "model": MODEL})


@app.post("/api/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    filename = file.filename or ""
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum 10MB.")

    try:
        resume_text = extract_pdf_text(content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")

    if not resume_text:
        raise HTTPException(
            status_code=400,
            detail="Could not extract text from PDF. Ensure it is not an image-only scan.",
        )

    fallback = {
        "name": "Professional",
        "title": "Job Seeker",
        "years_experience": 0,
        "key_skills": [],
        "education": "Not specified",
        "strengths": ["Resume uploaded successfully"],
        "improvements": ["Add more detail to your resume"],
        "summary": "Resume has been uploaded and is ready for job matching.",
    }

    try:
        raw = ai_generate(
            system="You are an expert career advisor. Return ONLY valid complete JSON, no truncation, no markdown, no extra text.",
            prompt=f"""Analyze this resume and return a JSON object with these exact fields:
{{
  "name": "candidate full name",
  "title": "current or target job title",
  "years_experience": 5,
  "key_skills": ["skill1", "skill2", "skill3", "skill4", "skill5", "skill6", "skill7", "skill8"],
  "education": "highest education level and field",
  "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "improvements": ["improvement area 1", "improvement area 2", "improvement area 3"],
  "summary": "Two-sentence professional summary highlighting value proposition."
}}

RESUME:
{resume_text[:8000]}

CRITICAL: Return ONLY valid complete JSON. No markdown, no explanation, no truncation. The response must start with {{ and end with }}.""",
            max_tokens=4000,
        )
        analysis = safe_json_parse(raw, fallback)
    except openai.OpenAIError as e:
        raise _map_openrouter_error(e)

    session_id = str(uuid.uuid4())
    sessions[session_id] = {
        "resume_text": resume_text,
        "analysis": analysis,
        "filename": filename,
    }

    return JSONResponse({
        "session_id": session_id,
        "analysis": analysis,
        "message": "Resume analyzed successfully",
    })


@app.post("/api/match-job")
async def match_job(request: JobMatchRequest):
    session = sessions.get(request.session_id)
    if not session:
        raise HTTPException(
            status_code=404,
            detail="Session not found. Please upload your resume first.",
        )

    fallback = {
        "score": 0,
        "rating": "Analysis Error",
        "matched_skills": [],
        "missing_skills": [],
        "key_insights": ["Unable to complete analysis. Please try again."],
        "recommendation": "Please try again with a different job description.",
        "ats_tips": [],
    }

    try:
        raw = ai_generate(
            system="You are an expert ATS analyst and career advisor. Return ONLY valid complete JSON, no truncation, no markdown, no extra text.",
            prompt=f"""Analyze how well this resume matches the job description and return a JSON object.

RESUME:
{session['resume_text'][:5000]}

JOB DESCRIPTION:
{request.job_description[:3000]}

Return this exact JSON:
{{
  "score": 75,
  "rating": "Good Match",
  "matched_skills": ["matched skill 1", "matched skill 2"],
  "missing_skills": ["missing skill 1", "missing skill 2"],
  "key_insights": [
    "Specific insight about experience alignment",
    "Specific insight about skills overlap",
    "Specific insight about potential gaps",
    "Specific insight about standout qualities"
  ],
  "recommendation": "2-3 sentence personalized recommendation for this specific role.",
  "ats_tips": [
    "Specific ATS optimization tip 1",
    "Specific ATS optimization tip 2",
    "Specific ATS optimization tip 3"
  ]
}}

Score scale: 80-100=Excellent Match, 60-79=Good Match, 40-59=Fair Match, 0-39=Poor Match
Rating MUST match the score range.
CRITICAL: Return ONLY valid complete JSON. No markdown, no explanation, no truncation. The response must start with {{ and end with }}.""",
            max_tokens=4000,
        )
    except openai.OpenAIError as e:
        raise _map_openrouter_error(e)

    return JSONResponse(safe_json_parse(raw, fallback))


@app.post("/api/chat")
async def chat(request: ChatRequest):
    session = sessions.get(request.session_id)

    system_parts = [
        "You are an expert career advisor and coach with 20+ years of experience in talent acquisition and career development.",
        "Provide personalized, actionable career advice. Be encouraging, specific, and practical.",
        "Keep responses under 250 words unless more detail is explicitly requested.",
        "Use bullet points when listing multiple items. Be warm and motivating.",
        "",
        "IMPORTANT ROLE-PLAY RULE: When asked interview-style questions such as 'Tell me about yourself', "
        "'What are your top skills?', 'What is your CGPA?', 'What internships have you done?', "
        "'Are you open to relocation?', 'What is your notice period?', or any similar first-person interview question, "
        "you MUST respond IN FIRST PERSON as the candidate using their resume data. "
        "Speak AS the candidate using 'I', 'my', 'me'. Do NOT give advice — give the answer the candidate would say.",
    ]
    if session:
        system_parts.append(f"\nCandidate resume context: {json.dumps(session.get('analysis', {}))}")
    else:
        system_parts.append("\nNo resume uploaded yet — give general career advice.")

    # OpenAI-compatible format: system first, then history, then current message.
    # History roles are already "user" / "assistant" — no transformation needed.
    messages = [{"role": "system", "content": "\n".join(system_parts)}]
    messages += [{"role": msg.role, "content": msg.content} for msg in request.history[-10:]]
    messages.append({"role": "user", "content": request.message})

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            max_tokens=4000,
            temperature=0.7,
        )
        reply = response.choices[0].message.content or "I'm sorry, I couldn't generate a response. Please try again."
        return JSONResponse({"response": reply})
    except openai.OpenAIError as e:
        raise _map_openrouter_error(e)
