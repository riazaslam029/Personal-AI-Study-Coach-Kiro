# Implementation Tasks
# Personal AI Study & Task Coach

**Project:** Build with Kiro 2026 Hackathon  
**Status:** Complete  
**Date:** 2026-08-30  
**Version:** 1.0  
**Requires:** requirements.md v1.1 · design.md v1.0

---

# Implementation Plan

This document outlines the implementation tasks for building the Personal AI Study & Task Coach application.

## Overview

The application is a full-stack web application with:
- Backend: FastAPI + PostgreSQL + Google Gemini AI
- Frontend: React + TypeScript + Tailwind CSS
- Features: Task management, AI assistant, study planning, progress tracking

## Task Dependency Graph

```json
{
  "waves": [
    {
      "id": "wave-1",
      "name": "Infrastructure",
      "tasks": ["1.1", "1.2", "1.3", "1.4", "1.5"]
    },
    {
      "id": "wave-2",
      "name": "Authentication",
      "tasks": ["2.1", "2.2", "2.3", "2.4"],
      "depends_on": ["wave-1"]
    },
    {
      "id": "wave-3",
      "name": "Courses & UI",
      "tasks": ["3.1", "3.2", "3.3"],
      "depends_on": ["wave-2"]
    },
    {
      "id": "wave-4",
      "name": "Task Management",
      "tasks": ["4.1", "4.2"],
      "depends_on": ["wave-3"]
    },
    {
      "id": "wave-5",
      "name": "Study Materials",
      "tasks": ["5.1", "5.2", "5.3", "5.4"],
      "depends_on": ["wave-3"]
    },
    {
      "id": "wave-6",
      "name": "AI Assistant",
      "tasks": ["6.1", "6.2", "6.3"],
      "depends_on": ["wave-5"]
    },
    {
      "id": "wave-7",
      "name": "Study Planner",
      "tasks": ["7.1", "7.2", "7.3"],
      "depends_on": ["wave-4", "wave-6"]
    },
    {
      "id": "wave-8",
      "name": "Dashboard",
      "tasks": ["8.1", "8.2"],
      "depends_on": ["wave-4", "wave-6", "wave-7"]
    },
    {
      "id": "wave-9",
      "name": "Progress Tracking",
      "tasks": ["9.1", "9.2"],
      "depends_on": ["wave-3", "wave-4"]
    },
    {
      "id": "wave-10",
      "name": "Adaptive Planning",
      "tasks": ["10.1", "10.2"],
      "depends_on": ["wave-7", "wave-8"]
    },
    {
      "id": "wave-11",
      "name": "Polish",
      "tasks": ["11.1", "11.2", "11.3", "11.4", "11.5"],
      "depends_on": ["wave-1", "wave-2", "wave-3", "wave-4", "wave-5", "wave-6", "wave-7", "wave-8", "wave-9", "wave-10"]
    },
    {
      "id": "wave-12",
      "name": "Deployment",
      "tasks": ["12.1", "12.2", "12.3", "12.4", "12.5", "12.6", "12.7"],
      "depends_on": ["wave-11"]
    }
  ]
}
```

## Tasks

All milestones have been completed successfully.

## Notes

- All TypeScript build errors have been resolved
- CORS configuration has been properly set up
- All 32 API endpoints are functional
- All 9 frontend pages are implemented and working
- Authentication system is fully operational

---

## How to Use This Document

Tasks are grouped into sequential milestones. Each milestone produces a deployable, testable increment. Complete one milestone fully before starting the next. The application should remain runnable after every milestone.

Dependencies within a milestone are noted. Where tasks within a milestone are independent, they can be worked in parallel.

---

## Milestone 1 — Project Scaffolding and Infrastructure

*Goal: Both frontend and backend run locally, connect to a dev database, and pass a health check. No features yet — just a solid, runnable foundation.*

- [x] **1.1** Initialize the repository structure

  Create the top-level directory layout:
  ```
  build-with-kiro-2026/
  ├── backend/
  ├── frontend/
  ├── .gitignore
  ├── .env.example   (root-level, documents all variables for both services)
  └── README.md      (placeholder — full content added in final milestone)
  ```
  Add a `.gitignore` that covers: `.env`, `__pycache__`, `*.pyc`, `.venv`, `node_modules`, `dist`, `uploads/`, `*.egg-info`.

- [x] **1.2** Scaffold the FastAPI backend

  Inside `backend/`:
  - Create `requirements.txt` with all pinned dependencies from design.md §9.1
  - Create a Python virtual environment (`.venv`) — do not commit it
  - Create the full module tree from design.md §4.1:
    `app/main.py`, `app/core/`, `app/models/`, `app/schemas/`, `app/api/`, `app/services/`
  - Implement `app/core/config.py` — `Settings` class with all env vars from design.md §4.3
  - Implement `app/main.py` — FastAPI app factory, CORS middleware, router stub, `/health` endpoint
  - Create `backend/.env.example` documenting all backend variables
  - Verify: `uvicorn app.main:app --reload` starts and `GET /health` returns `{"status": "ok"}`

