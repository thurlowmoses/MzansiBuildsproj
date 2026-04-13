# MzansiBuildsproj

MzansiBuildsproj is a full-stack builder platform for sharing projects, following developers, sending direct messages, and tracking progress in public.

## Structure

- `frontend/` React app with the social UI, feed, messages, and profile pages.
- `backend/` FastAPI service for authenticated reads and writes.
- `dataconnect/` Firebase Data Connect schema, seed data, and examples.
- `functions/` Firebase Functions starter code.

## Local Setup

1. Install dependencies in the frontend and backend folders.
2. Configure environment variables using `.env.example`, `frontend/.env.example`, and `backend/.env.example`.
3. Run the frontend and backend locally.

## Continuous Delivery

The repository now includes a GitHub Actions workflow that runs frontend lint/build and backend syntax/tests on every push and pull request. On pushes to `main`, it deploys the frontend to Vercel and triggers the backend deploy hook on Render after CI succeeds.

Required GitHub secrets:

- `VERCEL_DEPLOY_HOOK_URL`
- `RENDER_DEPLOY_HOOK_URL`

For Vercel, configure the frontend environment variables and Firebase settings in the Vercel project environment, including `VITE_BACKEND_URL` pointing to the Render backend URL.

For Render, configure the backend environment variables and Firebase service credentials in the Render service environment, including `FRONTEND_URL` or `CORS_ORIGINS` so the backend accepts requests from the deployed frontend domain.

## Main Features

- Authentication with email verification and password reset.
- Project creation, editing, completion, and project detail pages.
- Feed, discovery, and dashboard experiences with social context.
- Public/private profiles, follows, notifications, and direct messages.
- File attachments for projects and messages.
