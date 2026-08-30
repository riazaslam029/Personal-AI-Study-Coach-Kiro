# Requirements Specification
# Personal AI Study & Task Coach

**Project:** Build with Kiro 2026 Hackathon  
**Author:** AI Architect / Lead Engineer  
**Status:** Draft — Awaiting Approval  
**Date:** 2026-08-30  
**Version:** 1.0

---

## 1. Executive Summary

Personal AI Study & Task Coach is a web application for university and college students that transforms scattered study material, tasks, deadlines, and exam dates into an AI-driven, personalized study plan. The AI is not a bolt-on chatbot — it is the core engine that powers prioritization, planning, material comprehension, and adaptive scheduling throughout the application.

The product is designed for individual submission to the Build with Kiro 2026 hackathon and must be publicly deployed, fully functional, and demonstrable without local setup.

---

## 2. Problem Statement

University students manage multiple courses simultaneously, each with assignments, exams, reading lists, and deadlines. Study material is scattered (PDFs, slides, notes). Students frequently do not know what to study next, underestimate time required for tasks, or create study plans that break down after the first missed session. Existing tools are either generic task managers (no AI planning) or AI chatbots (no academic workflow integration).

This application solves the problem by tightly coupling academic task management with AI-powered planning, prioritization, and material understanding.

---

## 3. MVP Scope Definition

### 3.1 In Scope for MVP

| Feature Area | Included Capability |
|---|---|
| Authentication | Email + password registration and login (JWT-based) |
| Dashboard | Today's tasks, upcoming deadlines, upcoming exams, AI recommendation, progress summary |
| Course Management | Create / edit / delete courses; lightweight — name, color, description |
| Task Management | Full CRUD for academic tasks with course, deadline, priority, estimated time, difficulty, status |
| Study Material | Upload PDF, TXT, Markdown; paste raw text; extract and store text content |
| AI Study Assistant | Q&A over uploaded material; summarization; key points; quiz question generation |
| AI Study Planner | Generate a structured weekly study plan from tasks, deadlines, available hours, and courses |
| AI Task Prioritization | Rank tasks with AI-generated rationale considering deadline, difficulty, effort, and exam relevance |
| Progress Tracking | Completed vs pending tasks per course; study time estimates vs actuals; streak/completion rate |
| Adaptive Planning | Regenerate study plan when tasks are completed early, missed, or rescheduled |

### 3.2 Explicitly Out of Scope for MVP

- Real-time collaboration or shared study groups  
- Native mobile application  
- Calendar integration (Google Calendar, Outlook)  
- OCR for scanned documents or image-based PDFs  
- Video or audio study material  
- Spaced repetition flashcard system  
- Email or push notification reminders  
- Social or gamification features  
- Third-party LMS integration (Canvas, Moodle)  
- Offline mode  
- Multi-language UI localization  

### 3.3 Ambiguity Resolutions

| Ambiguity | Decision |
|---|---|
| Authentication provider | Email + password with JWT. No OAuth for MVP — reduces third-party dependencies. |
| AI LLM provider | Google Gemini (gemini-1.5-flash) as primary. Free tier sufficient for MVP. Fallback to OpenAI GPT-4o-mini if Gemini unavailable. Provider abstracted behind a service layer. |
| PDF processing | Text extraction only via `pypdf`. No OCR. Scanned image-only PDFs will produce empty/degraded output — user warned. |
| Study plan output format | Structured JSON schedule (list of daily sessions with course, task, duration, rationale). Rendered as a visual weekly plan in the UI. |
| Adaptive planning trigger | Manual trigger by user ("Regenerate Plan") after marking tasks complete or updating deadlines. Not automatic background re-scheduling. |
| Progress tracking | Derived from task completion records. No separate manual time-logging required for MVP. |
| Course management | Lightweight — required only to group tasks and material. No grade tracking, syllabus upload, or enrollment codes. |
| Maximum document size | 10 MB per file. Text extracted and truncated to 50,000 characters per document for AI context safety. |
| Multi-user | Single-user (per account). All data is user-scoped. No sharing or visibility across accounts. |

---

## 4. Functional Requirements

Requirements use MUST / SHOULD / MAY to indicate priority (RFC 2119).

