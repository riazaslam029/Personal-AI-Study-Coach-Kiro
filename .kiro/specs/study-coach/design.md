# Technical Design
# Personal AI Study & Task Coach

**Project:** Build with Kiro 2026 Hackathon  
**Author:** AI Architect / Lead Engineer  
**Status:** Draft — Awaiting Approval  
**Date:** 2026-08-30  
**Version:** 1.0  
**Requires:** requirements.md v1.1 (approved)

---

## 1. System Overview

### 1.1 Architecture Summary

The application is a standard three-tier web application with an AI service layer:

```
┌─────────────────────────────────────────────────┐
│                   Browser                        │
│         React SPA (Vite + TypeScript)            │
│              Deployed on Vercel                  │
└─────────────────────┬───────────────────────────┘
                      │ HTTPS / REST JSON
┌─────────────────────▼───────────────────────────┐
│                 FastAPI Backend                   │
│           Python 3.11+ on Render                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │  Routers │ │ Services │ │   AI Service      │ │
│  │ (6 areas)│ │(business │ │ GeminiAIService   │ │
│  │          │ │  logic)  │ │                   │ │
│  └──────────┘ └──────────┘ └────────┬──────────┘ │
│  ┌──────────────────────────────────┼──────────┐ │
│  │        SQLAlchemy (async)        │          │ │
│  │        Alembic migrations        │          │ │
│  └──────────────────────────────────┼──────────┘ │
│  ┌──────────────────┐               │            │
│  │  StorageService  │               │            │
│  └────────┬─────────┘               │            │
└───────────┼─────────────────────────┼────────────┘
            │                         │
┌───────────▼──────┐       ┌──────────▼───────────┐
│  Supabase Storage│       │   Google Gemini API   │
│  (file uploads)  │       │  gemini-2.5-flash     │
└──────────────────┘       └──────────────────────┘
┌──────────────────────────────────────────────────┐
│              Neon PostgreSQL                      │
│          (managed, free tier)                    │
└──────────────────────────────────────────────────┘
```

### 1.2 Key Architectural Decisions

| Decision | Rationale |
|---|---|
| Async FastAPI + async SQLAlchemy | Non-blocking I/O for AI calls (up to 30s). Allows other requests to be served while waiting for Gemini. |
| React Query for server state | Eliminates manual loading/error/cache state management. Keeps components clean. |
| Zustand for auth state | Lightweight, no boilerplate. Auth token and user object accessible globally without prop drilling. |
| UUID primary keys | Avoids enumerable IDs in URLs; safe to expose in API responses. |
| Repository pattern (services) | Business logic is testable without HTTP layer. AI service swap requires only a new class, not route changes. |
| httpOnly cookies for JWT | Access token in memory (Zustand), refresh token in httpOnly cookie. Balances XSS safety and UX. |
| Pydantic v2 for schemas | Automatic request validation, serialization, and OpenAPI docs generation at zero extra cost. |

---

## 2. Database Design

### 2.1 Entity-Relationship Overview

```
users ──< courses ──< tasks
             │
             └──< study_materials

users ──< study_plan_sessions (FK: course_id, task_id optional)
users ──< ai_prioritizations
users ──< refresh_tokens
```

### 2.2 Table Definitions

#### `users`
```sql
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(255),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_email ON users(email);
```

#### `refresh_tokens`
Stores hashed refresh tokens for rotation. One active token per user.
```sql
CREATE TABLE refresh_tokens (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash    VARCHAR(255) NOT NULL UNIQUE,
    expires_at    TIMESTAMPTZ NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
```

#### `courses`
```sql
CREATE TABLE courses (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    color       VARCHAR(7) NOT NULL DEFAULT '#6366f1',  -- hex color, e.g. '#ef4444'
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_courses_user_id ON courses(user_id);
```

#### `tasks`
Covers both regular tasks and exams (`task_type = 'exam'`).
```sql
CREATE TABLE tasks (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id          UUID REFERENCES courses(id) ON DELETE SET NULL,
    title              VARCHAR(500) NOT NULL,
    description        TEXT,
    task_type          VARCHAR(20) NOT NULL DEFAULT 'task',
                       -- 'task' | 'assignment' | 'exam' | 'reading' | 'project'
    status             VARCHAR(20) NOT NULL DEFAULT 'not_started',
                       -- 'not_started' | 'in_progress' | 'completed'
    priority           VARCHAR(10) NOT NULL DEFAULT 'medium',
                       -- 'low' | 'medium' | 'high'
    difficulty         SMALLINT CHECK (difficulty BETWEEN 1 AND 5),
    estimated_hours    NUMERIC(5,2),      -- e.g. 2.5 hours
    deadline           DATE,
    completed_at       TIMESTAMPTZ,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_course_id ON tasks(course_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_deadline ON tasks(deadline);
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
```

#### `study_materials`
```sql
CREATE TABLE study_materials (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id         UUID REFERENCES courses(id) ON DELETE SET NULL,
    title             VARCHAR(500) NOT NULL,
    source_type       VARCHAR(20) NOT NULL,
                      -- 'pdf' | 'txt' | 'markdown' | 'pasted_text'
    original_filename VARCHAR(500),        -- null for pasted text
    storage_key       VARCHAR(1000),       -- Supabase Storage object key; null for pasted text
    extracted_text    TEXT NOT NULL,       -- extracted/pasted content (truncated at 50k chars)
    file_size_bytes   INTEGER,             -- null for pasted text
    extraction_warning BOOLEAN NOT NULL DEFAULT FALSE,
                      -- true if PDF had no extractable text
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_materials_user_id ON study_materials(user_id);
CREATE INDEX idx_materials_course_id ON study_materials(course_id);
```

