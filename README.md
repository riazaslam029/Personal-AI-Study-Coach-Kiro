# Personal AI Study & Task Coach

> An AI-first web app that turns a student's study materials, tasks, and deadlines into a personalized weekly study plan — powered by Google Gemini, backed by AWS S3.

**Built for the [Build with Kiro 2026 Hackathon](https://kiro.dev).**

**Live demo**
- 🎨 Frontend — https://personal-ai-study-coach-kiro.vercel.app
- ⚙️ Backend API — https://personal-ai-study-coach.onrender.com
- 📖 API docs (Swagger) — https://personal-ai-study-coach.onrender.com/docs

> ⏱️ The backend runs on Render's free tier and cold-starts after 15 min of inactivity. The first request may take ~30 seconds.

---

## What it does

| Feature | How AI is used |
|---|---|
| **Study Assistant** | Ask questions about your uploaded materials; the assistant grounds answers in your own PDFs and notes |
| **Auto Summaries** | One-click summary of any uploaded document |
| **Quiz Generation** | Generates multiple-choice quizzes with explanations from any material |
| **Key Points Extraction** | Pulls the highest-importance ideas from long readings |
| **Study Plan Generation** | Given your tasks, deadlines, and weekly availability, AI writes a session-by-session plan |
| **Task Prioritization** | AI ranks your open tasks by deadline, difficulty, and effort with a rationale |
| **Progress Tracking** | Planned vs completed study hours, per course and overall |

AI is the core engine, not a chatbot add-on. Every AI call goes through a single, typed contract (`AIService`) so the model provider is swappable.

---

## Tech stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS | React Query, Zustand, react-hook-form |
| Backend | Python 3.11, FastAPI | Async SQLAlchemy 2.x, Alembic migrations |
| Database | PostgreSQL 15 (Neon, prod) | Managed serverless Postgres |
| AI | Google Gemini `gemini-2.5-flash` | OpenRouter as fallback provider |
| File Storage | **AWS S3** (prod) / Local filesystem (dev) | Supabase Storage still supported as alternative |
| Auth | JWT (access 15 min + refresh 7 days), bcrypt | httpOnly refresh cookie, rotation on use |
| PDF Extraction | `pypdf` | Text extraction only, no OCR |
| Frontend hosting | Vercel (free tier) | |
| Backend hosting | Render (free tier) | |

---

## ☁️ AWS integration

This project uses **Amazon S3** as the primary production file store for user-uploaded study materials.

### Why S3

- **Private-by-default** — buckets stay non-public; the API serves files via short-lived presigned URLs
- **Scale + reliability** — 11 nines of durability, region-local reads (`ap-south-1`)
- **Cheap on credits** — AWS Free Tier covers 5 GB storage, 20K GET, 2K PUT per month
- **Clean fit for our abstraction** — `StorageService` was designed so backends are pluggable

### How it plugs in

Flip a single env var to switch storage backends:

```bash
STORAGE_BACKEND=s3          # or "local" for dev, "supabase" for the alt path
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-south-1
S3_BUCKET=study-coach-<yourname>
S3_PRESIGNED_URL_TTL=3600   # presigned GET URL lifetime, seconds
```

### Architecture

```
             ┌──────────────┐   upload PDF   ┌───────────────────┐
  React SPA ─┤  FastAPI API ├───────────────►│  StorageService   │
             └───────┬──────┘                └────────┬──────────┘
                     │                                │
              persist metadata               ┌────────┴────────┐
                     ▼                       │                 │
              ┌──────────────┐        LocalStorage      S3StorageService
              │ PostgreSQL   │        (dev fs)          (boto3 · sig v4 ·
              │ (Neon, prod) │                          asyncio.to_thread ·
              └──────────────┘                          presigned URLs)
                                                              │
                                                              ▼
                                                  ┌────────────────────┐
                                                  │  Amazon S3 bucket  │
                                                  │   (private + IAM)  │
                                                  └────────────────────┘
```

### Security posture

- Buckets have **Block Public Access ON**; bucket policies not required
- Backend authenticates with an **IAM user scoped to least-privilege** (`PutObject`, `GetObject`, `DeleteObject`, `ListBucket` on the one bucket only)
- Downloads served via **presigned URLs** with a 1-hour default TTL
- Signature v4 enforced (mandatory in `ap-south-1`)
- The same code path works with **EC2/ECS instance roles** in the future — if `AWS_ACCESS_KEY_ID` is empty, boto3 falls back to the default credential chain

Full setup steps (bucket, CORS, IAM policy JSON, verification) are in [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md#optional-aws-s3-file-storage).

---

## Project structure

```
build-with-kiro-2026/
├── .kiro/
│   ├── specs/study-coach/     # requirements.md, design.md, tasks.md
│   └── steering/              # project-wide rules for Kiro
├── backend/                   # FastAPI application
│   ├── app/
│   │   ├── api/               # Route handlers (auth, courses, tasks, materials, ai, plan)
│   │   ├── core/              # config, database, security, dependencies
│   │   ├── models/            # SQLAlchemy ORM models
│   │   ├── schemas/           # Pydantic request/response schemas
│   │   └── services/          # AIService, StorageService (Local/Supabase/S3), business logic
│   ├── alembic/               # Database migrations
│   ├── render.yaml            # Render deployment config (with S3 env vars)
│   └── requirements.txt
├── frontend/                  # React SPA
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       ├── lib/               # API client
│       └── store/             # Zustand state
├── DEPLOYMENT_GUIDE.md        # Neon + Render + Vercel + Supabase + S3 setup
├── start-backend.sh           # Local dev runner
├── start-frontend.sh          # Local dev runner
└── README.md
```

---

## Local development

### Prerequisites

- Python 3.11+
- Node.js 18+
- A PostgreSQL connection string (a free Neon DB works well)
- A Google Gemini API key from [aistudio.google.com](https://aistudio.google.com)

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate           # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env                # then edit .env, at minimum:
#   DATABASE_URL, GEMINI_API_KEY, JWT_SECRET_KEY

alembic upgrade head                # create tables
uvicorn app.main:app --reload       # → http://localhost:8000
```

Interactive API docs: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env                # VITE_API_URL=http://localhost:8000
npm run dev                         # → http://localhost:5173
```

### Shortcut

From the repo root:

```bash
./start-backend.sh       # in one terminal
./start-frontend.sh      # in another
```

---

## API surface

Base path: `/api/v1`

| Group | Endpoints |
|---|---|
| **Auth** | `POST /auth/register` · `POST /auth/login` · `POST /auth/refresh` · `POST /auth/logout` · `GET /auth/me` |
| **Courses** | `GET/POST /courses` · `GET/PATCH/DELETE /courses/{id}` |
| **Tasks** | `GET/POST /tasks` · `GET/PATCH/DELETE /tasks/{id}` · `POST /tasks/{id}/complete` |
| **Materials** | `POST /materials/upload` · `POST /materials/paste` · `GET /materials` · `DELETE /materials/{id}` |
| **AI Assistant** | `POST /ai/assistant/chat` · `POST /ai/assistant/summarize` · `POST /ai/assistant/quiz` · `POST /ai/assistant/key-points` |
| **Prioritization** | `POST /ai/prioritize` |
| **Study Plan** | `POST /plan/generate` · `GET /plan/current` · `GET /plan/today` |

Health check: `GET /health` (unversioned)

---

## AI service contract

All model calls flow through one abstraction so the provider is replaceable:

```python
class AIService:  # base / interface
    async def answer_question(material_context, question, history) -> str: ...
    async def summarize(material_context) -> str: ...
    async def extract_key_points(material_context) -> list[KeyPoint]: ...
    async def generate_quiz(material_context) -> list[QuizQuestion]: ...
    async def generate_study_plan(tasks, available_hours, date_range) -> list[StudySession]: ...
    async def prioritize_tasks(tasks) -> list[PrioritizedTask]: ...

class GeminiAIService(AIService): ...   # concrete: gemini-2.5-flash
```

Every structured output is validated with Pydantic before it reaches the API.

**Guardrails**
- Max 10 MB per uploaded file
- Max 50,000 chars of material passed to the model per query
- Max 3 documents per query
- Conversation history capped at the last 10 turns

---

## Security

- No API keys in source control — `.env` is gitignored, `.env.example` documents the shape
- All DB access via SQLAlchemy ORM — no raw SQL string interpolation
- Bcrypt password hashing (cost 10 for MVP throughput; production target ≥ 12)
- JWT secrets from env, minimum 256-bit entropy
- Refresh tokens rotate on every use and are stored in httpOnly cookies
- Uploaded files stored as bytes, never executed
- AI output rendered as plain text (no `dangerouslySetInnerHTML`)
- CORS locked to the Vercel frontend origin in production
- S3 buckets are private; downloads only via presigned URLs with a short TTL

---

## Deployment

Full walkthrough for Neon + Render + Vercel + AWS S3 is in [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md).

TL;DR:

| Component | Provider | Free tier | Notes |
|---|---|---|---|
| Frontend | Vercel | Yes | Static build from `frontend/` |
| Backend | Render | Yes | Cold start ~30s after 15 min idle |
| Database | Neon | Yes | Managed Postgres 15+ |
| File storage | **AWS S3** | 5 GB + 12 months | Private bucket, presigned URLs |
| AI model | Google Gemini | Free quota | `gemini-2.5-flash` |

---

## Known limitations (MVP scope)

- Backend cold-starts on Render free tier — documented behavior
- Email + password auth only, no OAuth
- Study plan history keeps the **latest** plan only (regeneration replaces it)
- Progress tracking is planned vs completed hours (no timer, no time-logging)
- Adaptive planning requires a manual regeneration trigger

---

## Built with Kiro

This project was designed and built spec-first inside [Kiro IDE](https://kiro.dev). The full spec — requirements, design, and task list — lives in `.kiro/specs/study-coach/`.

## License

MIT — built for educational purposes as part of the Build with Kiro 2026 Hackathon.
