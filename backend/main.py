# Purpose: Project source file used by the MzansiBuilds application.
# Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.
# This module stays focused on FastAPI bootstrap, middleware, and router wiring.

import os
import time
from collections import defaultdict, deque

from fastapi import FastAPI
from fastapi import Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from routes.posts import router as posts_router
from routes.projects import router as projects_router
from routes.users import router as users_router
from routes.ai import router as ai_router
from routes.feed import router as feed_router

load_dotenv()


def _build_allowed_origins():
    local_origins = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:3000",
    ]
    configured_origins = os.getenv("CORS_ORIGINS", "")
    frontend_url = os.getenv("FRONTEND_URL", "")
    extra_origins = [origin.strip() for origin in configured_origins.split(",") if origin.strip()]

    if frontend_url.strip():
        extra_origins.append(frontend_url.strip())

    return list(dict.fromkeys(local_origins + extra_origins))


def _build_rate_limit_prefixes():
    configured_prefixes = os.getenv("RATE_LIMIT_PATH_PREFIXES", "/ai/help/stream")
    return [prefix.strip() for prefix in configured_prefixes.split(",") if prefix.strip()]


def _build_rate_limit_rules():
    configured_rules = os.getenv("RATE_LIMIT_RULES", "").strip()
    parsed_rules: list[tuple[str, int, int]] = []

    if configured_rules:
        for item in configured_rules.split(","):
            raw = item.strip()
            if not raw:
                continue

            # Format: /path/prefix:requests:window_seconds
            try:
                prefix, requests_limit, window_seconds = raw.split(":", maxsplit=2)
                parsed_rules.append((prefix.strip(), int(requests_limit), int(window_seconds)))
            except ValueError:
                continue

    if parsed_rules:
        return sorted(parsed_rules, key=lambda item: len(item[0]), reverse=True)

    # Backward-compatible defaults from previous single-limit config.
    default_requests = int(os.getenv("RATE_LIMIT_REQUESTS", "20"))
    default_window = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))
    default_prefixes = _build_rate_limit_prefixes()
    return sorted(
        [(prefix, default_requests, default_window) for prefix in default_prefixes],
        key=lambda item: len(item[0]),
        reverse=True,
    )

# App bootstrap and cross-origin setup.
app = FastAPI(
    title="MzansiBuilds API",
    description="Backend for MzansiBuilds — a platform for developers building in public.",
    version="1.0.0",
)

app.state.rate_limit_rules = _build_rate_limit_rules()
app.state.rate_limit_counters = defaultdict(deque)


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    path = request.url.path
    matched_rule = None
    for prefix, requests_limit, window_seconds in request.app.state.rate_limit_rules:
        if path.startswith(prefix):
            matched_rule = (prefix, requests_limit, window_seconds)
            break

    if matched_rule is None:
        return await call_next(request)

    matched_prefix, limit, window_seconds = matched_rule
    client_host = request.client.host if request.client else "unknown"
    limit_key = f"{client_host}:{matched_prefix}"
    now = time.time()
    bucket = request.app.state.rate_limit_counters[limit_key]

    while bucket and (now - bucket[0]) > window_seconds:
        bucket.popleft()

    if len(bucket) >= limit:
        retry_after = max(1, int(window_seconds - (now - bucket[0])))
        return JSONResponse(
            status_code=429,
            content={"detail": "Rate limit exceeded. Try again later."},
            headers={"Retry-After": str(retry_after)},
        )

    bucket.append(now)
    response = await call_next(request)
    response.headers["X-RateLimit-Limit"] = str(limit)
    response.headers["X-RateLimit-Remaining"] = str(max(0, limit - len(bucket)))
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=_build_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lightweight health probe for hosting.
@app.get("/health")
async def health_check():
    return {"status": "MzansiBuilds API is running"}

# Root endpoint for quick sanity checks.
@app.get("/")
async def root():
    return {
        "message": "Welcome to the MzansiBuilds API",
        "docs": "/docs",
        "health": "/health",
    }


app.include_router(users_router, prefix="/users", tags=["users"])
app.include_router(projects_router, prefix="/projects", tags=["projects"])
app.include_router(posts_router, tags=["posts"])
app.include_router(ai_router, prefix="/ai", tags=["ai"])
app.include_router(feed_router, prefix="/feed", tags=["feed"])

