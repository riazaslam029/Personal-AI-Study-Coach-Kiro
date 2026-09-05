# 🔧 Planner Troubleshooting Guide

## Issue: Plan generates but doesn't show sessions

### 🔍 **Step 1: Open Browser Console**

1. Open your app: http://localhost:5173/planner
2. Press **F12** (or Right-click → Inspect)
3. Click the **Console** tab
4. Keep it open while you generate the plan

### 🔍 **Step 2: Generate Plan and Watch Console**

1. Click **"Generate AI Plan"**
2. Fill in the form:
   - Start Date: Today
   - End Date: 7 days from now
   - Hours: 3-5 hours per day
3. Click **"Generate Plan"**

### 📊 **What to Look For:**

#### ✅ **Success Messages** (Good!):
```
Generating plan with data: {...}
Plan generated successfully: {...}
Plan generation mutation succeeded, invalidating queries
```

#### ❌ **Error Messages** (Problems):
```
Plan generation failed: ...
Error response: ...
```

---

## 🐛 Common Issues & Solutions

### **Issue 1: No tasks to plan**

**Symptom**: Plan loads but shows 0 sessions

**Solution**:
1. Go to **Tasks** page
2. Create 2-3 tasks with:
   - ✅ Status: "Not Started" or "In Progress" (NOT "Completed")
   - ✅ Deadline within next 2 weeks
   - ✅ Estimated hours: 2-5 hours each
3. Go back to Planner and try again

---

### **Issue 2: All tasks are completed**

**Symptom**: API returns `session_count: 0`

**Solution**:
- Create new tasks that are NOT completed
- Or change existing tasks from "Completed" to "In Progress"

---

### **Issue 3: Tasks too far in future**

**Symptom**: Sessions generated but outside your date range

**Solution**:
- Make sure task deadlines are within your plan's date range
- Or extend the end date to include your task deadlines

---

### **Issue 4: Not enough hours**

**Symptom**: Only some tasks appear in plan

**Solution**:
- Increase "Available Hours Per Day" in the form
- Or reduce the estimated hours on your tasks

---

### **Issue 5: API error 401 Unauthorized**

**Symptom**: `401 Unauthorized` in console

**Solution**:
1. Refresh the page (Ctrl+R)
2. If still fails, logout and login again
3. Your JWT token may have expired

---

### **Issue 6: API error 503 Service Unavailable**

**Symptom**: AI service timeout or unavailable

**Solution**:
1. Check backend logs (where you ran `uvicorn`)
2. Verify your `GEMINI_API_KEY` is set in `backend/.env`
3. Check your API key hasn't hit rate limits
4. Wait 30 seconds and try again

---

## 🧪 **Manual Test**

Run this command to test the API directly:

```bash
cd /home/riaz/Projects/build-with-kiro-2026
./debug_plan_issue.sh
```

This will:
- Check if you have tasks
- Attempt to generate a plan
- Show you the exact API response
- Tell you what's wrong

---

## 📋 **Checklist Before Generating Plan**

Before clicking "Generate AI Plan", make sure:

- [ ] You have at least 2-3 tasks created
- [ ] Tasks are NOT all completed (some "Not Started" or "In Progress")
- [ ] Tasks have deadlines set
- [ ] Task deadlines are within the next 2 weeks
- [ ] Your available hours are reasonable (3-5 per day)
- [ ] Backend server is running (check terminal)
- [ ] Frontend server is running
- [ ] You're logged in (not seeing 401 errors)

---

## 🎯 **Expected Behavior**

When everything works correctly:

1. Click "Generate AI Plan"
2. Fill form and click "Generate"
3. See "Generating..." for 5-15 seconds
4. Modal closes
5. Green success banner appears: "✅ Study plan generated successfully! X sessions created."
6. Calendar shows study sessions across the week
7. Each day has colored blocks with:
   - Task title
   - Duration (e.g., "90m")
   - Rationale (why scheduled then)
   - Checkmark button to complete

---

## 🔍 **Still Not Working?**

### Check Backend Logs:

Look at your backend terminal where you ran:
```bash
cd backend && .venv/bin/uvicorn app.main:app --reload
```

Look for errors like:
- `ERROR:` (something failed)
- `WARNING:` (possible issues)
- `503` (AI service failed)
- `422` (validation error)

### Check Frontend Console:

Look for red errors in browser console (F12)

Common errors:
- Network errors (backend not running)
- 401 (not logged in)
- 503 (AI service failed)
- Parsing errors (AI returned invalid JSON)

---

## 💡 **Quick Fix**

Try this sequence:

1. **Refresh the page** (Ctrl+R)
2. **Make sure you have tasks** (go to Tasks page)
3. **Try with default values**:
   - Start: Today
   - End: +7 days
   - Hours: 3 for weekdays, 5 for weekends
4. **Watch the console** (F12) while generating
5. **Check for success message** after modal closes

---

## ✅ **Success Indicators**

You'll know it worked when:

- ✅ Modal closes automatically
- ✅ Green success banner appears
- ✅ Calendar grid shows colored session blocks
- ✅ Console shows "Plan generated successfully"
- ✅ No red errors in console

---

## 📞 **Need More Help?**

If still not working:

1. Run the debug script: `./debug_plan_issue.sh`
2. Copy the console output (F12 → Console → Right-click → Save as)
3. Share the error messages

---

**Remember**: The AI needs tasks to work with! Create some tasks first if you haven't already.

