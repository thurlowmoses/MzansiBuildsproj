# MzansiBuildsproj

MzansiBuildsproj is a full-stack builder platform for sharing projects, following developers, sending direct messages, and tracking progress in public.

## Structure

- `frontend/` React app with the social UI, feed, messages, and profile pages.
- `backend/` FastAPI service for authenticated reads and writes.
- `dataconnect/` Firebase Data Connect schema, seed data, and examples.
- `functions/` Firebase Functions starter code.

## Local Setup

1. Install dependencies in the frontend and backend folders.
2. Configure Firebase environment variables.
3. Run the frontend and backend locally before pushing changes.

## Docker Setup

Run both services with Docker Compose.

1. Set your Firebase admin credential path in PowerShell:
	- `$env:GOOGLE_APPLICATION_CREDENTIALS="C:\\path\\to\\firebase-admin.json"`
2. Start containers from the repository root:
	- `docker compose up --build`
3. Open the app:
	- Frontend: `http://localhost:5173`
	- Backend: `http://localhost:8000`

To stop:
- `docker compose down`