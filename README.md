# MzansiBuildsproj

MzansiBuildsproj is a full-stack social builder platform where developers create projects, build in public, follow other builders, and collaborate through activity, comments, and project workflows.

## Architecture Summary

The solution uses a layered architecture composed of a React + Vite frontend, a FastAPI backend, and Firebase services for authentication and persistence. The frontend handles user interaction, routing, and optimistic UI behavior, while the backend enforces authenticated access, business rules, and write/read patterns for project, user, feed, and interaction workflows. Firebase Authentication provides identity and token issuance, and Firestore acts as the primary data store for users, projects, follows, activities, comments, collaboration requests, and notifications. Cross-cutting concerns such as CORS, health probes, and path-based rate limiting are centralized in the FastAPI bootstrap to keep route modules focused and maintainable.

## Repository Structure

- `frontend/`: React app (Vite, React Router, Firebase Web SDK).
- `backend/`: FastAPI API service (Firebase Admin auth + Firestore access).
- `dataconnect/`: Firebase Data Connect schema and seed assets.
- `functions/`: Firebase Functions starter code.
- `.github/workflows/continuous-delivery.yml`: CI/CD pipeline.

## Tech Stack

- Frontend: React 19, Vite 8, React Router 7, Firebase Web SDK.
- Backend: FastAPI, Pydantic v2, Firebase Admin SDK, python-dotenv.
- Data/Auth: Firestore + Firebase Authentication.
- Deployment: Vercel (frontend) + Render (backend) via GitHub Actions deploy hooks.

## Local Setup

### 1. Prerequisites

- Node.js 20+
- Python 3.11+
- Firebase project with Authentication + Firestore enabled
- Firebase service account JSON for backend admin access

### 2. Configure Environment Variables

Use these templates:

- Root shared template: `.env.example`
- Frontend template: `frontend/.env.example`
- Backend template: `backend/.env.example`

Frontend required keys (in `frontend/.env.local`):

- `VITE_BACKEND_URL`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

Backend required keys (in `backend/.env`):

- `FIREBASE_PROJECT_ID`
- `GOOGLE_APPLICATION_CREDENTIALS`
- `FRONTEND_URL`
- `CORS_ORIGINS`
- `RATE_LIMIT_REQUESTS`
- `RATE_LIMIT_WINDOW_SECONDS`
- `RATE_LIMIT_PATH_PREFIXES`
- `RATE_LIMIT_RULES`

### 3. Install Dependencies

Frontend:

```bash
cd frontend
npm install
```

Backend:

```bash
cd backend
python -m pip install -r requirements.txt
```

### 4. Run Locally

Backend (from `backend/`):

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Frontend (from `frontend/`):

```bash
npm run dev
```

Quick checks:

- Backend health: `http://127.0.0.1:8000/health`
- API docs: `http://127.0.0.1:8000/docs`
- Frontend: `http://localhost:5173`

## Backend API Modules

Current route modules and responsibilities:

- `routes/users.py`
	- `GET /users/me`
	- `PATCH /users/me`
	- `POST /users/follow`
	- `DELETE /users/follow/{target_id}`
- `routes/projects.py`
	- `POST /projects/`
	- `GET /projects/`
	- `GET /projects/{project_id}`
	- `PATCH /projects/{project_id}`
	- `DELETE /projects/{project_id}`
	- `POST /projects/{project_id}/complete`
- `routes/posts.py`
	- `POST /projects/{project_id}/comments`
	- `GET /projects/{project_id}/comments`
	- `POST /projects/{project_id}/collaboration-requests`
	- `GET /projects/{project_id}/collaboration-requests`
- `routes/feed.py`
	- `GET /feed/activities`
- `routes/ai.py`
	- `POST /ai/help/stream` (streaming text response)

## Security and Runtime Behavior

- Auth: Bearer token verification with Firebase Admin (`backend/auth.py`).
- CORS: Built from localhost defaults + `CORS_ORIGINS` + `FRONTEND_URL`.
- Rate limiting: Path-prefix-based limits in middleware (`RATE_LIMIT_RULES`).
- Firestore writes: Server timestamps and owner checks for protected updates/deletes.

## CI/CD

GitHub Actions workflow: `.github/workflows/continuous-delivery.yml`

On push and pull request:

- Frontend: `npm ci`, `npm run lint`, `npm run build`
- Backend: `python -m compileall ...`, `python -m unittest discover -s backend/tests`

On push to `main`:

- Triggers Vercel deploy hook (frontend)
- Triggers Render deploy hook (backend)

Required GitHub secrets:

- `VERCEL_DEPLOY_HOOK_URL`
- `RENDER_DEPLOY_HOOK_URL`

## Main Features

- Firebase-authenticated user profiles with editable privacy fields.
- Project lifecycle: create, edit, delete, and mark complete.
- Social interactions: comments, follows, collaboration requests.
- Activity feed and notification creation on key events.
- AI helper endpoint with streamed guidance responses.
