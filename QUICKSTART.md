# Quick Start Guide — 5 Minutes to Running

## Prerequisites
- Python 3.11+ and Node.js 18+ installed
- PostgreSQL database (Neon recommended)
- Google Gemini API key

## Step 1: Backend Setup (2 minutes)

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add:
# - DATABASE_URL (your PostgreSQL connection string)
# - GEMINI_API_KEY (from Google AI Studio)
# - JWT_SECRET_KEY (generate with: openssl rand -hex 32)

# Run migrations
alembic upgrade head

# Start backend
uvicorn app.main:app --reload
```

Backend now running at **http://localhost:8000**  
API docs at **http://localhost:8000/docs**

## Step 2: Frontend Setup (2 minutes)

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Should contain: VITE_API_URL=http://localhost:8000

# Start frontend
npm run dev
```

Frontend now running at **http://localhost:5173**

## Step 3: Test It (1 minute)

1. Open http://localhost:5173
2. Click "Sign Up"
3. Create an account
4. You should be redirected to the dashboard

**You're ready!** 🎉

## Next Steps

- Upload study materials (PDF, TXT, or paste text)
- Create tasks with deadlines
- Ask AI questions about your materials
- Generate a personalized study plan

## Troubleshooting

**Backend won't start:**
- Check DATABASE_URL is correct
- Verify GEMINI_API_KEY is set
- Run `alembic upgrade head` if migration fails

**Frontend won't start:**
- Run `npm install` again
- Clear node_modules: `rm -rf node_modules && npm install`
- Check VITE_API_URL points to http://localhost:8000

**Can't login:**
- Check backend logs for errors
- Verify database connection
- Try registering a new account

## Development Commands

### Backend
```bash
# Run server with auto-reload
uvicorn app.main:app --reload

# Run migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "description"

# Python shell with app context
python -c "from app.main import app; print('OK')"
```

### Frontend
```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npx tsc --noEmit
```

## API Testing

The backend includes interactive API documentation:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

Try these endpoints:
1. POST `/api/v1/auth/register` — Create account
2. POST `/api/v1/auth/login` — Get access token
3. GET `/api/v1/auth/me` — Test authenticated request
4. POST `/api/v1/courses` — Create a course
5. POST `/api/v1/ai/assistant/chat` — Chat with AI

## Production Deployment

See **DEPLOYMENT.md** for full deployment guide to Vercel + Render.

Quick version:
1. Push to GitHub
2. Connect Render to deploy backend
3. Connect Vercel to deploy frontend
4. Set environment variables in both platforms
5. Done!

---

**Need help?** Check README.md, PROJECT_SUMMARY.md, or DEPLOYMENT.md for detailed documentation.