### 4.1 Authentication (AUTH)

| ID | Requirement |
|---|---|
| AUTH-01 | The system MUST allow a user to register with a unique email address and password. |
| AUTH-02 | The system MUST hash passwords before storage using bcrypt or Argon2. |
| AUTH-03 | The system MUST authenticate users via email and password and return a signed JWT. |
| AUTH-04 | The system MUST require authentication for all API endpoints except registration and login. |
| AUTH-05 | The system MUST enforce token expiry. Expired tokens MUST be rejected. |
| AUTH-06 | The system SHOULD support JWT refresh tokens to avoid frequent re-login. |
| AUTH-07 | The frontend MUST store tokens in memory or httpOnly cookies, not in localStorage. |
| AUTH-08 | The system MUST scope all user data queries to the authenticated user's account. |

### 4.2 Course Management (COURSE)

| ID | Requirement |
|---|---|
| COURSE-01 | The system MUST allow a user to create a course with a name and optional description. |
| COURSE-02 | The system MUST allow a user to assign a color label to a course for visual distinction. |
| COURSE-03 | The system MUST allow a user to edit and delete their courses. |
| COURSE-04 | Deleting a course MUST prompt for confirmation and MUST cascade-delete associated tasks and study materials. |
| COURSE-05 | The system MUST display a list of all courses on the dashboard and course management screen. |

### 4.3 Academic Task Management (TASK)

| ID | Requirement |
|---|---|
| TASK-01 | The system MUST allow a user to create a task with: title, description, course, deadline (date), priority (low/medium/high), estimated duration (hours), difficulty (1–5), and status (not started / in progress / completed). |
| TASK-02 | The system MUST allow a user to edit all fields of a task. |
| TASK-03 | The system MUST allow a user to delete a task with confirmation. |
| TASK-04 | The system MUST allow a user to mark a task as completed and record the completion timestamp. |
| TASK-05 | The system MUST support filtering tasks by course, status, priority, and deadline range. |
| TASK-06 | The system MUST support sorting tasks by deadline, priority, estimated duration, and creation date. |
| TASK-07 | The system SHOULD visually distinguish overdue tasks (past deadline, not completed). |
| TASK-08 | The system MUST expose task data to the AI planning and prioritization services. |

### 4.4 Study Material Management (MATERIAL)

| ID | Requirement |
|---|---|
| MATERIAL-01 | The system MUST allow a user to upload files in PDF, TXT, and Markdown formats. |
| MATERIAL-02 | The system MUST allow a user to paste raw text as a study material entry. |
| MATERIAL-03 | The system MUST extract and store plain text content from uploaded files. |
| MATERIAL-04 | The system MUST associate study material with a course. |
| MATERIAL-05 | The system MUST enforce a maximum file size of 10 MB per upload. |
| MATERIAL-06 | The system MUST truncate extracted text to 50,000 characters per document when passed to AI context. |
| MATERIAL-07 | The system MUST allow a user to delete uploaded study material. |
| MATERIAL-08 | The system MUST display a list of study materials per course. |
| MATERIAL-09 | The system MUST NOT execute uploaded files in any form. |
| MATERIAL-10 | The system SHOULD warn the user if a PDF appears to contain no extractable text (likely scanned/image-only). |
| MATERIAL-11 | Uploaded files MUST be stored securely with non-guessable storage identifiers. |

### 4.5 AI Study Assistant (ASSISTANT)

| ID | Requirement |
|---|---|
| ASSIST-01 | The system MUST allow a user to ask free-text questions about their uploaded study material within a course context. |
| ASSIST-02 | The AI MUST ground its answers in the provided study material and clearly indicate when information comes from general knowledge rather than uploaded documents. |
| ASSIST-03 | The system MUST support a "Summarize" action that generates a concise summary of a selected study material document. |
| ASSIST-04 | The system MUST support a "Key Points" action that extracts the most important concepts from a document. |
| ASSIST-05 | The system MUST support a "Generate Quiz" action that produces 5–10 multiple-choice or short-answer questions based on document content. |
| ASSIST-06 | The system MUST support a "Explain Concept" mode where the user names a concept and the AI explains it using available material. |
| ASSIST-07 | The system MUST handle AI provider errors gracefully, displaying a user-friendly error message without exposing internal errors or stack traces. |
| ASSIST-08 | The system MUST NOT pass the full conversation history unbounded to the AI — context MUST be managed to stay within reasonable token limits. |
| ASSIST-09 | The system SHOULD display a loading state while AI responses are being generated. |
| ASSIST-10 | The system MUST maintain a per-session conversation history displayed in the assistant UI. |