#### `study_plan_sessions`
Stores the current active study plan — one row per scheduled session block. Replaced in full on regeneration.
```sql
CREATE TABLE study_plan_sessions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id        UUID REFERENCES courses(id) ON DELETE SET NULL,
    task_id          UUID REFERENCES tasks(id) ON DELETE SET NULL,
    -- task_id may be null for generic revision sessions
    session_date     DATE NOT NULL,
    duration_minutes SMALLINT NOT NULL,
    session_type     VARCHAR(30) NOT NULL,
                     -- 'study' | 'revision' | 'exam_prep' | 'assignment'
    task_title       VARCHAR(500) NOT NULL,  -- denormalized for display even if task deleted
    rationale        TEXT,
    is_completed     BOOLEAN NOT NULL DEFAULT FALSE,
    generated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_plan_user_id ON study_plan_sessions(user_id);
CREATE INDEX idx_plan_user_date ON study_plan_sessions(user_id, session_date);
```

#### `ai_prioritizations`
Stores the latest AI task prioritization result for the user.
```sql
CREATE TABLE ai_prioritizations (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    results      JSONB NOT NULL,
    -- [{task_id, priority_rank, explanation}]
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_prioritizations_user_id ON ai_prioritizations(user_id);
-- Only latest result matters; older rows cleaned up on new generation.
```

### 2.3 Schema Notes

- All timestamps use `TIMESTAMPTZ` (timezone-aware). Application stores and returns UTC.
- `extracted_text` in `study_materials` is stored in full (up to 50,000 chars). The 50k truncation is applied at the *AI query layer*, not at storage time, so the full available text is always stored.
- `task_title` is denormalized in `study_plan_sessions` so plan display doesn't break if the source task is deleted.
- `ai_prioritizations` keeps only the latest result per user. On a new prioritization run, the old row is deleted and replaced.
- No soft-delete pattern. Deletes are hard deletes with cascade where appropriate.

---

## 3. REST API Design

### 3.1 Base Configuration

- Base path: `/api/v1`
- Content type: `application/json` (except file upload endpoints: `multipart/form-data`)
- Authentication: `Authorization: Bearer <access_token>` header on all protected routes
- Error format:
```json
{
  "detail": "Human-readable error message",
  "code": "ERROR_CODE"
}
```
- All list endpoints return an array directly (no pagination wrapper for MVP — datasets are user-scoped and small)
- OpenAPI docs available at `/docs` and `/redoc`

### 3.2 Authentication Routes (`/api/v1/auth`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | None | Register new user |
| POST | `/auth/login` | None | Login, returns access token; sets refresh cookie |
| POST | `/auth/refresh` | Cookie | Exchange refresh token for new access token |
| POST | `/auth/logout` | Bearer | Revoke refresh token, clear cookie |
| GET | `/auth/me` | Bearer | Get current user profile |

**POST `/auth/register`**
```json
// Request
{ "email": "student@example.com", "password": "...", "full_name": "Alex Smith" }

// Response 201
{ "id": "uuid", "email": "student@example.com", "full_name": "Alex Smith", "created_at": "..." }
```

**POST `/auth/login`**
```json
// Request
{ "email": "student@example.com", "password": "..." }

// Response 200
// Sets: Set-Cookie: refresh_token=<token>; HttpOnly; Secure; SameSite=Lax; Path=/api/v1/auth/refresh
{ "access_token": "eyJ...", "token_type": "bearer", "expires_in": 900 }
// access_token TTL: 15 minutes
// refresh_token TTL: 7 days
```

**POST `/auth/refresh`**
```json
// Request: refresh_token read from httpOnly cookie (no body needed)
// Response 200
{ "access_token": "eyJ...", "token_type": "bearer", "expires_in": 900 }
// Issues new refresh token (rotation), updates cookie
```

### 3.3 Course Routes (`/api/v1/courses`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/courses` | Bearer | List all courses for user |
| POST | `/courses` | Bearer | Create course |
| GET | `/courses/{id}` | Bearer | Get course detail |
| PATCH | `/courses/{id}` | Bearer | Update course |
| DELETE | `/courses/{id}` | Bearer | Delete course (cascades) |
| GET | `/courses/{id}/stats` | Bearer | Course completion stats for progress screen |

**Course schema:**
```json
{
  "id": "uuid",
  "name": "Database Systems",
  "description": "Core relational database concepts",
  "color": "#6366f1",
  "task_count": 5,
  "completed_task_count": 2,
  "material_count": 3,
  "created_at": "2026-08-30T10:00:00Z"
}
```

**POST/PATCH body:**
```json
{ "name": "Database Systems", "description": "...", "color": "#6366f1" }
```

### 3.4 Task Routes (`/api/v1/tasks`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/tasks` | Bearer | List tasks (filterable, sortable) |
| POST | `/tasks` | Bearer | Create task |
| GET | `/tasks/{id}` | Bearer | Get task detail |
| PATCH | `/tasks/{id}` | Bearer | Update task fields |
| DELETE | `/tasks/{id}` | Bearer | Delete task |
| POST | `/tasks/{id}/complete` | Bearer | Mark task complete |