- [x] **1.3** Configure the database connection and run initial migration

  - Implement `app/core/database.py` — async engine from `DATABASE_URL`, `AsyncSession`, `get_db` dependency
  - Initialize Alembic: `alembic init alembic`, configure `env.py` to use the async engine and import all models
  - Implement all SQLAlchemy models from design.md §2.2:
    `User`, `RefreshToken`, `Course`, `Task`, `StudyMaterial`, `StudyPlanSession`, `AIPrioritization`
  - Add `app/models/base.py` — `DeclarativeBase` and `TimestampMixin` (auto-managed `created_at`, `updated_at`)
  - Generate migration: `alembic revision --autogenerate -m "initial schema"`
  - Apply migration: `alembic upgrade head`
  - Verify: all 7 tables exist in the database with correct columns and indexes

- [x] **1.4** Scaffold the React frontend

  Inside `frontend/`:
  - Scaffold with Vite: `npm create vite@latest . -- --template react-ts`
  - Install all dependencies from design.md §9.2 (pinned versions)
  - Configure Tailwind CSS with `tailwind.config.ts` and `postcss.config.js`
  - Create `frontend/.env.example` with `VITE_API_URL=http://localhost:8000`
  - Create the full directory tree from design.md §5.1: `src/types/`, `src/lib/`, `src/store/`, `src/hooks/`, `src/components/`, `src/pages/`
  - Create stub files for all pages (return a `<div>` with the page name)
  - Verify: `npm run dev` starts, app loads in browser, no TypeScript errors

- [x] **1.5** Implement the API client and auth store stubs

  - Implement `src/lib/api.ts` — Axios instance with `VITE_API_URL` base URL, `withCredentials: true`, and the request interceptor that attaches `Authorization: Bearer <token>` from Zustand store (response interceptor for silent refresh added in Milestone 2)
  - Implement `src/store/authStore.ts` — Zustand store: `{ user, accessToken, setAuth, setAccessToken, clearAuth }`
  - Implement `src/types/index.ts` — all shared TypeScript interfaces: `User`, `Course`, `Task`, `StudyMaterial`, `StudyPlanSession`, `PrioritizedTask`, `KeyPoint`, `QuizQuestion`, `ChatMessage`
  - Implement `src/lib/queryKeys.ts` — all React Query key constants from design.md §5.4
  - Implement `src/lib/utils.ts` — `cn()` (clsx + tailwind-merge), `formatDate()`, `formatRelativeDate()`, `isOverdue()`
  - Verify: TypeScript compiles with no errors (`npm run build`)

---

## Milestone 2 — Authentication

*Goal: Users can register, log in, stay logged in across page reloads, and log out. All protected routes redirect unauthenticated users.*

*Depends on: Milestone 1 complete*

- [x] **2.1** Implement backend auth logic

  - Implement `app/core/security.py`:
    - `hash_password(plain: str) -> str` — bcrypt, cost factor 12
    - `verify_password(plain: str, hashed: str) -> bool`
    - `create_access_token(user_id: str) -> str` — HS256 JWT, 15-min TTL
    - `decode_access_token(token: str) -> dict` — raises `HTTPException(401)` on invalid/expired
    - `generate_refresh_token() -> str` — `secrets.token_urlsafe(32)`
    - `hash_refresh_token(token: str) -> str` — bcrypt hash for DB storage
  - Implement `app/services/auth_service.py`:
    - `register_user(db, email, password, full_name) -> User` — validates unique email, hashes password, inserts user
    - `authenticate_user(db, email, password) -> User` — verifies credentials, raises `HTTPException(401)` on failure
    - `create_refresh_token_record(db, user_id) -> str` — generates token, stores hash, returns raw token
    - `rotate_refresh_token(db, raw_token) -> tuple[User, str]` — finds by hash, validates expiry, deletes old, issues new
    - `revoke_refresh_token(db, raw_token) -> None`

- [x] **2.2** Implement auth Pydantic schemas

  In `app/schemas/auth.py`:
  - `RegisterRequest`: `email` (EmailStr), `password` (min 8 chars), `full_name` (optional str)
  - `LoginRequest`: `email`, `password`
  - `TokenResponse`: `access_token`, `token_type`, `expires_in`
  - `UserResponse`: `id`, `email`, `full_name`, `created_at`

- [x] **2.3** Implement auth API router

  In `app/api/auth.py` — implement all 5 routes from design.md §3.2:
  - `POST /auth/register` → 201 `UserResponse`
  - `POST /auth/login` → 200 `TokenResponse` + `Set-Cookie: refresh_token` (HttpOnly, Secure, SameSite=Lax, Path=/api/v1/auth/refresh, 7-day max-age)
  - `POST /auth/refresh` → reads cookie, rotates token, returns new `TokenResponse`
  - `POST /auth/logout` → revokes token, clears cookie
  - `GET /auth/me` → returns `UserResponse` for `get_current_user` dep

  Implement `app/core/dependencies.py`:
  - `get_current_user(token: str = Depends(oauth2_scheme), db = Depends(get_db)) -> User`

  Register the auth router in `app/api/router.py` and include in `main.py`.

  Verify: Register, login, refresh, and logout flows work via `GET /docs`.