### 4.6 AI Study Planner (PLANNER)

| ID | Requirement |
|---|---|
| PLAN-01 | The system MUST allow a user to initiate study plan generation by providing: available study hours per day and date range for the plan. |
| PLAN-02 | The AI MUST generate a structured daily study schedule covering the specified date range. |
| PLAN-03 | The generated plan MUST include: date, course, task or topic, estimated session duration, and a brief rationale for the scheduling decision. |
| PLAN-04 | The plan MUST prioritize tasks by deadline proximity, difficulty, estimated effort, and explicit priority label. |
| PLAN-05 | The plan MUST NOT schedule more study time per day than the user has specified as available. |
| PLAN-06 | The plan SHOULD include short revision sessions for upcoming exam dates. |
| PLAN-07 | The plan MUST be displayed in a structured, readable weekly view in the UI. |
| PLAN-08 | The system MUST allow a user to regenerate the study plan at any time. |
| PLAN-09 | The AI MUST return the study plan as structured data (JSON) that the backend parses and stores, not as freeform prose only. |
| PLAN-10 | The system MUST handle plan generation failures gracefully with a user-friendly error and retry option. |
| PLAN-11 | The system MUST exclude already-completed tasks from new plan generation. |

### 4.7 AI Task Prioritization (PRIORITY)

| ID | Requirement |
|---|---|
| PRIO-01 | The system MUST provide an AI-generated prioritized task list on demand. |
| PRIO-02 | Each prioritized task MUST include a short human-readable explanation (e.g., "Start with Database Assignment because it is due tomorrow and requires an estimated 3 hours"). |
| PRIO-03 | The AI MUST consider: deadline proximity, difficulty rating, estimated duration, explicit priority label, and any associated exam dates. |
| PRIO-04 | The prioritization MUST be re-runnable — the user can request a fresh prioritization at any time. |
| PRIO-05 | Prioritized tasks MUST be surfaced on the dashboard as "Recommended Next Actions." |

### 4.8 Dashboard (DASH)

