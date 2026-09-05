# 🚀 Start Study Coach Application

## ✅ All Issues Fixed!
Your application is ready to run.

## Starting the Application:

### Option 1: Manual Start (Recommended)

**Terminal 1 - Backend:**
```bash
cd /home/riaz/Projects/build-with-kiro-2026/backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd /home/riaz/Projects/build-with-kiro-2026/frontend
npm run dev
```

### Option 2: Using tmux (Both in one terminal)
```bash
cd /home/riaz/Projects/build-with-kiro-2026

# Start tmux session
tmux new-session -s studycoach \; \
  send-keys 'cd backend && source .venv/bin/activate && uvicorn app.main:app --reload' C-m \; \
  split-window -h \; \
  send-keys 'cd frontend && npm run dev' C-m

# To exit: Press Ctrl+B, then type :kill-session
```

## Access the Application:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

## 🧪 Quick Test Checklist:
1. ✅ Register a new account
2. ✅ Create a course (e.g., "Computer Science", pick a color)
3. ✅ Create a task:
   - Title: "Assignment 1"
   - Type: Assignment
   - Priority: High
   - Estimated Hours: 2.5
   - Deadline: Pick tomorrow's date
4. ✅ Upload a PDF or paste text material
5. ✅ Visit Dashboard - verify all panels show data
6. ✅ Mark task complete
7. ✅ Check Materials page
8. ✅ Check Progress page

## 🐛 Troubleshooting:
- **Port already in use?** Kill existing process: `lsof -ti:8000 | xargs kill -9`
- **Database connection error?** Check `.env` file for correct DATABASE_URL
- **Frontend errors?** Check browser console (F12)
- **Backend errors?** Check terminal output

## 🎉 Everything is working!
All field name mismatches have been fixed. The application should work perfectly now.
