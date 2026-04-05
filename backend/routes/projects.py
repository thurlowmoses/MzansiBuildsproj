from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from auth import CurrentUser, CurrentUserDep
from firebase_admin import firestore
from firebase_admin_config import get_firestore_client
from routes._helpers import serialize_snapshot

router = APIRouter()


class ProjectCreateRequest(BaseModel):
	title: str = Field(min_length=3, max_length=120)
	description: str = Field(min_length=10, max_length=2000)
	techStack: list[str] = Field(default_factory=list)
	stage: str = "idea"
	supportNeeded: str = ""


class ProjectUpdateRequest(BaseModel):
	title: str | None = None
	description: str | None = None
	techStack: list[str] | None = None
	stage: str | None = None
	supportNeeded: str | None = None


class CompletionRequest(BaseModel):
	complete: bool = True


def _get_project_or_404(project_id: str):
	db = get_firestore_client()
	snapshot = db.collection("projects").document(project_id).get()
	if not snapshot.exists:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
	return snapshot


@router.post("/")
def create_project(payload: ProjectCreateRequest, user: CurrentUser = CurrentUserDep):
	db = get_firestore_client()
	ref = db.collection("projects").document()

	record = {
		"title": payload.title,
		"description": payload.description,
		"techStack": payload.techStack,
		"stage": payload.stage,
		"supportNeeded": payload.supportNeeded,
		"userId": user.uid,
		"userName": user.name or user.email or "Developer",
		"completed": False,
		"createdAt": firestore.SERVER_TIMESTAMP,
		"updatedAt": firestore.SERVER_TIMESTAMP,
	}

	ref.set(record)
	return {"id": ref.id, "message": "Project created"}


@router.get("/")
def list_projects():
	db = get_firestore_client()
	snapshots = db.collection("projects").stream()
	items = [serialize_snapshot(snapshot) for snapshot in snapshots]
	items.sort(key=lambda row: row.get("createdAt", ""), reverse=True)
	return items


@router.get("/{project_id}")
def get_project(project_id: str):
	snapshot = _get_project_or_404(project_id)
	return serialize_snapshot(snapshot)


@router.patch("/{project_id}")
def update_project(project_id: str, payload: ProjectUpdateRequest, user: CurrentUser = CurrentUserDep):
	db = get_firestore_client()
	snapshot = _get_project_or_404(project_id)
	project = snapshot.to_dict() or {}

	if project.get("userId") != user.uid:
		raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only owner can update project")

	updates = payload.model_dump(exclude_none=True)
	updates["updatedAt"] = firestore.SERVER_TIMESTAMP
	db.collection("projects").document(project_id).set(updates, merge=True)

	return {"message": "Project updated", "id": project_id}


@router.post("/{project_id}/complete")
def complete_project(project_id: str, payload: CompletionRequest, user: CurrentUser = CurrentUserDep):
	db = get_firestore_client()
	snapshot = _get_project_or_404(project_id)
	project = snapshot.to_dict() or {}

	if project.get("userId") != user.uid:
		raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only owner can complete project")

	is_complete = payload.complete
	db.collection("projects").document(project_id).set(
		{
			"completed": is_complete,
			"stage": "completed" if is_complete else (project.get("stage") or "building"),
			"completedAt": firestore.SERVER_TIMESTAMP if is_complete else None,
			"updatedAt": firestore.SERVER_TIMESTAMP,
		},
		merge=True,
	)

	return {"message": "Project completion updated", "id": project_id, "completed": is_complete}
