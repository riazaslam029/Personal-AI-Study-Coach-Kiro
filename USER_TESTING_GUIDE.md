# 🧪 USER TESTING GUIDE
**Personal AI Study & Task Coach - Test Your Application**

---

## ✅ SERVERS ARE RUNNING

Both frontend and backend servers are currently running:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## 🎯 QUICK TEST SCENARIOS

### Scenario 1: Registration & Login Flow (5 minutes)

1. **Open Frontend** → http://localhost:5173

2. **Register New Account**:
   - Click "Sign up" link
   - Enter email: `yourname@test.com`
   - Enter password: `test123456`
   - Enter name: `Your Name`
   - Click "Register"
   - ✅ **Expected**: Automatically logged in → Dashboard

3. **Logout**:
   - Click your name (top right)
   - Click "Logout"
   - ✅ **Expected**: Redirected to login page

4. **Login Again**:
   - Enter same email/password
   - Click "Login"
   - ✅ **Expected**: Dashboard appears

5. **Refresh Page**:
   - Press F5 or Ctrl+R
   - ✅ **Expected**: Brief loading spinner → Dashboard (NOT blank page)
   - ✅ **Expected**: No redirect to login page

---

### Scenario 2: Create Course & Task (5 minutes)

1. **Create a Course**:
   - Click "Courses" in sidebar
   - Click "+ New Course"
   - Enter name: `Computer Science 101`
   - Enter code: `CS101`
   - Choose a color
   - Click "Create"
   - ✅ **Expected**: Course appears in list

2. **Create a Task**:
   - Click "Tasks" in sidebar
   - Click "+ New Task"
   - Enter title: `Assignment 1: Binary Trees`
   - Select course: `CS101`
   - Set task type: `Assignment`
   - Set priority: `High`
   - Set difficulty: `3/5`
   - Set estimated hours: `2.5`
   - Set due date: Next week
   - Click "Create"
   - ✅ **Expected**: Task appears in list

3. **Complete Task**:
   - Click on your task
   - Click "Mark as Complete"
   - ✅ **Expected**: Task status changes to "Completed"

---

### Scenario 3: Study Materials (3 minutes)

1. **Add Study Material**:
   - Click "Materials" in sidebar
   - Click "+ Add Material"
   - Select "Paste Text"
   - Enter title: `Chapter 1 Notes`
   - Select course: `CS101`
   - Paste some text:
     ```
     Binary trees are hierarchical data structures.
     Each node has at most two children: left and right.
     ```
   - Click "Save"
   - ✅ **Expected**: Material appears in list

2. **View Material**:
   - Click on your material
   - ✅ **Expected**: Material content displays

---

### Scenario 4: Dashboard Overview (2 minutes)

1. **Check Dashboard**:
   - Click "Dashboard" in sidebar
   - ✅ **Expected**: See sections for:
     - Today's Study Sessions (may be empty)
     - Upcoming Deadlines
     - Recent Tasks
     - Course Overview

2. **View Progress**:
   - Check if your completed task shows as completed
   - Check if upcoming task shows in deadlines

---

## ⚠️ KNOWN LIMITATIONS (Expected Behavior)

### AI Features Disabled (No API Key)
The following features will show errors or "AI service unavailable":
- ❌ AI Summarize
- ❌ AI Key Points
- ❌ Generate Quiz
- ❌ AI Chat Assistant
- ❌ Generate Study Plan
- ❌ AI Task Prioritization

**This is expected** - these require a Gemini API key.

**To enable**: Add `GEMINI_API_KEY` to `backend/.env`

---

## 🐛 WHAT TO WATCH FOR (Report if Found)

### ❌ Critical Issues (Should NOT happen)
1. **Blank page after login** → If this happens, clear browser cache and try again
2. **Login button does nothing** → Check browser console (F12) for errors
3. **Constant redirect to login page** → Check that cookies are enabled
4. **500 errors on any endpoint** → Check backend logs

### ⚠️ Minor Issues (Less critical)
1. Slow loading times (>3 seconds)
2. UI elements not aligned properly
3. Error messages not displaying
4. Forms not validating properly

---

## 🔍 HOW TO CHECK FOR ERRORS

### Frontend Errors (Browser Console)
1. Open browser (Chrome/Firefox)
2. Press F12 to open DevTools
3. Go to "Console" tab
4. Look for red error messages
5. **Report**: Any errors starting with "TypeError", "ReferenceError", etc.

### Backend Errors (Terminal)
1. Look at the terminal running backend
2. Watch for lines starting with "ERROR" or "CRITICAL"
3. **Report**: Any stack traces or error messages

---

## ✅ SUCCESS CRITERIA

Your application is working correctly if:

1. ✅ Can register new account
2. ✅ Can login with credentials
3. ✅ Dashboard loads after login (no blank page)
4. ✅ Page refresh keeps you logged in
5. ✅ Can create courses
6. ✅ Can create tasks
7. ✅ Can add study materials
8. ✅ Can complete tasks
9. ✅ Can logout
10. ✅ Can login again

---

## 🚨 EMERGENCY FIXES

### If Frontend Won't Load
```bash
cd frontend
rm -rf node_modules/.vite
npm run dev
```

### If Backend Shows Errors
```bash
cd backend
.venv/bin/alembic upgrade head
.venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### If Database Connection Fails
Check `backend/.env` has correct `DATABASE_URL`

### If Login Always Fails
1. Check `backend/.env` has `ALLOWED_ORIGINS` including your frontend port
2. Clear browser cookies for localhost
3. Try incognito/private mode

---

## 📊 AUTOMATED TEST RESULTS

The automated backend test has already been run:

**Results**: 20/23 endpoints PASS (87%)
- ✅ Auth endpoints working
- ✅ Course CRUD working
- ✅ Task CRUD working
- ✅ Material CRUD working
- ⚠️ AI endpoints need API key (expected)

---

## 🎉 NEXT STEPS AFTER TESTING

Once you've verified everything works:

1. **Add Gemini API Key** (to enable AI features):
   ```bash
   # Edit backend/.env
   GEMINI_API_KEY=your_api_key_here
   ```

2. **Test AI Features**:
   - Generate Study Plan
   - AI Summarize
   - AI Chat
   - Quiz Generation

3. **Deploy to Production**:
   - Frontend → Vercel
   - Backend → Render
   - Database → Already on Neon

---

## 📞 TESTING SUPPORT

If you encounter issues:

1. Check `AUDIT_COMPLETE.md` for detailed technical info
2. Check browser console (F12) for frontend errors
3. Check backend terminal for API errors
4. Verify `.env` files are configured correctly

**Current Status**: All critical bugs fixed, application is stable ✅

---

## 🕐 ESTIMATED TESTING TIME

- **Quick Test** (Scenarios 1-2): 10 minutes
- **Full Test** (All scenarios): 15 minutes
- **Exploratory Testing**: 30 minutes

---

**Happy Testing! 🚀**

If everything works as expected, your application is **PRODUCTION READY**.