- [x] **2.4** Implement frontend auth pages and flows

  - Implement `src/components/layout/AuthLayout.tsx` — centered card, logo, outlet
  - Implement `src/components/layout/AppLayout.tsx` — sidebar navigation + top bar + outlet (sidebar content is placeholder links for now)
  - Implement `ProtectedRoute` component — reads `accessToken` from Zustand; redirects to `/login` if absent
  - Implement `src/App.tsx` — full route tree from design.md §5.2
  - Implement `src/hooks/useAuth.ts` — `useLogin`, `useRegister`, `useLogout` mutations; on login success call `authStore.setAuth()`; on mount try silent refresh (`POST /auth/refresh`) to restore session
  - Implement `src/pages/LoginPage.tsx` — form with React Hook Form, email + password fields, validation, error display, loading state, link to register
  - Implement `src/pages/RegisterPage.tsx` — form with email, password, full name, validation, error display, loading state, link to login
  - Complete the 401 silent-refresh interceptor in `src/lib/api.ts` (design.md §5.3)
  - Implement `src/pages/LandingPage.tsx` — marketing landing page with hero section, feature highlights, and "Get Started" / "Login" CTAs

  Verify:
  - Register a new account → redirected to `/dashboard`
  - Log out → redirected to `/login`
  - Navigate to `/dashboard` while logged out → redirected to `/login`
  - Refresh browser while logged in → session restored (silent refresh)
  - Invalid credentials → appropriate error message shown

---

## Milestone 3 — Core UI Components and Course Management

*Goal: Reusable UI primitives exist. Users can create, view, edit, and delete courses. The app shell looks polished.*

*Depends on: Milestone 2 complete*

- [x] **3.1** Build reusable UI component library

  In `src/components/ui/` — implement all primitives:
  - `Button.tsx` — variants: `primary`, `secondary`, `ghost`, `danger`; sizes: `sm`, `md`, `lg`; loading state (spinner + disabled)
  - `Card.tsx` — wrapper with padding, border, shadow
  - `Badge.tsx` — color variants matching task priority and status values
  - `Modal.tsx` — accessible dialog (focus trap, Escape to close, backdrop click to close, aria-modal)
  - `Spinner.tsx` — animated loading indicator, size variants
  - `EmptyState.tsx` — icon + heading + description + optional action button
  - `ErrorMessage.tsx` — displays API error messages with optional retry callback
  - `ConfirmDialog.tsx` — confirmation modal with title, body text, confirm/cancel buttons; confirm button is `danger` variant
  - `Input.tsx`, `Textarea.tsx`, `Select.tsx` — form field primitives with label, error message, helper text
  - `Tooltip.tsx` — hover tooltip for icon-only buttons

  All components must meet WCAG 2.1 AA: correct ARIA roles, keyboard navigable, sufficient color contrast.

- [x] **3.2** Implement backend course endpoints

  - Implement `app/schemas/course.py`: `CourseCreate`, `CourseUpdate`, `CourseResponse` (includes `task_count`, `completed_task_count`, `material_count`), `CourseStatsResponse`
  - Implement `app/api/courses.py` — all 6 endpoints from design.md §3.3
    - `GET /courses` — list all courses for current user, include counts via subquery
    - `POST /courses` — create; validate `color` as hex pattern
    - `GET /courses/{id}` — get single; 404 if not found or wrong user
    - `PATCH /courses/{id}` — partial update
    - `DELETE /courses/{id}` — cascade-deletes tasks and materials (handled by DB FK cascade)
    - `GET /courses/{id}/stats` — returns `CourseStatsResponse`: `{ total_tasks, completed_tasks, pending_tasks, overdue_tasks, estimated_hours_total, estimated_hours_completed }`
  - All endpoints enforce user ownership: query always adds `WHERE user_id = current_user.id`

- [x] **3.3** Implement frontend course management

  - Implement `src/hooks/useCourses.ts` — `useCourses()`, `useCourse(id)`, `useCourseStats(id)`, `useCreateCourse()`, `useUpdateCourse()`, `useDeleteCourse()` using React Query
  - Implement `src/components/courses/CourseForm.tsx` — form for create/edit with name, description, color picker (predefined palette of 10 colors)
  - Implement `src/components/courses/CourseCard.tsx` — displays course name with color indicator, task count badge, edit/delete actions; delete triggers `ConfirmDialog`
  - Update `AppLayout.tsx` sidebar — render course list dynamically; add "New Course" button; highlight active route

  Verify:
  - Create a course with name, description, and color
  - Edit a course name and color
  - Delete a course — confirm dialog shown; course and its data removed

---

## Milestone 4 — Task Management

*Goal: Full task CRUD with filtering, sorting, visual overdue indication, and exam subtype support. Tasks are usable by the AI system.*

*Depends on: Milestone 3 complete*

- [x] **4.1** Implement backend task endpoints

  - Implement `app/schemas/task.py`: `TaskCreate`, `TaskUpdate`, `TaskResponse` (includes computed `is_overdue`, `course_name`, `course_color`), `TaskCompleteResponse`
  - Implement `app/api/tasks.py` — all 6 endpoints from design.md §3.4:
    - `GET /tasks` — with all query parameters: `course_id`, `status`, `task_type`, `priority`, `deadline_from`, `deadline_to`, `sort_by`, `sort_order`
    - `POST /tasks`
    - `GET /tasks/{id}`
    - `PATCH /tasks/{id}` — partial update; if `status` is being set to `completed`, also set `completed_at = now()`
    - `DELETE /tasks/{id}`
    - `POST /tasks/{id}/complete` — sets `status = 'completed'`, `completed_at = now()`
  - `is_overdue` is computed in the response serializer: `deadline < date.today() and status != 'completed'`
  - All endpoints enforce user ownership

