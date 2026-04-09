import asyncio
import json
import os
from urllib import error as urllib_error
from urllib import request as urllib_request

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

router = APIRouter()


class HelpStreamRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)


def _fallback_response(question: str) -> str:
    q = question.lower()

    if any(token in q for token in ["create", "project", "new post", "publish"]):
        return (
            "To create a project, open New Project, complete title/description/tech stack, and click post. "
            "Your project appears in feed immediately after save."
        )

    if any(token in q for token in ["message", "dm", "chat", "contact"]):
        return (
            "Open Messages, pick a developer from the list, type your message, and send. "
            "Use this for collaboration requests and follow-ups."
        )

    if any(token in q for token in ["milestone", "timeline", "done"]):
        return (
            "Open Project Details to add milestones, set statuses, and mark progress as done. "
            "When a project is marked completed, it appears on Celebration Wall and followers are notified."
        )

    if any(token in q for token in ["profile", "bio", "display name"]):
        return (
            "Open Profile to edit your display name, bio, and account visibility. "
            "Public profiles are visible from feed, discovery, and notifications."
        )

    if any(token in q for token in ["celebration", "completed", "wall"]):
        return (
            "Mark a project as completed in Project Details or Feed. "
            "Completed projects and breakthroughs appear on Celebration Wall."
        )

    return (
        "I can help with projects, feed, milestones, messages, notifications, profile settings, and celebration wall. "
        "Ask a specific task and I will guide you step by step."
    )


def _openai_response(question: str) -> str | None:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip()

    if not api_key:
        return None

    body = {
        "model": model,
        "temperature": 0.3,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are MzansiBuilds assistant. Give concise, practical product guidance. "
                    "Prefer actionable steps with app navigation hints."
                ),
            },
            {"role": "user", "content": question},
        ],
    }

    req = urllib_request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib_request.urlopen(req, timeout=20) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except (urllib_error.URLError, urllib_error.HTTPError, TimeoutError, json.JSONDecodeError):
        return None

    try:
        content = payload["choices"][0]["message"]["content"]
        if isinstance(content, str):
            return content.strip()
    except (KeyError, IndexError, TypeError):
        return None

    return None


async def _stream_text(text: str):
    # Stream word chunks so frontend can render progressively.
    parts = text.split(" ")
    for index, word in enumerate(parts):
        suffix = " " if index < len(parts) - 1 else ""
        yield f"{word}{suffix}"
        await asyncio.sleep(0.01)


@router.post("/help/stream")
async def stream_help(payload: HelpStreamRequest):
    question = payload.question.strip()
    answer = _openai_response(question) or _fallback_response(question)
    return StreamingResponse(_stream_text(answer), media_type="text/plain; charset=utf-8")
