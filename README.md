# Personal AI Study & Task Coach

Built for the **Build with Kiro 2026 Hackathon**.

An AI-powered web application that transforms study materials, tasks, and deadlines into personalized, intelligent study plans.

## Features

- **AI Study Assistant**: Ask questions, get summaries, generate quizzes from your study materials
- **Smart Study Planning**: AI generates personalized weekly schedules based on your tasks and availability
- **Task Prioritization**: AI analyzes deadlines, difficulty, and priority to recommend what to work on next
- **Progress Tracking**: Visualize completion rates and study hours
- **Course Management**: Organize tasks and materials by course
- **Study Material Upload**: PDF, TXT, and Markdown support with automatic text extraction

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS |
| Backend | Python 3.11+, FastAPI |
| Database | PostgreSQL 15+ (Neon) |
| AI | Google Gemini `gemini-2.5-flash` |
| Auth | JWT access + refresh tokens, bcrypt |
| Storage | Supabase Storage (prod), local filesystem (dev) |

## Project Structure

```
build-with-kiro-2026/
├── backend/          # FastAPI application
│   ├── app/
│   │   ├── api/      # Route handlers
│   │   ├── models/   # SQLAlchemy ORM models
│   │   ├── schemas/  # Pydantic schemas
│   │   ├── services/ # Business logic + AI service
│   │   └── core/     # Config, security, database
│   ├── alembic/      # Database migrations
│   └── requirements.txt
└── frontend/         # React SPA
    └── src/
        ├── components/
        ├── pages/
        ├── hooks/
        ├── lib/      # API client, utilities
        └── store/    # Zustand state management
```

## Setup Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL database (or Neon account)
- Google Gemini API key

### Backend Setup

1. **Create a Python virtual environment:**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and add your:
   # - DATABASE_URL (PostgreSQL connection string)
   # - GEMINI_API_KEY (from Google AI Studio)
   # - JWT_SECRET_KEY (generate with: openssl rand -hex 32)
   ```

4. **Run database migrations:**
   ```bash
   alembic upgrade head
   ```

5. **Start the backend server:**
   ```bash
   uvicorn app.main:app --reload
   ```

   Backend will run at `http://localhost:8000`
   API docs available at `http://localhost:8000/docs`

### Frontend Setup

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env if your backend runs on a different port
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

   Frontend will run at `http://localhost:5173`

## API Documentation

Once the backend is running, visit `http://localhost:8000/docs` for the interactive API documentation (Swagger UI).

### Key API Endpoints

- **Auth**: `/api/v1/auth/register`, `/api/v1/auth/login`, `/api/v1/auth/refresh`, `/api/v1/auth/logout`
- **Courses**: `/api/v1/courses`
- **Tasks**: `/api/v1/tasks`
- **Materials**: `/api/v1/materials/upload`, `/api/v1/materials/paste`
- **AI Assistant**: `/api/v1/ai/assistant/chat`, `/api/v1/ai/assistant/summarize`, `/api/v1/ai/assistant/quiz`
- **Study Plan**: `/api/v1/plan/generate`, `/api/v1/plan/today`
- **Prioritization**: `/api/v1/ai/prioritize`

## Security Notes

- All API keys and secrets must be in `.env` files (never committed to git)
- `.env` is in `.gitignore`
- Access tokens expire after 15 minutes
- Refresh tokens rotate on every use (stored as httpOnly cookies)
- Passwords hashed with bcrypt (cost factor 12)
- All database queries use SQLAlchemy ORM (no raw SQL)
- File uploads validated (MIME type, size limit 10MB)
- CORS restricted to frontend origin in production

## Known Limitations

- **Free tier cold starts**: Backend deployed on Render free tier sleeps after 15 minutes of inactivity. First request after sleep takes ~30 seconds.
- **No OAuth**: MVP uses email + password authentication only.
- **Material limit**: 3 materials per AI query, 50,000 chars per material.
- **Conversation history**: Last 10 turns only (not persisted to database).
- **Study plan**: Latest plan only; replaced on regeneration.

## License

MIT License - Built for educational purposes as part of the Build with Kiro 2026 Hackathon.

## Acknowledgments

- Built with [Kiro IDE](https://kiro.dev)
- AI powered by Google Gemini
- Database hosted on Neon
- Storage powered by Supabase