**Query parameters for `GET /tasks`:**
- `course_id` — filter by course UUID
- `status` — `not_started` | `in_progress` | `completed`
- `task_type` — `task` | `exam` | `assignment` | `reading` | `project`
- `priority` — `low` | `medium` | `high`
- `deadline_from` — ISO date (inclusive)
- `deadline_to` — ISO date (inclusive)
- `sort_by` — `deadline` | `priority` | `estimated_hours` | `created_at` (default: `deadline`)
- `sort_order` — `asc` | `desc` (default: `asc`)

**Task schema:**
```json
{
  "id": "uuid",
  "course_id": "uuid",
  "course_name": "Database Systems",
  "course_color": "#6366f1",
  "title": "Write ER diagram",
  "description": "...",
  "task_type": "assignment",
  "status": "not_started",
  "priority": "high",
  "difficulty": 3,
  "estimated_hours": 2.5,
  "deadline": "2026-09-05",
  "completed_at": null,
  "is_overdue": true,
  "created_at": "...",
  "updated_at": "..."
}
```
`is_overdue` is a computed field: `deadline < today AND status != 'completed'`.

**POST/PATCH body:**
```json
{
  "course_id": "uuid",
  "title": "Write ER diagram",
  "description": "...",
  "task_type": "assignment",
  "priority": "high",
  "difficulty": 3,
  "estimated_hours": 2.5,
  "deadline": "2026-09-05"
}
```

### 3.5 Study Material Routes (`/api/v1/materials`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/materials` | Bearer | List materials (filter by `course_id`) |
| POST | `/materials/upload` | Bearer (multipart) | Upload a file |
| POST | `/materials/paste` | Bearer | Save pasted text |
| GET | `/materials/{id}` | Bearer | Get material detail (includes extracted text) |
| DELETE | `/materials/{id}` | Bearer | Delete material + storage object |

**POST `/materials/upload`** — `multipart/form-data`
```
Fields:
  file      (required) — binary file content
  title     (required) — display name
  course_id (optional) — UUID
```
```json
// Response 201
{
  "id": "uuid",
  "title": "Database Lecture 3",
  "source_type": "pdf",
  "original_filename": "lecture3.pdf",
  "file_size_bytes": 204800,
  "extraction_warning": false,
  "course_id": "uuid",
  "created_at": "..."
}
```

**POST `/materials/paste`**
```json
// Request
{ "title": "My notes on joins", "content": "...", "course_id": "uuid" }

// Response 201 — same shape as upload response, source_type: "pasted_text"
```

### 3.6 AI Routes (`/api/v1/ai`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/ai/assistant/chat` | Bearer | Ask a question over study material |
| POST | `/ai/assistant/summarize` | Bearer | Summarize a document |
| POST | `/ai/assistant/key-points` | Bearer | Extract key points from a document |
| POST | `/ai/assistant/quiz` | Bearer | Generate quiz questions from a document |
| POST | `/ai/prioritize` | Bearer | AI task prioritization |
| GET | `/ai/prioritize/latest` | Bearer | Get the latest stored prioritization result |

**POST `/ai/assistant/chat`**
```json
// Request
{
  "material_ids": ["uuid", "uuid"],   // up to 3 materials as context
  "question": "What is a foreign key?",
  "history": [                         // last ≤10 turns
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}

// Response 200
{
  "answer": "A foreign key is...",
  "grounded_in_material": true    // true if answer references uploaded content
}
```

**POST `/ai/assistant/summarize`**
```json
// Request
{ "material_id": "uuid" }

// Response 200
{ "summary": "This document covers..." }
```

**POST `/ai/assistant/key-points`**
```json
// Request
{ "material_id": "uuid" }

// Response 200
{
  "key_points": [
    { "point": "Normalisation reduces data redundancy", "importance": "high" },
    { "point": "BCNF is stricter than 3NF", "importance": "medium" }
  ]
}
```

**POST `/ai/assistant/quiz`**
```json
// Request
{ "material_id": "uuid" }

// Response 200
{
  "questions": [
    {
      "question": "What does ACID stand for?",
      "options": ["Atomicity, Consistency, Isolation, Durability", "..."],
      "correct_answer": "Atomicity, Consistency, Isolation, Durability",
      "explanation": "ACID properties ensure reliable transaction processing."
    }
  ]
}
```

**POST `/ai/prioritize`**
```json
// Request — no body; backend reads all pending/in-progress tasks for this user

// Response 200
{
  "generated_at": "2026-08-30T10:00:00Z",
  "prioritized_tasks": [
    {
      "task_id": "uuid",
      "task_title": "Database Assignment",
      "priority_rank": 1,
      "explanation": "Due tomorrow and requires an estimated 3 hours — start immediately."
    }
  ]
}
```

### 3.7 Study Plan Routes (`/api/v1/plan`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/plan/generate` | Bearer | Generate (or regenerate) study plan |
| GET | `/plan` | Bearer | Get current active plan sessions |
| GET | `/plan/today` | Bearer | Get today's sessions only |
| PATCH | `/plan/sessions/{id}/complete` | Bearer | Mark a session as completed |

**POST `/plan/generate`**
```json
// Request
{
  "available_hours_per_day": 4.0,
  "start_date": "2026-09-01",
  "end_date": "2026-09-07"
}

// Response 200
{
  "generated_at": "2026-08-30T10:00:00Z",
  "session_count": 14,
  "sessions": [
    {
      "id": "uuid",
      "session_date": "2026-09-01",
      "course_id": "uuid",
      "course_name": "Database Systems",
      "course_color": "#6366f1",
      "task_id": "uuid",
      "task_title": "Write ER diagram",
      "duration_minutes": 90,
      "session_type": "assignment",
      "rationale": "Due in 4 days and rated high priority.",
      "is_completed": false
    }
  ]
}
```