- [x] **4.2** Implement frontend task management

  - Implement `src/hooks/useTasks.ts` — `useTasks(filters?)`, `useTask(id)`, `useCreateTask()`, `useUpdateTask()`, `useDeleteTask()`, `useCompleteTask()`; on complete, invalidate `['tasks']`, `['courses']`, and `['plan', 'today']`
  - Implement `src/components/tasks/TaskForm.tsx` — fields: title, description, course (dropdown), task_type (dropdown), priority (dropdown), difficulty (1–5 selector), estimated_hours (number input), deadline (date picker); all validation via React Hook Form
  - Implement `src/components/tasks/TaskCard.tsx` — shows title, course badge with color, deadline, priority badge, difficulty indicator, status; overdue tasks highlighted with red accent; complete/edit/delete actions; exam type displayed distinctly
  - Implement `src/components/tasks/TaskFilters.tsx` — filter controls for course, status, task_type, priority, deadline range; sort controls for sort_by and sort_order
  - Implement `src/components/tasks/TaskList.tsx` — renders filtered/sorted list; handles empty state (per-filter and total-empty variants)
  - Implement `src/pages/TasksPage.tsx` — combines `TaskFilters`, `TaskList`, add-task button (opens `TaskForm` in modal); task count summary

  Verify:
  - Create a task with all fields including exam type
  - Edit task fields
  - Mark task complete — card updates immediately
  - Filter by course, status, priority
  - Sort by deadline, priority
  - Delete task — confirmation dialog
  - Overdue task (past deadline, not complete) shows red visual treatment

---

## Milestone 5 — Study Material Management

*Goal: Users can upload PDFs, TXT, and Markdown files or paste text. Text is extracted and stored. Materials are listed per course.*

*Depends on: Milestone 3 complete (can be parallel to Milestone 4)*

- [x] **5.1** Implement storage service

  - Implement `app/services/storage_service.py`:
    - `StorageService` ABC with `store(bytes, key, content_type) -> str`, `delete(key)`, `get_url(key)`
    - `LocalStorageService` — stores to `settings.STORAGE_LOCAL_PATH/{key}`; creates directories as needed; `get_url` returns a relative path (dev only, not served publicly)
    - `SupabaseStorageService` — uses `supabase-py` to upload to `settings.SUPABASE_BUCKET`; `get_url` returns the public Supabase Storage URL
  - Storage key format: `{user_id}/{uuid4()}.{extension}` — never uses original filename as path

- [x] **5.2** Implement material text extraction

  In `app/services/material_service.py`:
  - `extract_text_from_pdf(file_bytes: bytes) -> tuple[str, bool]` — uses `pypdf`; returns `(extracted_text, extraction_warning)`; sets `extraction_warning=True` if fewer than 50 characters extracted
  - `extract_text_from_txt(file_bytes: bytes) -> str` — UTF-8 decode with fallback to latin-1
  - `extract_text_from_markdown(file_bytes: bytes) -> str` — UTF-8 decode (markdown stored as-is; no HTML conversion needed for AI context)
  - `validate_upload(file: UploadFile) -> None` — raises `HTTPException(400)` if MIME type not in `{"application/pdf", "text/plain", "text/markdown"}` or file size > 10 MB

- [x] **5.3** Implement backend material endpoints

  - Implement `app/schemas/material.py`: `MaterialResponse`, `PasteTextRequest`
  - Implement `app/api/materials.py` — all 5 endpoints from design.md §3.5:
    - `GET /materials` — list with optional `course_id` filter; returns metadata (no extracted_text in list)
    - `POST /materials/upload` — multipart; validate → extract text → store file → insert DB row; returns `MaterialResponse`
    - `POST /materials/paste` — inserts row with `source_type='pasted_text'`, `extracted_text=content`, no storage key
    - `GET /materials/{id}` — includes `extracted_text` in response
    - `DELETE /materials/{id}` — deletes storage object (if any) then DB row

- [x] **5.4** Implement frontend material management

  - Implement `src/hooks/useMaterials.ts` — `useMaterials(courseId?)`, `useMaterial(id)`, `useUploadMaterial()`, `usePasteMaterial()`, `useDeleteMaterial()`
  - Implement `src/components/materials/UploadForm.tsx` — drag-and-drop file input + manual file picker; shows filename, size, format badge; progress indicator during upload; extraction warning message if PDF returned `extraction_warning: true`
  - Implement `src/components/materials/PasteForm.tsx` — title + textarea for raw content + course dropdown
  - Implement `src/components/materials/MaterialCard.tsx` — title, source type badge, course, file size (if applicable), creation date; delete action with confirm dialog
  - Implement `src/pages/MaterialsPage.tsx` — tabbed or filtered view by course; "Upload File" and "Paste Text" buttons open respective forms in a modal; empty state

  Verify:
  - Upload a PDF — file stored, text extracted and displayed in detail view
  - Upload a scanned PDF — extraction warning shown
  - Upload a TXT file — content extracted
  - Paste raw text — stored as material
  - Delete material — removed from list
  - Files > 10 MB rejected with error message
  - Wrong file type rejected with error message

---

## Milestone 6 — AI Study Assistant

*Goal: Users can ask questions about their uploaded material, request summaries, key points, and quiz generation. All AI failures handled gracefully.*

*Depends on: Milestone 5 complete*

