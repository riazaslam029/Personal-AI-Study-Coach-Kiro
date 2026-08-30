---
inclusion: always
---

# Project: Personal AI Study & Task Coach
# Build with Kiro 2026 Hackathon

## What This Project Is

A web application that turns a university student's study material, tasks, and deadlines into an AI-powered, personalized study plan. AI is the core engine — not a chatbot add-on.

## Stack (Agreed)

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS |
| Backend | Python 3.11+, FastAPI |
| Database | PostgreSQL 15+ via SQLAlchemy (async) + Alembic |
| AI Provider | Google Gemini (gemini-1.5-flash) — abstracted behind AIService layer |
| Auth | JWT (access + refresh), bcrypt password hashing |
| PDF Processing | pypdf — text extraction only, no OCR |
| Frontend Deploy | Vercel |
| Backend Deploy | Render |
| Database | Neon (managed Postgres) |

## Project Structure (Planned)

```
build-with-kiro-2026/
├── .kiro/
│   ├── specs/study-coach/    # requirements.md, design.md, tasks.md
│   └── steering/             # this file
├── frontend/                 # React + Vite + TypeScript + Tailwind
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── api/              # Route handlers
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── services/         # Business logic (AI service, task service, etc.)
│   │   └── core/             # Config, security, database connection
│   └── alembic/              # Database migrations
├── .env.example
├── .gitignore
└── README.md
```

## Key Decisions

- **Auth:** Email + password JWT only. No OAuth for MVP.
- **File storage:** Local for dev; Cloudflare R2 or Supabase Storage for production (TBD).
- **AI calls:** Backend only. Never expose AI API keys to the frontend.
- **Exam dates:** Implemented as a task subtype (`task_type = "exam"`) for simplicity.
- **Study plans:** Store latest plan only (not history) for MVP.
- **Adaptive planning:** Manual re-trigger by user, not automatic.
- **Document context limit:** 50,000 characters per document, max 3 docs per AI query.
- **Conversation history:** Capped at last 10 turns.

## AI Service Contract

All LLM calls go through `backend/app/services/ai_service.py`.  
The service exposes these methods:
- `answer_question(material_context, question, history)` → str
- `summarize(material_context)` → str
- `extract_key_points(material_context)` → list[KeyPoint]
- `generate_quiz(material_context)` → list[QuizQuestion]
- `generate_study_plan(tasks, available_hours, date_range)` → list[StudySession]
- `prioritize_tasks(tasks)` → list[PrioritizedTask]

All structured outputs are validated against Pydantic models before being returned to API routes.

## Security Non-Negotiables

- No API keys in source code, ever.
- `.env` always in `.gitignore`.
- `.env.example` always up to date.
- SQLAlchemy ORM for all DB queries — no raw SQL interpolation.
- Uploaded file content stored as text, never executed.
- AI output rendered as text in React (not dangerouslySetInnerHTML).

## Spec Files Location

All specification documents live in `.kiro/specs/study-coach/`:
- `requirements.md` — what we're building and why
- `design.md` — architecture and technical design (next phase)
- `tasks.md` — implementation task list (phase after design)

## Development Phase

Current phase: **Requirements** (complete) → awaiting approval to proceed to Design.
