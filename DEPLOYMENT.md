# Deployment Guide — Personal AI Study & Task Coach

## Prerequisites

- **Neon PostgreSQL Database**: Free tier account at [neon.tech](https://neon.tech)
- **Google Gemini API Key**: From [Google AI Studio](https://aistudio.google.com)
- **Vercel Account**: For frontend deployment
- **Render Account**: For backend deployment (free tier)
- **Supabase Account** (optional): For file storage in production

## 1. Database Setup (Neon)

1. Create a new Neon project
2. Copy the connection string (starts with `postgresql://`)
3. The connection string will be used in backend `.env` as `DATABASE_URL`

## 2. Backend Deployment (Render)

### A. Prepare Environment Variables

In your Render dashboard, set these environment variables:

```bash
DATABASE_URL=postgresql://[your-neon-connection-string]
JWT_SECRET_KEY=[generate with: openssl rand -hex 32]
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
GEMINI_API_KEY=[your-gemini-api-key]
GEMINI_MODEL=gemini-2.5-flash
STORAGE_BACKEND=local
STORAGE_LOCAL_PATH=./uploads
ALLOWED_ORIGINS=["https://[your-app].vercel.app"]
```

### B. Create Render Web Service

1. **Service Type**: Web Service
2. **Runtime**: Python 3.11+
3. **Build Command**:
   ```bash
   cd backend && pip install -r requirements.txt && alembic upgrade head
   ```
4. **Start Command**:
   ```bash
   cd backend && gunicorn app.main:app -k uvicorn.workers.UvicornWorker -w 1 --bind 0.0.0.0:$PORT
   ```
5. **Health Check Path**: `/health`
6. **Free Tier Note**: Instance sleeps after 15min inactivity; first request takes ~30s

### C. Run Database Migration

After first deployment, the build command automatically runs:
```bash
alembic upgrade head
```

Verify tables exist by checking logs or connecting to your Neon database.

## 3. Frontend Deployment (Vercel)

### A. Prepare Environment Variables

In Vercel project settings, add:

```bash
VITE_API_URL=https://[your-backend].onrender.com
```

### B. Deploy Configuration

Vercel auto-detects Vite projects. Ensure these settings:

- **Framework Preset**: Vite
- **Build Command**: `npm run build` (or leave auto)
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Root Directory**: `frontend`

### C. Deploy

```bash
# Option 1: Connect GitHub repo to Vercel (recommended)
# Vercel will auto-deploy on every push

# Option 2: Manual deployment
cd frontend
npm install
npm run build
vercel --prod
```

## 4. Optional: Supabase Storage (Production Files)

If using Supabase for file uploads in production:

1. Create a Supabase project
2. Create a storage bucket named `study-materials`
3. Set bucket to **public** (or configure auth if needed)
4. Add to backend environment variables:
   ```bash
   STORAGE_BACKEND=supabase
   SUPABASE_URL=https://[project-id].supabase.co
   SUPABASE_SERVICE_KEY=[your-service-role-key]
   SUPABASE_BUCKET=study-materials
   ```

## 5. Post-Deployment Verification

### Backend Health Check
```bash
curl https://[your-backend].onrender.com/health
# Expected: {"status": "ok", "timestamp": "..."}
```

### API Documentation
Visit: `https://[your-backend].onrender.com/docs`

### Test Registration Flow
1. Visit your Vercel URL
2. Click "Sign Up"
3. Create an account
4. Verify you're redirected to `/dashboard`

### Test AI Integration
1. Login to your account
2. Upload a study material (PDF/TXT)
3. Go to AI Assistant
4. Ask a question about the material
5. Verify AI responds

## 6. Environment Variable Checklist

### Backend (Render) — Required:
- ✅ `DATABASE_URL` (Neon PostgreSQL)
- ✅ `JWT_SECRET_KEY` (32+ random chars)
- ✅ `GEMINI_API_KEY` (Google AI Studio)
- ✅ `ALLOWED_ORIGINS` (your Vercel URL)

### Frontend (Vercel) — Required:
- ✅ `VITE_API_URL` (your Render backend URL)

### Optional (Supabase):
- `STORAGE_BACKEND=supabase`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `SUPABASE_BUCKET`

## 7. Common Issues

### Issue: "AI service unavailable"
- **Cause**: Invalid Gemini API key or quota exceeded
- **Fix**: Verify API key in Google AI Studio, check quota limits

### Issue: "Database connection failed"
- **Cause**: Invalid DATABASE_URL or database doesn't exist
- **Fix**: Verify Neon connection string, ensure `?sslmode=require` is removed (auto-handled by backend)

### Issue: "CORS error"
- **Cause**: Frontend URL not in `ALLOWED_ORIGINS`
- **Fix**: Update backend `ALLOWED_ORIGINS` to include your Vercel URL

### Issue: Backend responds slowly
- **Cause**: Render free tier cold start (instance was asleep)
- **Expected**: First request after 15min takes ~30 seconds
- **Solution**: Upgrade to paid tier or implement a keep-alive ping

### Issue: JWT decode failed
- **Cause**: Refresh token expired or backend restarted
- **Fix**: User must log out and log back in

## 8. Monitoring

### Backend Logs (Render)
- View real-time logs in Render dashboard
- Monitor `/health` endpoint uptime
- Check for AI timeout errors (503 responses)

### Frontend Errors (Vercel)
- Check Vercel deployment logs
- Use browser DevTools Console for client-side errors
- Monitor network tab for failed API calls

## 9. Scaling Considerations

### Current Architecture (Free Tier):
- **Backend**: 1 Uvicorn worker, single process
- **Database**: Neon free tier (512 MB, 10 GB storage)
- **AI**: Gemini free tier rate limits apply

### If Scaling Needed:
- Upgrade Render to paid tier for more workers
- Upgrade Neon database for more connections
- Implement Redis for session caching
- Add rate limiting per user on AI endpoints
- Consider CDN for static assets

## 10. Backup & Recovery

### Database Backups
Neon provides automatic daily backups on free tier.

To manually backup:
```bash
pg_dump [DATABASE_URL] > backup.sql
```

To restore:
```bash
psql [DATABASE_URL] < backup.sql
```

### Environment Variables
Keep a secure backup of all production environment variables.

## 11. Security Checklist

- ✅ `.env` files never committed to git
- ✅ HTTPS enforced (Vercel/Render default)
- ✅ JWT secrets minimum 256-bit entropy
- ✅ CORS restricted to frontend origin
- ✅ Passwords hashed with bcrypt (cost 12)
- ✅ SQL injection protected (ORM only, no raw SQL)
- ✅ File uploads validated (MIME type, size limit)
- ✅ Refresh tokens rotate on every use
- ✅ httpOnly cookies for refresh tokens

## 12. Support Resources

- **FastAPI Docs**: https://fastapi.tiangolo.com
- **React Query**: https://tanstack.com/query/latest
- **Neon**: https://neon.tech/docs
- **Render**: https://render.com/docs
- **Vercel**: https://vercel.com/docs
- **Google Gemini**: https://ai.google.dev/docs

---

**Built with Kiro IDE for the Build with Kiro 2026 Hackathon**