**GET `/plan`**
Returns all sessions for the current plan, grouped by date:
```json
{
  "generated_at": "2026-08-30T10:00:00Z",
  "sessions_by_date": {
    "2026-09-01": [ /* session objects */ ],
    "2026-09-02": [ /* session objects */ ]
  }
}
```

### 3.8 Dashboard Aggregation

The dashboard data is assembled from existing endpoints on the frontend — no dedicated dashboard endpoint is needed. React Query parallel queries fetch:
- `GET /tasks?status=not_started,in_progress&deadline_to=<7 days from now>`
- `GET /tasks?task_type=exam&deadline_to=<14 days from now>`
- `GET /plan/today`
- `GET /ai/prioritize/latest`
- `GET /courses` (for progress summaries)

This avoids a bespoke `/dashboard` endpoint, keeps the API composable, and React Query handles caching and parallel loading.

### 3.9 Progress Data

Progress stats are derived from tasks. The frontend computes:
- Completion rate per course from `GET /courses/{id}/stats`
- Planned hours (sum of `estimated_hours` for all tasks belonging to user)
- Completed hours (sum of `estimated_hours` for completed tasks)
- Timeline: `GET /tasks?status=completed` sorted by `completed_at`, grouped by day

No dedicated progress endpoint needed for MVP.

### 3.10 Health Check

```
GET /health → 200 { "status": "ok", "timestamp": "..." }
```

---

## 4. Backend Architecture

### 4.1 Directory Structure

```
backend/
├── app/
│   ├── main.py               # FastAPI app factory, middleware, router registration
│   ├── core/
│   │   ├── config.py         # Settings class (pydantic-settings, reads .env)
│   │   ├── database.py       # Async engine, SessionLocal, get_db dependency
│   │   ├── security.py       # JWT encode/decode, bcrypt hash/verify, token deps
│   │   └── dependencies.py   # get_current_user, pagination params
│   ├── models/
│   │   ├── __init__.py
│   │   ├── base.py           # DeclarativeBase, TimestampMixin
│   │   ├── user.py
│   │   ├── course.py
│   │   ├── task.py
│   │   ├── study_material.py
│   │   ├── study_plan.py     # study_plan_sessions
│   │   ├── ai_prioritization.py
│   │   └── refresh_token.py
│   ├── schemas/
│   │   ├── auth.py
│   │   ├── course.py
│   │   ├── task.py
│   │   ├── material.py
│   │   ├── plan.py
│   │   └── ai.py             # all AI request/response schemas
│   ├── api/
│   │   ├── __init__.py
│   │   ├── router.py         # aggregates all routers under /api/v1
│   │   ├── auth.py
│   │   ├── courses.py
│   │   ├── tasks.py
│   │   ├── materials.py
│   │   ├── ai.py
│   │   └── plan.py
│   └── services/
│       ├── ai_service.py     # AIService ABC + GeminiAIService
│       ├── storage_service.py # StorageService ABC + LocalStorageService + SupabaseStorageService
│       ├── material_service.py # text extraction (pypdf, plain text)
│       ├── task_service.py   # task CRUD + computed fields
│       ├── plan_service.py   # plan generation orchestration
│       └── auth_service.py   # register/login/refresh logic
├── alembic/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/             # migration files
├── alembic.ini
├── requirements.txt
├── .env.example
└── Dockerfile                # for Render deployment
```

### 4.2 Application Entry Point (`main.py`)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.router import api_router

