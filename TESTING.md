# Testing Guide — Sign Up & Login

## Fixed Issues

### 1. **Bcrypt Compatibility (Python 3.14)**
- **Problem**: passlib with Python 3.14 had compatibility issues
- **Solution**: Switched to direct bcrypt usage in `security.py`
- **Status**: ✅ Fixed

### 2. **Cookie Security Settings**
- **Problem**: `secure=True` requires HTTPS, which breaks local HTTP development
- **Solution**: Auto-detect based on ALLOWED_ORIGINS (HTTP = secure:False, HTTPS = secure:True)
- **Status**: ✅ Fixed

### 3. **Cookie Path**
- **Problem**: Cookie path was too restrictive (`/api/v1/auth/refresh` only)
- **Solution**: Changed to `/api/v1/auth` to work with all auth endpoints
- **Status**: ✅ Fixed

## Running the Application

### Option 1: Using startup scripts

**Terminal 1 - Backend:**
```bash
./start-backend.sh
```

**Terminal 2 - Frontend:**
```bash
./start-frontend.sh
```

### Option 2: Manual commands

**Backend:**
```bash
cd backend
source .venv/bin/activate
alembic upgrade head
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm run dev
```

## Testing Sign Up & Login

### 1. Verify Backend is Running

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{"status":"ok","timestamp":"2026-09-01T..."}
```

### 2. Test Registration via API

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "full_name": "Test User"
  }'
```

Expected response (201):
```json
{
  "id": "uuid-here",
  "email": "user@example.com",
  "full_name": "Test User",
  "created_at": "2026-09-01T..."
}
```

### 3. Test Login via API

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }' \
  -c cookies.txt -v
```

Expected response (200):
```json
{
  "access_token": "eyJ...",
  "expires_in": 900
}
```

The response should also set a `refresh_token` cookie (check with `-v` flag).

### 4. Test Login via Frontend

1. Open http://localhost:5173
2. Click "Sign Up" button
3. Fill in the registration form:
   - **Full Name**: Your Name
   - **Email**: your@email.com
   - **Password**: password123 (minimum 8 characters)
4. Click "Sign Up"
5. You should be redirected to `/dashboard`

**If login page appears:**
- Use the same credentials to log in
- Click "Login"

### 5. Verify Authentication

After successful login, check:

**Browser DevTools → Application → Cookies:**
- `refresh_token` cookie should be present
- Domain: `localhost`
- Path: `/api/v1/auth`
- HttpOnly: ✓
- Secure: (should be unchecked for local dev)

**Browser DevTools → Console:**
- No CORS errors
- No 401 errors

### 6. Test Protected Route

With the access token from login:

```bash
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

Expected response (200):
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "Test User",
  "created_at": "..."
}
```

### 7. Test Token Refresh

```bash
curl -X POST http://localhost:8000/api/v1/auth/refresh \
  -b cookies.txt \
  -c cookies.txt \
  -v
```

Expected response (200):
```json
{
  "access_token": "new_token...",
  "expires_in": 900
}
```

### 8. Test Logout

```bash
curl -X POST http://localhost:8000/api/v1/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -b cookies.txt \
  -v
```

Expected response: 204 No Content

The `refresh_token` cookie should be deleted.

## Common Issues & Solutions

### Issue: "CORS error" in browser console

**Cause**: Backend not running or ALLOWED_ORIGINS misconfigured

**Solution**:
1. Verify backend is running: `curl http://localhost:8000/health`
2. Check `backend/.env` has `ALLOWED_ORIGINS=["http://localhost:5173"]`
3. Restart backend after changing config

### Issue: "Invalid or expired refresh token"

**Cause**: Refresh token cookie not being sent

**Solution**:
1. Verify `withCredentials: true` in `frontend/src/lib/api.ts`
2. Check cookie path matches (`/api/v1/auth`)
3. Ensure `secure: false` for HTTP (local dev)

### Issue: "Incorrect email or password"

**Cause**: User doesn't exist or wrong credentials

**Solution**:
1. Register a new account first
2. Check email is lowercase (auto-converted)
3. Verify password is at least 8 characters

### Issue: "An account with this email already exists"

**Cause**: User already registered

**Solution**:
- Use the login page instead, or
- Use a different email address

### Issue: Backend won't start

**Cause**: Database connection failed or port in use

**Solution**:
1. Verify DATABASE_URL in `backend/.env`
2. Check database is accessible: `psql $DATABASE_URL -c "SELECT 1"`
3. Kill process on port 8000: `lsof -ti:8000 | xargs kill -9`

### Issue: Frontend won't start

**Cause**: Port 5173 in use or missing dependencies

**Solution**:
1. Kill process on port 5173: `lsof -ti:5173 | xargs kill -9`
2. Reinstall dependencies: `cd frontend && rm -rf node_modules && npm install`

## API Endpoints Reference

### Authentication
- `POST /api/v1/auth/register` — Create new user
- `POST /api/v1/auth/login` — Login and get tokens
- `POST /api/v1/auth/refresh` — Refresh access token
- `POST /api/v1/auth/logout` — Logout and revoke refresh token
- `GET /api/v1/auth/me` — Get current user info

### Interactive Documentation
Visit http://localhost:8000/docs for full Swagger UI with all 32 endpoints.

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Health endpoint returns 200
- [ ] Registration creates new user (201)
- [ ] Login returns access token (200)
- [ ] Login sets refresh_token cookie
- [ ] Protected endpoint works with access token
- [ ] Refresh endpoint issues new token
- [ ] Logout revokes token and clears cookie
- [ ] Frontend signup form works
- [ ] Frontend login form works
- [ ] Redirect to dashboard after login
- [ ] No CORS errors in console
- [ ] Cookie settings correct (httpOnly, path, secure)

## Success Criteria

**You should be able to:**
1. Register a new account via frontend
2. Login with those credentials
3. See the dashboard page
4. Refresh the page without logging out
5. Navigate to different pages while authenticated
6. Logout successfully

**Backend logs should show:**
```
INFO:     127.0.0.1:XXXXX - "POST /api/v1/auth/register HTTP/1.1" 201
INFO:     127.0.0.1:XXXXX - "POST /api/v1/auth/login HTTP/1.1" 200
INFO:     127.0.0.1:XXXXX - "GET /api/v1/auth/me HTTP/1.1" 200
```

---

**All authentication issues have been fixed!** 🎉

If you encounter any other issues, check the backend logs for detailed error messages.
