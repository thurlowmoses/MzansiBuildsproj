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

## Features

### Comment Tracking & Notifications
- **Comment Count Display**: Project cards show the number of comments with 💬 emoji (e.g., "Comment (5)")
- **Real-time Count**: Comment counts update in real-time as new comments are added
- **Help Notifications**: When a project owner marks a project as needing help, other developers can click "🤝 I can help"
- **Help Offered Notifications**: Project owners receive notifications when developers offer to help
- **Notification Types**: Support for comment, collaboration, follow, and help_offered notification types

### How It Works
1. **View Comments**: Click the "💬 Comment" button showing the comment count to see/add comments
2. **Offer Help**: If a project shows "Needs help: [topic]", click "🤝 I can help" to notify the owner
3. **Track Updates**: Check Notifications page to see all updates with unread badge in navbar
4. **Engage**: Follow developers, raise your hand for collaborations, or offer help directly
## Assignment Roadmap

### What Would Add The Most Rubric Value

- [x] Pagination or load-more on feed, discovery, and notifications so the app feels real at scale.
- [x] Basic tests for the main flows: project completion, milestone breakthroughs, profile update, and notification creation.
- [ ] Firebase Storage rules and a clear upload path for profile images and post images.
- [x] A small dashboard or summary page that shows active projects, followers, and recent activity.
- [ ] Better README sections: setup, env vars, demo account steps, and screenshots.

### What I Would Still Change First

- [ ] Make the profile flow complete: edit photo, edit bio, public profile view, and a clear way to see someone’s projects and current struggles.
- [x] Finish the notification system: follow requests, comment alerts, collaboration alerts, unread badge, and a simple notifications page with mark-as-read.
- [x] Keep the feed consistent: avatar next to name, click name to profile, and a clean empty/loading state.
- [x] Make discovery feel intentional: one page with GitHub and Mzansi tabs, plus a small trending section for local projects.
- [x] Fix any remaining runtime instability before adding anything else.