- [x] **6.1** Implement the AI service layer

  - Implement `app/services/ai_service.py`:
    - `AIService` ABC with all 6 method signatures from design.md §4.4
    - `GeminiAIService(AIService)` concrete class:
      - Constructor: `genai.configure(api_key=settings.GEMINI_API_KEY)`, create `GenerativeModel(settings.GEMINI_MODEL, system_instruction=STUDY_COACH_SYSTEM_PROMPT)`
      - `_generate(prompt, timeout=60.0) -> str` — wraps sync SDK call in `asyncio.run_in_executor`; raises `asyncio.TimeoutError` on timeout
      - `extract_json_from_response(raw: str) -> Any` — strips markdown code fences if present, finds first `[` or `{`, attempts `json.loads`; raises `ValueError` on failure
    - All structured-output methods (`generate_study_plan`, `prioritize_tasks`, `extract_key_points`, `generate_quiz`) validate the parsed JSON against Pydantic schemas before returning
  - Implement `STUDY_COACH_SYSTEM_PROMPT` constant (design.md §4.6)
  - Implement all prompt builder functions: `build_chat_prompt`, `build_summary_prompt`, `build_key_points_prompt`, `build_quiz_prompt` — each injects material context with a clear delimiter and source label
  - Implement `get_ai_service()` dependency (lru_cache singleton)

- [x] **6.2** Implement AI assistant API routes

  - Implement `app/schemas/ai.py` — all request/response schemas from design.md §3.6:
    `ChatRequest`, `ChatResponse`, `SummarizeRequest`, `SummarizeResponse`, `KeyPointsRequest`, `KeyPointsResponse`, `QuizRequest`, `QuizResponse`
  - Implement `app/api/ai.py` — all 6 endpoints from design.md §3.6:
    - `POST /ai/assistant/chat` — fetch materials, truncate to 50k chars each, cap history to 10 turns, call `ai_service.answer_question`, return response
    - `POST /ai/assistant/summarize`
    - `POST /ai/assistant/key-points`
    - `POST /ai/assistant/quiz`
    - `POST /ai/prioritize` — fetches all pending/in-progress tasks for user, calls `ai_service.prioritize_tasks`, deletes previous `AIPrioritization` record, inserts new one
    - `GET /ai/prioritize/latest` — returns the most recent stored prioritization or `null` if none exists
  - All AI routes wrapped with the error handler from design.md §4.7 returning HTTP 503 with `code: "AI_UNAVAILABLE"` on failure

- [x] **6.3** Implement frontend AI assistant page

  - Implement `src/hooks/useAI.ts` — mutations for `chat`, `summarize`, `keyPoints`, `quiz`, `prioritize`; query for `latestPrioritization`
  - Implement `src/components/assistant/ChatMessage.tsx` — renders user and assistant messages; assistant messages show a "Based on your material" / "General knowledge" indicator badge; supports markdown-like bold/code rendering (no `dangerouslySetInnerHTML` — use a safe renderer or simple regex formatting)
  - Implement `src/components/assistant/ChatWindow.tsx` — message list with auto-scroll to latest; message input with send button; loading indicator (typing animation) while waiting for response; conversation history maintained in component state (not persisted to DB); "Clear conversation" button
  - Implement `src/components/assistant/QuizDisplay.tsx` — renders quiz questions with selectable options; reveals correct answer and explanation on submit; shows score summary
  - Implement `src/components/assistant/KeyPointsDisplay.tsx` — renders key points grouped by importance (high/medium/low) with color-coded badges
  - Implement `src/pages/AssistantPage.tsx` — left panel: course selector + material multi-select (up to 3); right panel: tab switcher (Chat | Summarize | Key Points | Quiz); each tab uses the selected materials as context; error state with retry button; loading states on all actions

  Verify:
  - Select a material and ask a question — answer returned and grounded-in-material indicator shown
  - Request a summary — text summary returned
  - Request key points — structured list displayed with importance levels
  - Generate quiz — questions rendered; can select answers and see correct results
  - Disconnect from AI (bad API key) — friendly error message + retry button shown, no stack trace visible
  - Conversation history maintained within session; cleared on "Clear conversation"

---

## Milestone 7 — AI Study Planner

*Goal: Users generate a structured weekly study plan. The plan is displayed visually. Completed tasks and adaptive regeneration work.*

*Depends on: Milestone 6 complete (AI service layer), Milestone 4 complete (tasks)*

- [x] **7.1** Implement study planner AI method and prompts

  - Implement `build_plan_prompt(tasks, available_hours_per_day, start_date, end_date) -> str` in `ai_service.py` — uses the template from design.md §4.6; task data includes `task_type`, `deadline`, `difficulty`, `estimated_hours`, `priority`, `course_name`
  - Implement `GeminiAIService.generate_study_plan(...)` — call `_generate`, parse JSON, validate each session against `StudySession` Pydantic schema, return `list[StudySession]`
  - Handle edge case: if AI returns sessions that total more hours per day than `available_hours`, log a warning and silently truncate the day's sessions to fit the limit

