from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from auth import CurrentUser, CurrentUserDep
from firebase_admin import firestore
from firebase_admin_config import get_firestore_client
from routes._helpers import serialize_snapshot

router = APIRouter()


class CommentCreateRequest(BaseModel):
	content: str = Field(min_length=1, max_length=2000)


class CollaborationRequestCreateRequest(BaseModel):
	message: str = Field(min_length=1, max_length=2000)


def _ensure_project_exists(project_id: str):
	db = get_firestore_client()
	snapshot = db.collection("projects").document(project_id).get()
	if not snapshot.exists:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")


@router.post("/projects/{project_id}/comments")
def create_comment(project_id: str, payload: CommentCreateRequest, user: CurrentUser = CurrentUserDep):
	db = get_firestore_client()
	_ensure_project_exists(project_id)

	ref = db.collection("projects").document(project_id).collection("comments").document()
	ref.set(
		{
			"content": payload.content,
			"userId": user.uid,
			"userName": user.name or user.email or "Developer",
			"createdAt": firestore.SERVER_TIMESTAMP,
		}
	)

	return {"id": ref.id, "message": "Comment posted"}


@router.get("/projects/{project_id}/comments")
def list_comments(project_id: str):
	db = get_firestore_client()
	_ensure_project_exists(project_id)

	query_ref = (
		db.collection("projects")
		.document(project_id)
		.collection("comments")
		.order_by("createdAt", direction=firestore.Query.DESCENDING)
	)

	return [serialize_snapshot(snapshot) for snapshot in query_ref.stream()]


@router.post("/projects/{project_id}/collaboration-requests")
def create_collaboration_request(
	project_id: str,
	payload: CollaborationRequestCreateRequest,
	user: CurrentUser = CurrentUserDep,
):
	db = get_firestore_client()
	_ensure_project_exists(project_id)

	ref = (
		db.collection("projects")
		.document(project_id)
		.collection("collaborationRequests")
		.document()
	)
	ref.set(
		{
			"requesterId": user.uid,
			"requesterName": user.name or user.email or "Developer",
			"requesterEmail": user.email or "",
			"message": payload.message,
			"status": "open",
			"createdAt": firestore.SERVER_TIMESTAMP,
		}
	)

	return {"id": ref.id, "message": "Collaboration request submitted"}


@router.get("/projects/{project_id}/collaboration-requests")
def list_collaboration_requests(project_id: str):
	db = get_firestore_client()
	_ensure_project_exists(project_id)

	query_ref = (
		db.collection("projects")
		.document(project_id)
		.collection("collaborationRequests")
		.order_by("createdAt", direction=firestore.Query.DESCENDING)
	)

	return [serialize_snapshot(snapshot) for snapshot in query_ref.stream()]
