---
inclusion: always
---

# Project: Personal AI Study & Task Coach
# Build with Kiro 2026 Hackathon

## What This Project Is

A web application that turns a university student's study material, tasks, and deadlines into an AI-powered, personalized study plan. AI is the core engine — not a chatbot add-on. Built spec-first using Kiro's spec-driven workflow.

## Current Phase

Requirements specification v1.1 — **Approved**. Proceeding to `design.md`.

## Stack (Final — Approved)

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS |
| Backend | Python 3.11+, FastAPI |
| Database | PostgreSQL 15+ via SQLAlchemy (async) + Alembic migrations |
| AI Provider | Google Gemini `gemini-2.5-flash` — wrapped in `GeminiAIService(AIService)` |
| Auth | JWT access + refresh tokens, bcrypt password hashing (cost ≥ 12) |
| PDF Processing | `pypdf` — text extraction only, no OCR |
| File Storage (dev) | Local filesystem |
| File Storage (prod) | Supabase Storage (S3-compatible, free tier) — wrapped in `StorageService` |
| Frontend Deploy | Vercel (free tier) |
| Backend Deploy | Render (free tier — cold-start documented in README) |
| Database (prod) | Neon managed PostgreSQL (free tier) |

## Project Structure (Planned)

```
build-with-kiro-2026/
├── .kiro/
│   ├── specs/study-coach/    # requirements.md, design.md, tasks.md
│   └── steering/             # this file
├── frontend/                 # React + Vite + TypeScript + Tailwind
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       ├── services/         # API client
│       └── types/
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── api/              # Route handlers (routers)
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── services/         # AIService, StorageService, task logic
│   │   └── core/             # Config, security, DB connection
│   └── alembic/              # Database migrations
├── .env.example
├── .gitignore
└── README.md
```

## Finalized Decisions (Do Not Re-open)

| Topic | Decision |
|---|---|
| Auth | Email + password JWT only. No OAuth. |
| AI model | `gemini-2.5-flash`. No fallback provider in MVP. |
| AI abstraction | `AIService` base class; `GeminiAIService` concrete impl. Interface preserved for future swap. |
| File storage | Supabase Storage for prod; local filesystem for dev. Wrapped in `StorageService`. |
| Exams | `task_type = "exam"` — a task subtype, not a separate entity. |
| Study plan history | Latest plan only. Replaced on regeneration. Generation timestamp stored. |
| Deployment | Vercel + Render + Neon + Supabase Storage. |
| Progress tracking | Planned estimated hours vs completed estimated hours. No time-logging, no timer. Completing a task counts its `estimated_duration` as completed hours. |
| Adaptive planning | Manual regeneration trigger. No automatic background rescheduling. |
| Document limits | 10 MB max file size. 50,000 chars max per doc passed to AI. Max 3 docs per query. |
| Conversation history | Capped at last 10 turns before passing to AI. |

## AI Service Contract

All LLM calls go through `backend/app/services/ai_service.py`.

```python
class AIService:  # base / interface
    async def answer_question(material_context, question, history) -> str: ...
    async def summarize(material_context) -> str: ...
    async def extract_key_points(material_context) -> list[KeyPoint]: ...
    async def generate_quiz(material_context) -> list[QuizQuestion]: ...
    async def generate_study_plan(tasks, available_hours, date_range) -> list[StudySession]: ...
    async def prioritize_tasks(tasks) -> list[PrioritizedTask]: ...

class GeminiAIService(AIService):  # concrete implementation
    # Uses google-generativeai SDK, model=gemini-2.5-flash
    ...
```

All structured outputs validated against Pydantic models before returning to API routes.

## AI Structured Output Formats

| Feature | JSON Structure |
|---|---|
| Study Plan | `[{ date, course_id, task_title, duration_minutes, session_type, rationale }]` |
| Task Prioritization | `[{ task_id, priority_rank, explanation }]` |
| Quiz Generation | `[{ question, options: [], correct_answer, explanation }]` |
| Key Points | `[{ point, importance: "high\|medium\|low" }]` |

## Security Non-Negotiables

- No API keys in source code, ever.
- `.env` always in `.gitignore`.
- `.env.example` always up to date.
- SQLAlchemy ORM for all DB queries — no raw SQL string interpolation.
- Uploaded file content stored as text, never executed.
- AI output rendered as text in React (no `dangerouslySetInnerHTML`).
- CORS restricted to frontend origin in production.
- JWT secrets minimum 256-bit entropy, from environment variables.

## Spec Files

All specification documents in `.kiro/specs/study-coach/`:
- `requirements.md` — v1.1, approved ✓
- `design.md` — next (technical architecture, data model, API design)
- `tasks.md` — after design approval (implementation task list)