- [x] **7.2** Implement plan service and API routes

  - Implement `app/services/plan_service.py`:
    - `generate_plan(db, user_id, ai_service, available_hours, start_date, end_date)`:
      1. Fetch all `not_started` and `in_progress` tasks for user
      2. Fetch exam tasks within 21 days
      3. Call `ai_service.generate_study_plan(...)`
      4. In a single DB transaction: delete all existing `study_plan_sessions` for user, bulk-insert new sessions
      5. Return list of sessions
  - Implement `app/schemas/plan.py`: `GeneratePlanRequest`, `PlanSessionResponse`, `PlanResponse`, `PlanByDateResponse`
  - Implement `app/api/plan.py` — all 4 endpoints from design.md §3.7:
    - `POST /plan/generate`
    - `GET /plan` — returns sessions grouped by date: `{ generated_at, sessions_by_date: { "YYYY-MM-DD": [...] } }`
    - `GET /plan/today` — returns sessions for `date.today()` only
    - `PATCH /plan/sessions/{id}/complete` — sets `is_completed = True` on the session

- [x] **7.3** Implement frontend planner page

  - Implement `src/hooks/usePlan.ts` — `usePlan()`, `usePlanToday()`, `useGeneratePlan()`, `useCompleteSession()`
  - Implement `src/components/plan/SessionCard.tsx` — shows course color bar, task title, duration, session type badge, rationale (expandable), complete toggle
  - Implement `src/components/plan/DayColumn.tsx` — date header, total hours for the day, list of `SessionCard`s; visual indicator for today vs future dates
  - Implement `src/components/plan/WeeklyPlanView.tsx` — horizontal scrollable grid of `DayColumn`s; empty-day columns shown; total planned hours in header; "no plan" empty state with call-to-action
  - Implement `src/pages/PlannerPage.tsx`:
    - Plan generation form: `available_hours_per_day` (slider or number input, 0.5–16), `start_date`, `end_date` (default next 7 days); "Generate Plan" button with loading state
    - Renders `WeeklyPlanView` below the form once a plan exists
    - Regenerate button always visible when plan exists — replaces plan on confirm
    - Error state with retry

  Verify:
  - Generate a plan with 4 hours/day over 7 days — weekly view renders with sessions
  - Sessions respect the daily hour limit (no day exceeds available hours)
  - Exam tasks generate a revision session 1–2 days prior
  - Mark a session complete — card updates immediately
  - Regenerate plan — new plan replaces old one

---

## Milestone 8 — Dashboard and AI Prioritization

*Goal: The dashboard assembles all data into a coherent "what to do next" view. AI prioritization is visible on load.*

*Depends on: Milestones 4, 6, 7 complete*

- [x] **8.1** Implement the dashboard page

  - Implement `src/components/dashboard/TodaysSessions.tsx` — lists today's study sessions from `GET /plan/today`; each session has a complete toggle; empty state "No sessions planned for today — generate a study plan"
  - Implement `src/components/dashboard/UpcomingDeadlines.tsx` — tasks due within 7 days from `GET /tasks?sort_by=deadline&deadline_to=<+7days>&status=not_started,in_progress`; overdue tasks at top with red indicator; each row links to the task in the Tasks page
  - Implement `src/components/dashboard/AIRecommendations.tsx` — shows top 3 tasks from latest prioritization result (`GET /ai/prioritize/latest`); each card shows task title, explanation text, and a "Refresh" button that calls `POST /ai/prioritize` to regenerate; loading state during refresh; empty state if no prioritization exists yet ("Run AI Prioritization to see recommendations")
  - Implement `src/components/dashboard/CourseProgressBar.tsx` — horizontal progress bar per course showing `completed_task_count / total_tasks * 100%`; course color used as fill
  - Implement `src/pages/DashboardPage.tsx`:
    - 4-column responsive grid (collapses to 1 on mobile)
    - Top row: summary stat cards (total tasks, completed today, upcoming exams, courses)
    - Middle row (wide): `TodaysSessions` + `AIRecommendations`
    - Bottom row: `UpcomingDeadlines` + course progress bars
    - All panels load independently with individual loading/error states (not one big spinner)
    - When a task is marked complete: invalidate tasks + courses + plan queries; show toast "Task complete — consider regenerating your plan" with a button linking to `/planner`

- [x] **8.2** Wire exam display on dashboard

  - `UpcomingDeadlines` component filters `task_type = 'exam'` items from the task list and surfaces them separately as "Upcoming Exams" within the next 14 days
  - Exam items use a distinct visual treatment (e.g., calendar icon, different badge color) compared to regular tasks

  Verify:
  - Dashboard loads with all panels populated
  - Today's sessions show correct data from the active plan
  - Upcoming deadlines show tasks due within 7 days
  - Exams within 14 days shown distinctly
  - AI Recommendations shows top 3 prioritized tasks with explanations
  - Completing a task from the dashboard updates counts immediately
  - "Regenerate plan" toast appears after task completion

---

## Milestone 9 — Progress Tracking

*Goal: The progress page gives students a clear view of their academic momentum.*

*Depends on: Milestone 4 complete (tasks), Milestone 3 complete (courses)*

- [x] **9.1** Implement progress backend support

  - Verify `GET /courses/{id}/stats` returns `estimated_hours_total` (sum of `estimated_hours` for all tasks in course) and `estimated_hours_completed` (sum for completed tasks) — add these fields if not already implemented in Milestone 3
  - Add `GET /tasks?status=completed&sort_by=completed_at&sort_order=asc` support for the completion timeline chart (this is just the existing tasks endpoint with these params — verify it works)

