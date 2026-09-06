# 🚀 Deployment Guide - Study Coach

Complete guide to deploy your AI Study Coach application to production.

---

## 📋 Pre-Deployment Checklist

### ✅ Required Accounts
- [ ] **Vercel account** (for frontend) - [vercel.com](https://vercel.com)
- [ ] **Render account** (for backend) - [render.com](https://render.com)
- [ ] **Neon account** (for database) - [neon.tech](https://neon.tech)
- [ ] **Supabase account** (for file storage) - [supabase.com](https://supabase.com)
- [ ] **Google AI Studio** (for Gemini API) - [aistudio.google.com](https://aistudio.google.com)
- [ ] **GitHub repository** (code must be pushed)

### ✅ Required API Keys
- [ ] Google Gemini API key
- [ ] OpenRouter API key (optional fallback)
- [ ] Neon PostgreSQL connection string
- [ ] Supabase URL + Service Key

---

## 🗄️ Step 1: Database Setup (Neon)

### 1.1 Create Database

1. Go to [neon.tech](https://neon.tech) and sign in
2. Click **"New Project"**
3. Project settings:
   - **Name**: `study-coach`
   - **Region**: Choose closest to your users
   - **PostgreSQL version**: 15 or higher
4. Click **"Create Project"**

### 1.2 Get Connection String

1. In your Neon project, go to **"Connection Details"**
2. Copy the **"Connection string"** (pooled connection)
3. It should look like:
   ```
   postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. **Save this** - you'll need it for Render

### 1.3 Note About Connection String

The backend will automatically convert `postgresql://` to `postgresql+asyncpg://` and remove unsupported params like `sslmode` and `channel_binding`.

---

## 💾 Step 2: File Storage Setup (Supabase)

### 2.1 Create Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Project settings:
   - **Name**: `study-coach-storage`
   - **Database Password**: Generate strong password
   - **Region**: Same as backend (Oregon for Render free tier)
4. Wait for project to be created (~2 minutes)

### 2.2 Create Storage Bucket

1. Go to **Storage** in left sidebar
2. Click **"New Bucket"**
3. Bucket settings:
   - **Name**: `study-materials`
   - **Public bucket**: ❌ **NO** (keep private)
   - **File size limit**: 10 MB
   - **Allowed MIME types**: `application/pdf,text/plain,text/markdown`
4. Click **"Create Bucket"**

### 2.3 Set Bucket Permissions

1. Click on the `study-materials` bucket
2. Go to **"Policies"** tab
3. Click **"New Policy"** and select **"For full customization"**
4. Add this policy:
   ```sql
   -- Allow authenticated uploads
   CREATE POLICY "Allow authenticated uploads"
   ON storage.objects FOR INSERT
   WITH CHECK (bucket_id = 'study-materials');

   -- Allow authenticated reads
   CREATE POLICY "Allow authenticated reads"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'study-materials');

   -- Allow authenticated deletes
   CREATE POLICY "Allow authenticated deletes"
   ON storage.objects FOR DELETE
   USING (bucket_id = 'study-materials');
   ```
5. Click **"Review"** then **"Save Policy"**

### 2.4 Get Supabase Credentials

1. Go to **Project Settings** (gear icon)
2. Go to **API** section
3. Copy these values:
   - **Project URL**: `https://<project-ref>.supabase.co`
   - **service_role key** (secret): Click "Reveal" and copy
4. **Save these** - you'll need them for Render

---

## 🔧 Step 3: Backend Deployment (Render)

### 3.1 Create Web Service

1. Go to [render.com](https://render.com) and sign in
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Service settings:
   - **Name**: `study-coach-backend`
   - **Region**: Oregon (free tier)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**:
     ```bash
     pip install -r requirements.txt
     ```
   - **Start Command**:
     ```bash
     alembic upgrade head && gunicorn app.main:app -w 2 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT
     ```
   - **Plan**: Free

### 3.2 Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** and add these:

| Key | Value | Notes |
|-----|-------|-------|
| `DATABASE_URL` | Your Neon connection string | From Step 1.2 |
| `JWT_SECRET_KEY` | Generate random 32+ chars | Use `openssl rand -hex 32` |
| `JWT_ALGORITHM` | `HS256` | Default |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `15` | Default |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Default |
| `GEMINI_API_KEY` | Your Gemini API key | From Google AI Studio |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Default |
| `OPENROUTER_API_KEY` | Your OpenRouter key (optional) | Fallback provider |
| `OPENROUTER_MODEL` | `google/gemini-2.0-flash-exp:free` | Fallback model |
| `OPENROUTER_SITE_URL` | `https://your-frontend.vercel.app` | Your Vercel URL |
| `OPENROUTER_APP_NAME` | `Personal AI Study Coach` | App name |
| `STORAGE_BACKEND` | `supabase` | Use Supabase in prod |
| `SUPABASE_URL` | Your Supabase project URL | From Step 2.4 |
| `SUPABASE_SERVICE_KEY` | Your service_role key | From Step 2.4 |
| `SUPABASE_BUCKET` | `study-materials` | Default |
| `ALLOWED_ORIGINS` | `["https://your-frontend.vercel.app"]` | Update after deploying frontend |

### 3.3 Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (~5-10 minutes first time)
3. Your backend URL will be: `https://study-coach-backend.onrender.com`
4. **Save this URL** - you'll need it for frontend

### 3.4 Test Backend

1. Visit: `https://study-coach-backend.onrender.com/health`
2. Should return: `{"status":"ok","timestamp":"..."}`
3. Visit: `https://study-coach-backend.onrender.com/docs`
4. Should show API documentation

---

## 🎨 Step 4: Frontend Deployment (Vercel)

### 4.1 Update Frontend Environment

1. In your local project, edit `frontend/.env`:
   ```env
   VITE_API_URL=https://study-coach-backend.onrender.com
   ```
2. Commit and push:
   ```bash
   git add frontend/.env
   git commit -m "config: Update API URL for production"
   git push origin main
   ```

### 4.2 Deploy to Vercel

#### Option A: Vercel CLI (Recommended)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   cd frontend
   vercel --prod
   ```

4. Follow prompts:
   - **Set up and deploy**: Yes
   - **Scope**: Your account
   - **Link to existing project**: No
   - **Project name**: `study-coach`
   - **Directory**: `./` (current directory)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Development Command**: `npm run dev`

#### Option B: Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Project settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://study-coach-backend.onrender.com`
5. Click **"Deploy"**

### 4.3 Get Frontend URL

After deployment completes:
1. Your URL will be: `https://study-coach-<random>.vercel.app`
2. Vercel will show you the URL
3. **Copy this URL** - you need to update the backend CORS

---

## 🔗 Step 5: Connect Frontend & Backend

### 5.1 Update Backend CORS

1. Go back to [Render dashboard](https://dashboard.render.com)
2. Click on your **study-coach-backend** service
3. Go to **"Environment"** tab
4. Find `ALLOWED_ORIGINS` variable
5. Update value to:
   ```json
   ["https://study-coach-<your-id>.vercel.app"]
   ```
6. Click **"Save Changes"**
7. Render will automatically redeploy (~2 minutes)

### 5.2 Update OpenRouter Site URL (if using)

1. In Render, update `OPENROUTER_SITE_URL` to your Vercel URL:
   ```
   https://study-coach-<your-id>.vercel.app
   ```
2. Click **"Save Changes"**

---

## ✅ Step 6: Final Testing

### 6.1 Test Landing Page

1. Visit your Vercel URL: `https://study-coach-<your-id>.vercel.app`
2. ✅ Landing page loads with professional design
3. ✅ "Get Started Free" button works
4. ✅ Navigation is responsive

### 6.2 Test Registration

1. Click **"Get Started Free"**
2. Fill in:
   - Full Name: Test User
   - Email: test@example.com
   - Password: TestPass123
3. ✅ Password strength indicators work
4. ✅ Registration succeeds
5. ✅ Redirects to dashboard

### 6.3 Test Dashboard

1. ✅ Dashboard loads with hero section
2. ✅ Stats cards show: Total Tasks, Completed, Today's Sessions, Study Streak
3. ✅ Icons are correct (Target, CheckCircle2, Calendar, Flame)
4. ✅ Welcome message is visible (cream color on navy background)

### 6.4 Test Tasks

1. Click **"Tasks"** in sidebar
2. ✅ Empty state shows with friendly message + SVG illustration
3. Click **"Create Your First Task"**
4. Create a task with:
   - Title: Read Chapter 1
   - Course: Computer Science
   - Deadline: Tomorrow
   - Priority: High
5. ✅ Task appears in list
6. ✅ Mark Complete button works
7. ✅ Edit and Delete icons appear on hover

### 6.5 Test Materials Upload

1. Click **"Materials"** in sidebar
2. ✅ Empty state shows with document illustration
3. Click **"Upload Your First Material"**
4. Upload a PDF or paste text
5. ✅ Material appears in library
6. ✅ File size and upload date visible
7. ✅ Delete button appears on hover

### 6.6 Test AI Assistant

1. Click **"AI Assistant"** in sidebar
2. Upload or select a material first (if haven't already)
3. Ask a question: "Summarize this material"
4. ✅ AI responds with summary
5. ✅ Conversation history appears
6. ✅ Loading state shows while AI is thinking

### 6.7 Test Study Planner

1. Click **"Planner"** in sidebar
2. Set available hours for each day (e.g., 2 hours per day)
3. Click **"Generate AI Study Plan"**
4. ✅ Loading modal appears
5. ✅ Study plan generates successfully
6. ✅ Calendar shows color-coded sessions
7. ✅ Sessions organized by course
8. ✅ Can mark sessions as complete

### 6.8 Test Progress Page

1. Click **"Progress"** in sidebar
2. ✅ Completion rate chart shows
3. ✅ Course breakdown displays
4. ✅ Estimated vs completed hours graph works

### 6.9 Test Authentication Flow

1. Click **"Sign Out"** in sidebar
2. ✅ Redirects to landing page
3. ✅ Can't access protected pages without login
4. Click **"Login"**
5. ✅ Split-screen auth page loads
6. ✅ Login with existing account works
7. ✅ Refresh token persists across page reloads

---

## 🔍 Troubleshooting

### Backend Issues

**Issue**: Backend returns 500 error
- Check Render logs: Dashboard → Service → Logs
- Look for database connection errors
- Verify `DATABASE_URL` is correct

**Issue**: CORS errors in browser console
- Verify `ALLOWED_ORIGINS` includes your Vercel URL
- Must be exact match (no trailing slash)
- Must be in JSON array format: `["https://..."]`

**Issue**: AI features not working
- Check `GEMINI_API_KEY` is set correctly
- Verify API key has quota remaining
- Check backend logs for error messages

**Issue**: File uploads fail
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are correct
- Check Supabase bucket exists and has correct policies
- Look for storage errors in Render logs

### Frontend Issues

**Issue**: White screen on deployment
- Check Vercel build logs for errors
- Verify `VITE_API_URL` environment variable is set
- Ensure build completed successfully

**Issue**: API requests fail
- Open browser DevTools → Network tab
- Check if requests go to correct backend URL
- Verify `VITE_API_URL` is set in Vercel environment variables
- Redeploy frontend after changing environment variables

**Issue**: Landing page loads but dashboard doesn't
- Check browser console for errors
- Verify JWT token is being stored
- Check Network tab for 401/403 errors
- Try logging out and back in

### Database Issues

**Issue**: Migrations fail on Render
- Check Render logs for specific error
- Verify DATABASE_URL format is correct
- Ensure database is accessible from Render

**Issue**: Data not persisting
- Verify database connection is stable
- Check Neon project is active (not suspended)
- Look for transaction errors in logs

---

## 📊 Performance Optimization

### Frontend

1. **Enable Vercel Analytics**:
   - Go to Project Settings → Analytics
   - Enable Web Analytics
   - Track page load times

2. **Add Custom Domain** (optional):
   - Go to Project Settings → Domains
   - Add your custom domain
   - Update `ALLOWED_ORIGINS` in backend

### Backend

1. **Upgrade Render Plan** (if needed):
   - Free tier has cold starts (~30 seconds first request)
   - Starter plan ($7/month) keeps service always active
   - Go to Service → Settings → Plan

2. **Monitor Performance**:
   - Render Dashboard → Service → Metrics
   - Watch response times and error rates

---

## 🔒 Security Checklist

### Pre-Production

- [ ] All `.env` files in `.gitignore`
- [ ] No API keys committed to repository
- [ ] `JWT_SECRET_KEY` is random 32+ characters
- [ ] Database password is strong
- [ ] Supabase service_role key is secret
- [ ] CORS only allows your frontend domain

### Post-Deployment

- [ ] Test with actual user accounts
- [ ] Verify file uploads are private (not publicly accessible)
- [ ] Check JWT tokens expire correctly
- [ ] Test logout clears tokens
- [ ] Verify password reset flow (if implemented)
- [ ] Test rate limiting on AI endpoints

---

## 📝 Environment Variables Summary

### Backend (Render)

```env
DATABASE_URL=postgresql://...
JWT_SECRET_KEY=<random-32-chars>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
GEMINI_API_KEY=<your-key>
GEMINI_MODEL=gemini-2.5-flash
OPENROUTER_API_KEY=<your-key>
OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free
OPENROUTER_SITE_URL=https://study-coach-xxx.vercel.app
OPENROUTER_APP_NAME=Personal AI Study Coach
STORAGE_BACKEND=supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=<service-role-key>
SUPABASE_BUCKET=study-materials
ALLOWED_ORIGINS=["https://study-coach-xxx.vercel.app"]
```

### Frontend (Vercel)

```env
VITE_API_URL=https://study-coach-backend.onrender.com
```

---

## 🎯 Deployment Complete!

Your AI Study Coach is now live! 🎉

- **Frontend**: `https://study-coach-<your-id>.vercel.app`
- **Backend API**: `https://study-coach-backend.onrender.com`
- **API Docs**: `https://study-coach-backend.onrender.com/docs`

### Next Steps

1. Share your app URL with hackathon judges
2. Test all features end-to-end
3. Monitor Render logs for any errors
4. Check Vercel analytics for performance

### Important Notes

- **Free Tier Cold Starts**: First request after 15 minutes of inactivity takes ~30 seconds
- **Mention in Demo**: "The backend is hosted on Render's free tier, so it may take a moment to wake up on first load"
- **Database**: Neon free tier has 0.5 GB storage and 100 hours compute/month
- **Storage**: Supabase free tier has 1 GB storage

Good luck with your hackathon! 🚀