app = FastAPI(title="Study Coach API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,  # ["https://yourdomain.vercel.app"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
async def health():
    return {"status": "ok"}
```

### 4.3 Configuration (`core/config.py`)

All configuration via environment variables using `pydantic-settings`:

```python
class Settings(BaseSettings):
    # Database
    DATABASE_URL: str                    # postgresql+asyncpg://...

    # Auth
    JWT_SECRET_KEY: str                  # min 32 random chars
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # AI
    GEMINI_API_KEY: str
    GEMINI_MODEL: str = "gemini-2.5-flash"

    # Storage
    STORAGE_BACKEND: str = "local"       # "local" | "supabase"
    STORAGE_LOCAL_PATH: str = "./uploads"
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    SUPABASE_BUCKET: str = "study-materials"

    # CORS
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173"]

    model_config = SettingsConfigDict(env_file=".env")
```

### 4.4 AI Service Layer

#### Abstract base class
```python
from abc import ABC, abstractmethod
from app.schemas.ai import (
    KeyPoint, QuizQuestion, StudySession, PrioritizedTask, ChatMessage
)

class AIService(ABC):

    @abstractmethod
    async def answer_question(
        self,
        material_context: list[str],
        question: str,
        history: list[ChatMessage],
    ) -> tuple[str, bool]:
        """Returns (answer_text, grounded_in_material)."""

    @abstractmethod
    async def summarize(self, material_context: str) -> str: ...

    @abstractmethod
    async def extract_key_points(self, material_context: str) -> list[KeyPoint]: ...

    @abstractmethod
    async def generate_quiz(self, material_context: str) -> list[QuizQuestion]: ...

    @abstractmethod
    async def generate_study_plan(
        self,
        tasks: list[dict],
        available_hours_per_day: float,
        start_date: date,
        end_date: date,
    ) -> list[StudySession]: ...

    @abstractmethod
    async def prioritize_tasks(self, tasks: list[dict]) -> list[PrioritizedTask]: ...
```

#### Gemini implementation
```python
import google.generativeai as genai
import asyncio, json
from app.core.config import settings

class GeminiAIService(AIService):

    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self._model = genai.GenerativeModel(
            model_name=settings.GEMINI_MODEL,
            system_instruction=STUDY_COACH_SYSTEM_PROMPT,
        )

    async def _generate(self, prompt: str, timeout: float = 60.0) -> str:
        """Wraps the synchronous Gemini SDK call in a thread executor."""
        loop = asyncio.get_event_loop()
        response = await asyncio.wait_for(
            loop.run_in_executor(None, lambda: self._model.generate_content(prompt)),
            timeout=timeout,
        )
        return response.text

    async def generate_study_plan(self, tasks, available_hours_per_day, start_date, end_date):
        prompt = build_plan_prompt(tasks, available_hours_per_day, start_date, end_date)
        raw = await self._generate(prompt)
        # Parse JSON from response; raise ValueError if unparseable
        data = extract_json_from_response(raw)
        return [StudySession(**s) for s in data]

    # ... other methods follow same pattern: build prompt → _generate → parse
```

#### Dependency injection

```python
# app/core/dependencies.py
from functools import lru_cache
from app.services.ai_service import AIService, GeminiAIService

@lru_cache(maxsize=1)
def get_ai_service() -> AIService:
    return GeminiAIService()

# In routes:
# ai_service: AIService = Depends(get_ai_service)
```

This means the concrete service is instantiated once, and routes never import `GeminiAIService` directly — only the abstract `AIService`.

### 4.5 Storage Service Layer

```python
class StorageService(ABC):
    @abstractmethod
    async def store(self, file_bytes: bytes, key: str, content_type: str) -> str:
        """Store file and return the storage key."""

    @abstractmethod
    async def delete(self, key: str) -> None: ...

    @abstractmethod
    def get_url(self, key: str) -> str: ...


class LocalStorageService(StorageService):
    """Development only. Stores files in ./uploads/{key}."""
    ...

class SupabaseStorageService(StorageService):
    """Production. Uses Supabase Storage REST API."""
    ...
```

Selected via `settings.STORAGE_BACKEND`:
```python
@lru_cache(maxsize=1)
def get_storage_service() -> StorageService:
    if settings.STORAGE_BACKEND == "supabase":
        return SupabaseStorageService()
    return LocalStorageService()
```

### 4.6 Prompt Engineering

All prompts follow this structure:

**System prompt (set once on model instantiation):**
```
You are a personal academic study coach helping a university student.
Your role is to help students understand their study material, plan their
study time effectively, and prioritize their academic tasks intelligently.

When answering questions about study material:
- Ground your answer in the provided document excerpts
- Clearly indicate if you are drawing on general knowledge not in the material
- Be concise, clear, and encouraging

For structured outputs (study plans, prioritizations, quizzes, key points):
- Always return valid JSON matching the requested schema exactly
- Do not include explanation text outside the JSON structure
```

**Study plan prompt template:**
```
Generate a study plan for the following student.

Available study hours per day: {available_hours}
Planning period: {start_date} to {end_date}

Pending tasks (JSON):
{tasks_json}

Rules:
1. Do not schedule more than {available_hours} hours per day
2. Prioritize by deadline proximity, then difficulty, then priority label
3. For tasks with task_type="exam", add a revision session 1-2 days before
4. Break tasks larger than 2 hours into multiple sessions
5. Include a brief rationale for each session

Return ONLY a JSON array with this exact structure:
[{
  "date": "YYYY-MM-DD",
  "course_id": "uuid or null",
  "task_id": "uuid or null",
  "task_title": "string",
  "duration_minutes": integer,
  "session_type": "study|revision|exam_prep|assignment",
  "rationale": "string"
}]
```

**Error recovery for malformed JSON:** The `extract_json_from_response` utility searches the response text for the first `[` or `{` character, extracts to the matching close bracket, and attempts `json.loads`. If parsing fails after one retry with an explicit correction prompt, the endpoint returns HTTP 503.

### 4.7 Error Handling

All AI routes are wrapped with:
```python
try:
    result = await ai_service.some_method(...)
except asyncio.TimeoutError:
    raise HTTPException(503, detail="AI service timed out. Please try again.")
except ValueError as e:          # JSON parsing failure
    raise HTTPException(503, detail="AI returned an unexpected response. Please try again.")
except Exception as e:
    logger.error(f"AI error [{feature}]: {type(e).__name__}")
    raise HTTPException(503, detail="AI service is temporarily unavailable.")
```

All 503 responses from AI routes carry `"code": "AI_UNAVAILABLE"` so the frontend can show a consistent retry UI.

---

## 5. Frontend Architecture

### 5.1 Directory Structure

```
frontend/
├── public/
│   └── favicon.svg
├── src/
│   ├── main.tsx                  # React root, QueryClientProvider, Router
│   ├── App.tsx                   # Route definitions
│   ├── types/
│   │   └── index.ts              # All shared TypeScript interfaces (Task, Course, etc.)
│   ├── lib/
│   │   ├── api.ts                # Axios instance with auth interceptors
│   │   ├── queryKeys.ts          # React Query key constants
│   │   └── utils.ts              # Date formatting, class name helpers
│   ├── store/
│   │   └── authStore.ts          # Zustand: { user, accessToken, setAuth, clearAuth }
│   ├── hooks/
│   │   ├── useAuth.ts            # Login/logout/register mutations
│   │   ├── useCourses.ts         # useQuery/useMutation for courses
│   │   ├── useTasks.ts           # useQuery/useMutation for tasks
│   │   ├── useMaterials.ts       # useQuery/useMutation for materials
│   │   ├── usePlan.ts            # useQuery/useMutation for study plan
│   │   └── useAI.ts              # useMutation for all AI endpoints
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx     # Sidebar + top bar for authenticated pages
│   │   │   └── AuthLayout.tsx    # Centered card layout for login/register
│   │   ├── ui/                   # Reusable primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ErrorMessage.tsx
│   │   │   └── ConfirmDialog.tsx
│   │   ├── tasks/
│   │   │   ├── TaskCard.tsx
│   │   │   ├── TaskForm.tsx
│   │   │   ├── TaskFilters.tsx
│   │   │   └── TaskList.tsx
│   │   ├── courses/
│   │   │   ├── CourseCard.tsx
│   │   │   └── CourseForm.tsx
│   │   ├── materials/
│   │   │   ├── MaterialCard.tsx
│   │   │   ├── UploadForm.tsx
│   │   │   └── PasteForm.tsx
│   │   ├── plan/
│   │   │   ├── WeeklyPlanView.tsx
│   │   │   ├── DayColumn.tsx
│   │   │   └── SessionCard.tsx
│   │   ├── assistant/
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   ├── QuizDisplay.tsx
│   │   │   └── KeyPointsDisplay.tsx
│   │   ├── dashboard/
│   │   │   ├── UpcomingDeadlines.tsx
│   │   │   ├── TodaysSessions.tsx
│   │   │   ├── AIRecommendations.tsx
│   │   │   └── CourseProgressBar.tsx
│   │   └── progress/
│   │       ├── CompletionChart.tsx
│   │       ├── HoursComparisonBar.tsx
│   │       └── CourseStatCard.tsx
│   └── pages/
│       ├── LandingPage.tsx
│       ├── LoginPage.tsx
│       ├── RegisterPage.tsx
│       ├── DashboardPage.tsx
│       ├── TasksPage.tsx
│       ├── MaterialsPage.tsx
│       ├── AssistantPage.tsx
│       ├── PlannerPage.tsx
│       └── ProgressPage.tsx
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── .env.example
└── package.json
```

### 5.2 Routing

```tsx
// App.tsx — using React Router v6
<Routes>
  {/* Public */}
  <Route path="/" element={<LandingPage />} />
  <Route element={<AuthLayout />}>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
  </Route>

  {/* Protected */}
  <Route element={<ProtectedRoute />}>
    <Route element={<AppLayout />}>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/tasks" element={<TasksPage />} />
      <Route path="/materials" element={<MaterialsPage />} />
      <Route path="/assistant" element={<AssistantPage />} />
      <Route path="/planner" element={<PlannerPage />} />
      <Route path="/progress" element={<ProgressPage />} />
    </Route>
  </Route>

  <Route path="*" element={<Navigate to="/dashboard" replace />} />
</Routes>
```

`ProtectedRoute` reads the access token from Zustand. If absent, redirects to `/login`.

### 5.3 Authentication Flow

```
1. User submits login form
2. POST /api/v1/auth/login
   → Response: { access_token, expires_in }
   → Browser sets httpOnly refresh_token cookie automatically
3. authStore.setAuth({ user, accessToken }) — stored in memory
4. Axios interceptor: attach Bearer token to every request
5. On 401 response from API:
   → Interceptor fires POST /api/v1/auth/refresh (cookie sent automatically)
   → New access_token received → retry original request
   → If refresh also fails → clearAuth() → redirect to /login
6. On page reload:
   → accessToken is gone (in-memory)
   → Silent refresh: POST /api/v1/auth/refresh on app mount
   → If cookie still valid → user stays logged in
   → If cookie expired → redirect to /login
```

### 5.4 State Management Strategy

| State Type | Tool | Reason |
|---|---|---|
| Server data (tasks, courses, plan) | React Query | Caching, background refetch, loading/error states, cache invalidation |
| Auth (user, token) | Zustand | Global, synchronous, simple — no server interaction pattern needed |
| Form state | React Hook Form | Validation, field state, submission — no extra library needed |
| UI state (modal open, filter values) | `useState` / `useReducer` | Local to the component tree — no global state needed |

React Query key structure (from `queryKeys.ts`):
```typescript
export const queryKeys = {
  courses: {
    all: ['courses'] as const,
    detail: (id: string) => ['courses', id] as const,
    stats: (id: string) => ['courses', id, 'stats'] as const,
  },
  tasks: {
    all: (filters?: TaskFilters) => ['tasks', filters] as const,
    detail: (id: string) => ['tasks', id] as const,
  },
  materials: {
    all: (courseId?: string) => ['materials', { courseId }] as const,
    detail: (id: string) => ['materials', id] as const,
  },
  plan: {
    current: ['plan'] as const,
    today: ['plan', 'today'] as const,
  },
  ai: {
    prioritization: ['ai', 'prioritization'] as const,
  },
}
```

### 5.5 API Client (`lib/api.ts`)

```typescript
import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,   // sends httpOnly refresh cookie
})

// Attach access token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Silent refresh on 401
let isRefreshing = false
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      if (!isRefreshing) {
        isRefreshing = true
        try {
          const { data } = await axios.post(
            `${import.meta.env.VITE_API_URL}/api/v1/auth/refresh`,
            {}, { withCredentials: true }
          )
          useAuthStore.getState().setAccessToken(data.access_token)
        } catch {
          useAuthStore.getState().clearAuth()
          window.location.href = '/login'
          return Promise.reject(error)
        } finally { isRefreshing = false }
      }
      error.config._retry = true
      error.config.headers.Authorization =
        `Bearer ${useAuthStore.getState().accessToken}`
      return api(error.config)
    }
    return Promise.reject(error)
  }
)