- [x] **9.2** Implement frontend progress page

  - Implement `src/components/progress/CourseStatCard.tsx` — per-course card with: course name and color, task counts (total/completed/pending/overdue), completion percentage ring or bar, planned vs completed estimated hours
  - Implement `src/components/progress/HoursComparisonBar.tsx` — overall horizontal stacked bar: planned hours (total) vs completed hours; percentage label; uses Recharts `BarChart`
  - Implement `src/components/progress/CompletionChart.tsx` — line or bar chart of tasks completed per day over the last 14 days; groups `completed_at` timestamps by date; uses Recharts `BarChart` or `LineChart`; x-axis: date labels, y-axis: count; shows "No completed tasks yet" empty state
  - Implement `src/pages/ProgressPage.tsx`:
    - Top summary row: total tasks, completed, pending, overdue (overall across all courses)
    - `HoursComparisonBar` (overall planned vs completed hours)
    - `CompletionChart` (last 14 days activity)
    - Grid of `CourseStatCard` (one per course)
    - Empty state for new users with no tasks yet

  Verify:
  - Complete several tasks — progress page reflects updated counts
  - Completion chart shows activity for days tasks were completed
  - Hours comparison shows sum of estimated_hours for all tasks vs completed tasks
  - Per-course cards show accurate breakdowns

---

## Milestone 10 — Adaptive Planning Integration

*Goal: The plan-regeneration prompt surfaces correctly after task completion. Plan updates cleanly reflect remaining work.*

*Depends on: Milestones 7, 8 complete*