| ID | Requirement |
|---|---|
| DASH-01 | The dashboard MUST display today's scheduled tasks (from the active study plan). |
| DASH-02 | The dashboard MUST display upcoming deadlines (tasks due within the next 7 days). |
| DASH-03 | The dashboard MUST display upcoming exams within the next 14 days. |
| DASH-04 | The dashboard MUST display overall task completion progress per course. |
| DASH-05 | The dashboard MUST display the top 3 AI-prioritized "Recommended Next Actions" with rationale. |
| DASH-06 | The dashboard MUST display a summary of the current study plan (today's sessions). |
| DASH-07 | The dashboard SHOULD display a weekly study time target vs. planned hours comparison. |
| DASH-08 | The dashboard MUST be the first screen a user sees after login. |

### 4.9 Progress Tracking (PROGRESS)

| ID | Requirement |
|---|---|
| PROG-01 | The system MUST display total tasks created, completed, pending, and overdue per course and overall. |
| PROG-02 | The system MUST display completion rate as a percentage per course and overall. |
| PROG-03 | The system MUST display a timeline of task completions to show study momentum. |
| PROG-04 | The system SHOULD display a simple chart of completed tasks over time (last 14 days). |
| PROG-05 | The system MUST display total estimated study hours planned vs hours completed. |

### 4.10 Adaptive Planning (ADAPT)

| ID | Requirement |
|---|---|
| ADAPT-01 | When a user marks a task complete, the dashboard MUST reflect the updated state immediately. |
| ADAPT-02 | When a user marks a task complete or updates a deadline, the system MUST offer a prompt to regenerate the study plan. |
| ADAPT-03 | When regenerating the plan, the AI MUST account for newly completed tasks, updated deadlines, and remaining available days. |
| ADAPT-04 | The previous study plan MUST be replaced by the regenerated plan, with the generation timestamp recorded. |

---

## 5. Non-Functional Requirements

### 5.1 Performance

| ID | Requirement |
|---|---|
| NFR-PERF-01 | Standard CRUD API responses MUST complete within 500ms under normal load. |
| NFR-PERF-02 | AI-powered responses (plan generation, assistant Q&A) MAY take up to 30 seconds. The UI MUST show a loading indicator and MUST NOT time out before 60 seconds. |
| NFR-PERF-03 | The frontend initial page load MUST complete within 3 seconds on a standard broadband connection. |
| NFR-PERF-04 | File uploads MUST complete within 30 seconds for files up to 10 MB. |

### 5.2 Security

| ID | Requirement |
|---|---|
| NFR-SEC-01 | API keys and secrets MUST be stored as environment variables and MUST NOT appear in source code or be committed to version control. |
| NFR-SEC-02 | A `.env.example` file MUST document all required environment variables with placeholder values. |
| NFR-SEC-03 | `.env` files MUST be listed in `.gitignore`. |
| NFR-SEC-04 | All API endpoints MUST validate and sanitize inputs. |
| NFR-SEC-05 | File uploads MUST be validated for MIME type and size before processing. |
| NFR-SEC-06 | Uploaded files MUST NOT be executed or rendered as HTML. |
| NFR-SEC-07 | SQL queries MUST use parameterized statements or an ORM (no raw string interpolation). |
| NFR-SEC-08 | CORS MUST be configured to allow only the known frontend origin in production. |
| NFR-SEC-09 | Passwords MUST be hashed with bcrypt (min cost factor 12) or Argon2id. |
| NFR-SEC-10 | JWT secrets MUST be sufficiently long (min 256-bit entropy) and environment-variable-sourced. |

### 5.3 Reliability

| ID | Requirement |
|---|---|
| NFR-REL-01 | AI service failures MUST NOT crash the application. All AI calls MUST be wrapped in error handling that returns a graceful user-facing message. |
| NFR-REL-02 | Database connection failures MUST be logged and surface as 503 responses, not unhandled exceptions. |
| NFR-REL-03 | The application MUST remain functional (CRUD operations) even if the AI provider is temporarily unavailable. |

### 5.4 Maintainability

| ID | Requirement |
|---|---|
| NFR-MAINT-01 | The AI provider integration MUST be abstracted behind a service layer so the underlying LLM can be swapped without changes to business logic. |
| NFR-MAINT-02 | The codebase MUST follow consistent naming conventions and be organized by feature/domain. |
| NFR-MAINT-03 | All environment-variable names MUST be documented in `.env.example`. |

### 5.5 Usability

| ID | Requirement |
|---|---|
| NFR-UX-01 | The application MUST be fully usable on modern desktop browsers (Chrome, Firefox, Safari, Edge). |
| NFR-UX-02 | The application SHOULD be usable on tablet viewports (768px+). |
| NFR-UX-03 | All interactive elements MUST have accessible labels (ARIA) and meet WCAG 2.1 AA contrast requirements. |
| NFR-UX-04 | Loading states MUST be shown for all async operations. |
| NFR-UX-05 | Error states MUST display human-readable messages, not raw error codes. |
| NFR-UX-06 | Destructive actions (delete, clear) MUST require explicit confirmation. |

### 5.6 Deployment

| ID | Requirement |
|---|---|
| NFR-DEP-01 | The application MUST be publicly accessible via HTTPS without requiring local setup. |
| NFR-DEP-02 | The frontend MUST be deployable to a free-tier static hosting service (e.g., Vercel, Netlify). |
| NFR-DEP-03 | The backend MUST be deployable to a free-tier service (e.g., Render, Railway, Fly.io). |
| NFR-DEP-04 | The database MUST use a managed PostgreSQL service (e.g., Neon, Supabase, Railway Postgres). |
| NFR-DEP-05 | The deployment MUST be reproducible from the README instructions. |
| NFR-DEP-06 | The application MUST include a health-check endpoint (`GET /health`) for deployment monitoring. |

---

## 6. Major User Workflows

### Workflow 1: Onboarding and Setup
1. User visits landing page → clicks "Get Started"
2. User registers with email and password
3. User is directed to dashboard (empty state)
4. User creates one or more courses
5. User creates their first task with deadline and estimated time
6. System is ready for AI planning

### Workflow 2: Adding Study Material and Asking Questions
1. User navigates to Study Material
2. User uploads a PDF or pastes text for a course
3. System extracts and stores text content
4. User navigates to AI Study Assistant
5. User selects the course and material context
6. User asks a question → AI responds grounded in the material
7. User requests "Key Points" or "Generate Quiz"

### Workflow 3: Generating a Study Plan
1. User navigates to AI Study Planner
2. User specifies available study hours per day and the planning horizon (e.g., next 7 days)
3. User clicks "Generate Plan"
4. System sends tasks, deadlines, material context, and available hours to AI
5. AI returns structured schedule
6. System renders visual weekly plan
7. User reviews, optionally adjusts inputs, and regenerates

### Workflow 4: Daily Use — Dashboard
1. User opens the application (logged in)
2. Dashboard shows today's study sessions from the active plan
3. Dashboard shows AI-prioritized "What to do next" recommendations
4. User marks a task as complete
5. Dashboard updates immediately
6. System prompts: "Your plan may be outdated — regenerate?"
7. User regenerates plan

### Workflow 5: Tracking Progress
1. User navigates to Progress
2. Views course-by-course completion percentages
3. Views completion timeline chart
4. Sees planned vs actual study hours
5. Identifies overdue or at-risk tasks

---

## 7. AI-Specific Requirements

### 7.1 AI Provider Abstraction
The backend MUST implement an `AIService` interface/class that wraps all LLM calls. Swapping the provider (Gemini → OpenAI) MUST require only configuration changes, not logic changes.

### 7.2 Prompt Engineering Standards
- System prompts MUST establish the AI's role as an academic study coach
- Prompts MUST include explicit instructions to ground answers in provided material
- Prompts MUST instruct the AI to return structured JSON for plan and prioritization endpoints
- Prompts MUST include fallback instructions for when material context is insufficient

### 7.3 Context Management
- Study material passed to AI MUST be truncated to fit within safe token limits (50,000 characters per document, max 3 documents per query)
- Conversation history in the assistant MUST be capped at the last 10 turns to prevent unbounded token growth
- The study planner prompt MUST include only pending/in-progress tasks (not completed ones)

### 7.4 Structured Output Requirements
The following AI interactions MUST return parseable structured output:

| Feature | Required Output Format |
|---|---|
| Study Plan Generation | JSON array of `{ date, course, task_title, duration_minutes, session_type, rationale }` |
| Task Prioritization | JSON array of `{ task_id, priority_rank, explanation }` |
| Quiz Generation | JSON array of `{ question, options: [], correct_answer, explanation }` |
| Key Points | JSON array of `{ point, importance: "high/medium/low" }` |

### 7.5 AI Failure Handling
- All AI calls MUST have a 60-second timeout
- On timeout or provider error: return HTTP 503 with a user-friendly message
- The UI MUST display a retry option for all AI features
- AI errors MUST be logged server-side with timestamp, feature, and error type (no PII in logs)

### 7.6 AI Transparency
- The assistant MUST indicate when an answer is based on uploaded material vs. general knowledge
- Generated study plans MUST include rationale per session
- Prioritization results MUST include human-readable explanations

---

## 8. Technical Constraints

| Constraint | Detail |
|---|---|
| Frontend | React 18+, Vite, TypeScript, Tailwind CSS |
| Backend | Python 3.11+, FastAPI |
| Database | PostgreSQL 15+ via SQLAlchemy ORM (async) |
| Migrations | Alembic |
| AI Provider | Google Gemini (primary); OpenAI (secondary fallback) |
| File Storage | Local filesystem for development; cloud object storage (e.g., Cloudflare R2 or S3-compatible) for production |
| Auth | JWT (python-jose or PyJWT) + bcrypt |
| PDF Processing | pypdf library — text extraction only, no OCR |
| Environment Config | python-dotenv (backend), Vite env variables (frontend) |
| API Style | RESTful JSON API. No GraphQL for MVP. |
| Python Package Management | pip + requirements.txt (or uv for speed) |
| Node Package Management | npm or pnpm |

---

## 9. Deployment Constraints

| Constraint | Detail |
|---|---|
| Must be publicly deployed | Evaluators must access it via HTTPS URL |
| Zero local setup for evaluators | All features must work in the deployed environment |
| Free-tier hosting | Render (backend), Vercel (frontend), Neon/Supabase (database) |
| Cold start awareness | Free-tier backends may cold-start. README must note this. |
| Secret management | All secrets via environment variables on hosting platform, never in code |
| CI/CD | Optional for MVP — manual deploy via platform CLI or dashboard is acceptable |

---

## 10. Security Concerns

| Concern | Mitigation |
|---|---|
| API key exposure | Backend-only AI calls; keys in env vars; `.gitignore` for `.env` |
| Malicious file uploads | MIME type validation; size limits; content stored as text, not executed |
| SQL injection | SQLAlchemy ORM with parameterized queries throughout |
| Auth bypass | JWT required on all protected routes; user-scoped DB queries |
| Password storage | bcrypt with cost factor ≥ 12 |
| CORS misconfig | Restrict to frontend origin in production; no wildcard in prod |
| Overly large AI context | Truncation limits on document text passed to AI |
| Sensitive data in logs | AI error logs must exclude user content and PII |
| JWT secret strength | Minimum 256-bit random secret, environment-variable-sourced |
| XSS via AI output | AI-generated content rendered as text, not raw HTML (React default behavior) |

---

## 11. Acceptance Criteria

The MVP is considered complete when all of the following are true:

### Core Function
- [ ] A new user can register, log in, and access the dashboard
- [ ] A user can create courses, tasks with all required fields, and study materials
- [ ] AI Study Assistant answers questions grounded in uploaded material
- [ ] AI Study Planner generates and displays a structured weekly schedule
- [ ] AI Task Prioritization ranks tasks with explanations on the dashboard
- [ ] Marking a task complete updates dashboard state and triggers plan-regeneration prompt
- [ ] Progress screen shows completion stats and a chart

### Quality Gates
- [ ] No API keys or secrets present in committed code
- [ ] `.env.example` documents all required variables
- [ ] All AI failures return graceful user-facing error messages (not stack traces)
- [ ] Application remains functional for CRUD operations when AI provider is unavailable
- [ ] Overdue tasks are visually distinguished in the task list

### Deployment
- [ ] Frontend is deployed and accessible via public HTTPS URL
- [ ] Backend API is deployed and accessible
- [ ] Database is provisioned and connected in production
- [ ] README contains setup, deployment, and environment variable documentation

### Hackathon-Specific
- [ ] AI is a core, demonstrable part of the application (not cosmetic)
- [ ] Kiro spec-driven workflow is evidenced by `.kiro/specs/` files
- [ ] Git history contains meaningful, incremental commits
- [ ] README includes screenshots or a demo link

---

## 12. Open Questions for Review

The following items require confirmation before the design phase begins:

1. **AI Provider:** Confirm Google Gemini (gemini-1.5-flash) as the primary AI provider, with OpenAI GPT-4o-mini as fallback. Do you have API keys for either, or a preference?

2. **File Storage:** For production, uploaded PDFs need to be stored somewhere. Proposed: Cloudflare R2 (free tier, S3-compatible). Alternatively, Supabase Storage. Confirm preference or accept either.

3. **Authentication scope:** Email + password JWT only. No OAuth (no Google/GitHub login) for MVP. Confirm this is acceptable.

4. **Exam dates:** Should exams be a separate entity (Course + Date + Name) or a special task type (Type = "Exam")? Treating them as a task subtype is simpler — recommend this approach.

5. **Study plan persistence:** Should previous study plans be stored as history (so user can view last 3 plans) or only the current/latest plan? Recommend latest-only for MVP simplicity.

6. **Deployment platform preference:** Render (backend) + Vercel (frontend) + Neon (database) is the recommended free-tier stack. Any platform constraints or preferences?

---

*End of Requirements Specification v1.0*