export default api
```

### 5.6 Environment Variables (Frontend)

```bash
# .env.example (frontend)
VITE_API_URL=http://localhost:8000
```

Only one variable. The API URL points to the backend. No AI keys, no database credentials — ever.

---

## 6. Data Flow: Key Scenarios

### 6.1 Generating a Study Plan

```
User clicks "Generate Plan" with inputs
  │
  ▼
POST /api/v1/plan/generate
  │
  ▼ PlanRouter
plan_service.generate(user_id, available_hours, start, end)
  │
  ├── Fetch all pending/in-progress tasks for user from DB
  ├── Fetch upcoming exam tasks (task_type='exam') within 21 days
  │
  ▼ ai_service.generate_study_plan(tasks, hours, start, end)
  │
  ├── Build structured prompt with task data + constraints
  ├── Call Gemini API (async, 60s timeout)
  ├── Parse JSON response → validate as list[StudySession]
  │
  ▼ Back in plan_service:
  ├── DELETE existing study_plan_sessions for user
  ├── INSERT new sessions (bulk insert)
  │
  ▼ Return sessions to router → serialize → HTTP 200
  │
  ▼ Frontend:
  ├── React Query invalidates ['plan'] and ['plan', 'today']
  └── WeeklyPlanView renders new schedule
```

### 6.2 Asking a Question in the AI Assistant

```
User types question, selects up to 3 materials
  │
  ▼
