from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routes.posts import router as posts_router
from routes.projects import router as projects_router
from routes.users import router as users_router

load_dotenv()

# App bootstrap and cross-origin setup.
app = FastAPI(
    title="MzansiBuilds API",
    description="Backend for MzansiBuilds — a platform for developers building in public.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:3000",
    ],
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