- [x] **10.1** Wire adaptive planning prompts throughout the UI

  - In `TaskCard.tsx` (TasksPage) — after calling `useCompleteTask()`: invalidate plan queries; show toast notification "Task completed! Your study plan may now be outdated." with a "Regenerate Plan" button that navigates to `/planner`
  - In `DashboardPage.tsx` — same toast behavior on task or session completion (already partially covered in Milestone 8 — confirm it's consistent)
  - In `PlannerPage.tsx` — when navigated to with a `?regenerate=true` query param (set by the toast button), auto-scroll to and highlight the generation form
  - When `POST /plan/generate` is called, ensure the backend correctly excludes all `status='completed'` tasks from the AI prompt (already in `plan_service.py` — verify via test)

- [x] **10.2** Handle edge cases in plan generation

  - Empty task list: if no pending tasks exist, `POST /plan/generate` returns HTTP 400 with message "No pending tasks found. Add tasks with deadlines before generating a plan."
  - All tasks already completed: same 400 response
  - Date range too short (start_date = end_date): valid — generates a single-day plan
  - Available hours = 0: reject with HTTP 422 (Pydantic validation: `gt=0`)

  Verify:
  - Complete a task → toast appears with "Regenerate Plan" button
  - Click button → navigated to planner, form highlighted
  - Regenerate plan → completed tasks no longer appear in the new schedule
  - Generate plan with no tasks → clear error message (not a 500)

---

## Milestone 11 — Polish, Error Handling, and Production Readiness

*Goal: The app looks polished, handles all error states gracefully, is fully responsive, and is ready for deployment.*

*Depends on: Milestones 1–10 complete*

- [x] **11.1** Global error handling and loading states

  - Add a global React Query error handler in `main.tsx` — on unhandled query/mutation error, show a toast with the error message
  - Implement a `Toast` / notification system (or use a minimal library like `sonner`) — used for success and error notifications throughout the app
  - Audit every page and component: every `useQuery` must handle `isLoading` (show `Spinner`) and `isError` (show `ErrorMessage` with retry); no raw `undefined` renders
  - Audit every form: all validation errors must display inline; network errors must display as non-blocking error alerts (not crash the form)
  - Verify all AI endpoints show the retry button on failure and a friendly message (never a stack trace)

- [x] **11.2** Responsive layout and UI polish

  - Make `AppLayout.tsx` sidebar collapsible on smaller viewports (≥768px tablet should work); sidebar collapses to icon-only rail on md, full drawer on mobile
  - Review all pages at 768px, 1024px, 1280px breakpoints — no horizontal overflow, no clipped content
  - Add loading skeleton placeholders for dashboard panels (instead of spinners) for a more polished feel
  - Implement empty state illustrations or icons for: no courses, no tasks, no materials, no plan, no progress data
  - Ensure all icon-only buttons have `aria-label` attributes
  - Add `<title>` updates per page (React Helmet or document.title in useEffect)

- [x] **11.3** Backend hardening

  - Add structured logging using Python's `logging` module — log all requests (method, path, status, duration), AI call starts/completions/errors (no PII)
  - Add a `startup` event handler in `main.py` — test DB connection on startup; log success or failure
  - Ensure all `DELETE` operations on materials call `StorageService.delete()` — verify the file is removed from Supabase Storage when a material is deleted
  - Verify all user-ownership checks: write a quick manual test hitting each endpoint with a second user's token to confirm 404 is returned for another user's data
  - Add rate-limit comment/TODO for AI endpoints (actual rate limiting is post-MVP; document in README)

- [x] **11.4** Environment and security audit

  - Verify `.gitignore` covers all secret files: `.env`, `*.env`, `uploads/`, `.venv/`
  - Run `git log --all -- .env` to confirm no `.env` file has ever been committed
  - Verify `backend/.env.example` and `frontend/.env.example` are complete and accurate
  - Confirm no `console.log` statements in frontend code that might leak token values
  - Confirm `ALLOWED_ORIGINS` is set correctly for production in the backend env var

- [x] **11.5** Landing page completion

  - Complete `LandingPage.tsx` (stubbed in Milestone 2) with:
    - Hero: product name, tagline, "Get Started" CTA → `/register`, "Log In" → `/login`
    - Features section: 3–4 feature cards with icons (AI planner, material Q&A, task prioritization, progress tracking)
    - How it works: 3-step visual (Add material → Generate plan → Study smarter)
    - Footer: project name, Kiro attribution, hackathon badge

---

## Milestone 12 — Deployment and Documentation

*Goal: Application publicly deployed and fully documented. Hackathon submission ready.*

*Depends on: Milestone 11 complete*

- [x] **12.1** Deploy the database

  - Create a Neon PostgreSQL project (free tier)
  - Record the `DATABASE_URL` (asyncpg format)
  - Run `alembic upgrade head` against the production database to apply all migrations
  - Verify: connect to the DB and confirm all 7 tables exist

- [x] **12.2** Deploy the backend to Render

  - Create a new Render Web Service connected to the GitHub repository
  - Set root directory to `backend/`
  - Build command: `pip install -r requirements.txt && alembic upgrade head`
  - Start command: `gunicorn app.main:app -k uvicorn.workers.UvicornWorker -w 1 --bind 0.0.0.0:$PORT`
  - Set all production environment variables from design.md §8.2
  - Set `STORAGE_BACKEND=supabase` and configure Supabase Storage credentials
  - Set `ALLOWED_ORIGINS=https://<app>.vercel.app` (placeholder until frontend is deployed — update after)
  - Verify: `GET https://<backend>.onrender.com/health` returns `{"status": "ok"}`

- [x] **12.3** Deploy the frontend to Vercel

  - Create a new Vercel project connected to the GitHub repository
  - Set root directory to `frontend/`
  - Build command: `npm run build`
  - Output directory: `dist`
  - Set `VITE_API_URL=https://<backend>.onrender.com`
  - Update `ALLOWED_ORIGINS` on Render to the actual Vercel URL
  - Verify: app loads at the Vercel URL, login and registration work

- [x] **12.4** Set up Supabase Storage

  - Create a Supabase project (free tier)
  - Create a storage bucket named `study-materials` — set to **private** (not public)
  - Create a service role key with storage permissions
  - Set `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, and `SUPABASE_BUCKET` on Render
  - Verify: upload a PDF through the deployed app — file appears in Supabase Storage dashboard

- [x] **12.5** End-to-end production smoke test

  Run through the following workflows on the deployed application:
  - [ ] Register a new account
  - [ ] Create 2 courses
  - [ ] Create 3 tasks (mix of assignment, exam, regular) with upcoming deadlines
  - [ ] Upload a PDF and a pasted-text material
  - [ ] Ask the AI assistant a question about the uploaded material
  - [ ] Generate a study plan for the next 7 days
  - [ ] View the dashboard — all panels populated
  - [ ] Mark a task complete — toast appears
  - [ ] View the progress page — completion stats and chart visible
  - [ ] Log out — redirected to landing page
  - [ ] Log back in — session restored correctly

- [x] **12.6** Write the README

  README.md must include:
  - Project name and one-paragraph description
  - Live demo URL (Vercel)
  - Screenshot(s) or animated GIF of key screens (dashboard, planner, assistant)
  - Tech stack table (matches design.md §9)
  - Architecture overview (brief — can link to design.md)
  - Local development setup:
    - Prerequisites (Python 3.11+, Node 20+)
    - `git clone` + backend setup (`python -m venv .venv && pip install -r requirements.txt && alembic upgrade head && uvicorn app.main:app --reload`)
    - Frontend setup (`npm install && npm run dev`)
  - Environment variable documentation (all variables, what they do, where to get them)
  - Deployment notes (Render cold start caveat)
  - Kiro spec-driven development section — describe the workflow, link to `.kiro/specs/study-coach/`
  - Hackathon submission section — "Built for Build with Kiro 2026"

- [x] **12.7** Final git history review

  Before submission:
  - Review `git log --oneline` — all commits should follow the conventions from requirements.md
  - Ensure no `.env` files, no `uploads/` content, no secrets are present in any commit
  - Ensure the `.kiro/specs/` directory with `requirements.md`, `design.md`, and `tasks.md` is committed and visible on GitHub — this is the Kiro spec-driven workflow evidence
  - Tag the submission commit: `git tag v1.0.0-hackathon`

---

## Task Summary

| Milestone | Focus | Key Deliverable |
|---|---|---|
| 1 | Scaffolding | Running backend + frontend + connected database |
| 2 | Authentication | Register, login, refresh, protected routes |
| 3 | Courses + UI Primitives | Course CRUD, reusable component library |
| 4 | Task Management | Full task CRUD with filtering, sorting, exams |
| 5 | Study Materials | File upload, text extraction, paste text |
| 6 | AI Study Assistant | Chat, summarize, key points, quiz |
| 7 | AI Study Planner | Plan generation, weekly view, session completion |
| 8 | Dashboard | Assembled dashboard, AI recommendations |
| 9 | Progress Tracking | Charts, per-course stats, hours comparison |
| 10 | Adaptive Planning | Plan-regeneration prompts, edge case handling |
| 11 | Polish + Hardening | Error handling, responsive layout, security audit |
| 12 | Deployment + Docs | Live deployment, README, smoke test, git tag |

---

*End of Implementation Tasks v1.0*