POST /api/v1/ai/assistant/chat
  │
  ▼ AIRouter
  ├── Fetch extracted_text for each material_id (validate ownership)
  ├── Truncate each to 50,000 chars
  ├── Truncate history to last 10 turns
  │
  ▼ ai_service.answer_question(contexts, question, history)
  │
  ├── Build prompt: system role + material excerpts + history + question
  ├── Call Gemini → parse response
  ├── Detect grounding: check if answer references material-specific terms
  │
  ▼ Return { answer, grounded_in_material }
  │
  ▼ Frontend:
  └── ChatWindow appends message to local history state
      (history is frontend-managed; not persisted to DB)
```

### 6.3 Completing a Task and Adaptive Prompt

```
User clicks "Mark Complete" on a task
  │
  ▼
POST /api/v1/tasks/{id}/complete
  ├── Sets status='completed', completed_at=now()
  │
  ▼ HTTP 200 → React Query invalidates:
  ├── ['tasks'] (all task lists update)
  ├── ['courses'] (completion counts update)
  ├── ['plan', 'today'] (today's sessions refresh)
  │
  ▼ Frontend DashboardPage:
  └── Shows toast: "Task completed! Your study plan may be outdated."
      [Regenerate Plan] button → navigates to /planner with flag to auto-open form
```

---

## 7. Security Implementation

### 7.1 JWT Implementation

- Access token: HS256, 15-minute TTL, payload `{ sub: user_id, exp, iat, type: "access" }`
- Refresh token: random 256-bit token (not JWT), stored as bcrypt hash in `refresh_tokens` table
- Refresh rotation: every refresh request issues a new refresh token and deletes the old one
- `get_current_user` FastAPI dependency:
  ```python
  async def get_current_user(
      token: str = Depends(oauth2_scheme),
      db: AsyncSession = Depends(get_db),
  ) -> User:
      payload = decode_access_token(token)      # raises 401 on invalid/expired
      user = await db.get(User, payload["sub"]) # raises 401 if not found
      return user
  ```

### 7.2 File Upload Security

1. MIME type validated against allowlist: `{"application/pdf", "text/plain", "text/markdown"}`
2. File size checked before reading content: reject if > 10 MB
3. File stored with UUID-based key: `{user_id}/{uuid4()}.{ext}` — not the original filename
4. Original filename stored in DB for display only; never used as a path
5. Extracted text is the only content passed to the AI; raw file bytes never leave the storage service
6. `MATERIAL-09`: files are never executed; Python reads them as bytes and passes to `pypdf` or decodes as UTF-8 text

### 7.3 Input Validation

All request bodies validated by Pydantic v2 schemas. Key constraints:
- `title`: max 500 chars, required, stripped of leading/trailing whitespace
- `color`: validated as hex color pattern `^#[0-9a-fA-F]{6}$`
- `deadline`: validated as ISO date, must not be in the past (warning only, not error — students may have inherited overdue tasks)
- `estimated_hours`: 0.25–100.0, 2 decimal places
- `difficulty`: 1–5 integer
- `available_hours_per_day`: 0.5–16.0
- `material_ids` in chat: max 3 items

### 7.4 CORS

```python
# Development
ALLOWED_ORIGINS = ["http://localhost:5173"]

# Production
ALLOWED_ORIGINS = ["https://<app>.vercel.app"]
```
No wildcard origins in production. Configured from `settings.ALLOWED_ORIGINS`.

---

## 8. Deployment Architecture

### 8.1 Infrastructure Diagram

```
Internet
    │
    ▼
Vercel CDN (frontend)                    Render (backend API)
  React SPA served as                      FastAPI on gunicorn
  static assets from                       + uvicorn workers
  global edge network                      (single instance, free tier)
    │                                           │
    │ HTTPS API calls                           │
    └──────────────────────────────────────────►│
                                                │
                                    ┌───────────┼──────────────┐
                                    │           │              │
                                    ▼           ▼              ▼
                               Neon DB    Supabase        Google
                             PostgreSQL   Storage         Gemini API
                             (managed)   (file uploads)
```

### 8.2 Environment Variables — Complete Reference

**Backend (set on Render):**
```bash
DATABASE_URL=postgresql+asyncpg://user:pass@host/dbname

JWT_SECRET_KEY=<256-bit random string>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

GEMINI_API_KEY=<your Gemini API key>
GEMINI_MODEL=gemini-2.5-flash

STORAGE_BACKEND=supabase
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_KEY=<service role key>
SUPABASE_BUCKET=study-materials

ALLOWED_ORIGINS=https://<app>.vercel.app
```

**Frontend (set on Vercel):**
```bash
VITE_API_URL=https://<backend>.onrender.com
```

### 8.3 Render Deployment

- Runtime: Python 3.11
- Build command: `pip install -r requirements.txt && alembic upgrade head`
- Start command: `gunicorn app.main:app -k uvicorn.workers.UvicornWorker -w 1 --bind 0.0.0.0:$PORT`
- Health check path: `/health`
- Free tier caveat: instance sleeps after 15 minutes of inactivity; first request after sleep takes ~30 seconds. Documented in README.

### 8.4 Vercel Deployment

- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_URL`

### 8.5 Database Migrations

Alembic is used for schema migrations. The build step on Render runs `alembic upgrade head` on every deploy, so migrations are applied automatically before the server starts.

Migration naming convention: `NNNN_description_of_change.py` (e.g., `0001_initial_schema.py`).

---

## 9. Key Dependencies

### 9.1 Backend (`requirements.txt`)

```
fastapi==0.115.0
uvicorn[standard]==0.30.0
gunicorn==22.0.0
sqlalchemy[asyncio]==2.0.35
asyncpg==0.29.0
alembic==1.13.2
pydantic==2.8.2
pydantic-settings==2.4.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.9
pypdf==4.3.1
google-generativeai==0.8.3
supabase==2.7.4
python-dotenv==1.0.1
httpx==0.27.2
```

### 9.2 Frontend (`package.json` key deps)

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0",
    "@tanstack/react-query": "^5.53.0",
    "zustand": "^4.5.5",
    "react-hook-form": "^7.53.0",
    "axios": "^1.7.5",
    "recharts": "^2.12.7",
    "date-fns": "^3.6.0",
    "lucide-react": "^0.436.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.2"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.5.3",
    "vite": "^5.4.2",
    "tailwindcss": "^3.4.10",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.41",
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0"
  }
}
```

---

## 10. Design Decisions and Trade-offs

| Decision | Alternative Considered | Reason for Choice |
|---|---|---|
| Async SQLAlchemy | Sync SQLAlchemy | AI calls block for up to 30s; async prevents starving all other requests |
| React Query for server state | Redux Toolkit Query | React Query is simpler, less boilerplate, better DX for this use case |
| No dedicated `/dashboard` endpoint | Single aggregation endpoint | Frontend parallel queries with React Query are as fast; avoids a bespoke endpoint that would need updating every time the dashboard changes |
| Recharts for charts | Chart.js, Nivo | Recharts is React-native, lightweight, sufficient for MVP bar/line charts |
| Pasted text as a material type | Separate "notes" entity | Keeps the data model unified; all AI context operations work identically for uploaded and pasted content |
| `task_type` enum on tasks | Separate `exams` table | Simpler schema; exam-specific behavior implemented via conditionals in prompts and queries |
| Gunicorn + Uvicorn on Render | Single uvicorn process | Gunicorn provides process management and graceful restarts; uvicorn workers provide ASGI |
| Plan sessions stored in DB | Generate on-the-fly | Persisting allows the dashboard to show today's sessions instantly without an AI call on every load |
| `ai_prioritizations` table (latest only) | Re-run AI on every dashboard load | Avoids an AI call on every dashboard open; user controls when to refresh |

---

## 11. Acceptance Criteria Mapping

Mapping key acceptance criteria from requirements.md to design decisions:

| Acceptance Criterion | Satisfied By |
|---|---|
| Register, login, access dashboard | AUTH routes + JWT + ProtectedRoute |
| Create courses, tasks, study materials | COURSE/TASK/MATERIAL routes + forms |
| AI Assistant answers grounded in material | `answer_question` with context + `grounded_in_material` flag |
| AI Planner generates structured weekly schedule | `generate_study_plan` → `study_plan_sessions` → `WeeklyPlanView` |
| AI Prioritization on dashboard | `prioritize_tasks` → `ai_prioritizations` → `AIRecommendations` component |
| Marking complete triggers plan-regeneration prompt | Task completion → React Query invalidation → toast with action |
| Progress screen with chart | `GET /courses/{id}/stats` + computed hours + `CompletionChart` (Recharts) |
| No secrets in frontend | `VITE_API_URL` only; all AI/DB/storage keys on backend |
| Graceful AI failure | `try/except` wrapper → HTTP 503 + `ErrorMessage` + retry button |
| CRUD works without AI | All AI calls are user-initiated; CRUD routes have no AI dependency |
| Overdue tasks visually distinguished | `is_overdue` computed field + red styling in `TaskCard` |

---

*End of Technical Design v1.0*
