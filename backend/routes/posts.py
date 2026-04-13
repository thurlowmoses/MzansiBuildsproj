# Purpose: Project source file used by the MzansiBuilds application.
# Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from auth import CurrentUser, CurrentUserDep
from firebase_admin import firestore
from firebase_admin_config import get_firestore_client
from routes._helpers import serialize_snapshot

router = APIRouter()


# Defines the CommentCreateRequest class.
class CommentCreateRequest(BaseModel):
	# Short comment payload for project threads.
	content: str = Field(min_length=1, max_length=2000)


# Defines the CollaborationRequestCreateRequest class.
class CollaborationRequestCreateRequest(BaseModel):
	message: str = Field(min_length=1, max_length=2000)


# Implements ensure project exists.
def _ensure_project_exists(project_id: str):
	# Fail fast when the parent project is missing.
	db = get_firestore_client()
	snapshot = db.collection("projects").document(project_id).get()
	if not snapshot.exists:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
	return snapshot


@router.post("/projects/{project_id}/comments")
# Implements create comment.
def create_comment(project_id: str, payload: CommentCreateRequest, user: CurrentUser = CurrentUserDep):
	# Store comments under the project document.
	db = get_firestore_client()
	project_snapshot = _ensure_project_exists(project_id)
	project = project_snapshot.to_dict() or {}

	ref = db.collection("projects").document(project_id).collection("comments").document()
	ref.set(
		{
			"content": payload.content,
			"userId": user.uid,
			"userName": user.name or user.email or "Developer",
			"createdAt": firestore.SERVER_TIMESTAMP,
		}
	)

	db.collection("projects").document(project_id).set(
		{
			"commentCount": firestore.Increment(1),
			"updatedAt": firestore.SERVER_TIMESTAMP,
		},
		merge=True,
	)

	if project.get("userId") and project.get("userId") != user.uid:
		db.collection("notifications").document().set(
			{
				"type": "comment",
				"recipientId": project["userId"],
				"actorId": user.uid,
				"actorName": user.name or user.email or "Developer",
				"actorPhotoURL": "",
				"message": f"{user.name or user.email or 'Developer'} commented on your project {project.get('title', 'Project')}.",
				"isRead": False,
				"createdAt": firestore.SERVER_TIMESTAMP,
				"targetType": "project",
				"targetId": project_id,
				"projectId": project_id,
				"projectTitle": project.get("title", "Project"),
			}
		)

	db.collection("activities").document().set(
		{
			"type": "project_commented",
			"projectId": project_id,
			"projectTitle": project.get("title", "Project"),
			"projectDescription": project.get("description", ""),
			"projectStage": project.get("stage", "idea"),
			"projectSupportNeeded": project.get("supportNeeded", ""),
			"projectTechStack": project.get("techStack", []),
			"projectUserId": project.get("userId", ""),
			"projectUserName": project.get("userName", "Developer"),
			"actorId": user.uid,
			"actorName": user.name or user.email or "Developer",
			"createdAt": firestore.SERVER_TIMESTAMP,
		}
	)

	return {"id": ref.id, "message": "Comment posted"}


@router.get("/projects/{project_id}/comments")
# Implements list comments.
def list_comments(
	project_id: str,
	user: CurrentUser = CurrentUserDep,
	limit: int = Query(default=20, ge=1, le=50),
	after: str | None = Query(default=None),
):
	# Comments stay newest-first.
	db = get_firestore_client()
	_ensure_project_exists(project_id)

	query_ref = (
		db.collection("projects")
		.document(project_id)
		.collection("comments")
		.order_by("createdAt", direction=firestore.Query.DESCENDING)
		.limit(limit)
	)

	if after:
		cursor_snapshot = db.collection("projects").document(project_id).collection("comments").document(after).get()
		if not cursor_snapshot.exists:
			raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cursor comment not found")
		query_ref = query_ref.start_after(cursor_snapshot)

	items = [serialize_snapshot(snapshot) for snapshot in query_ref.stream()]
	return {
		"items": items,
		"nextCursor": items[-1]["id"] if items else None,
		"count": len(items),
		"viewer": user.uid,
	}


@router.post("/projects/{project_id}/collaboration-requests")
# Implements create collaboration request.
def create_collaboration_request(
	project_id: str,
	payload: CollaborationRequestCreateRequest,
	user: CurrentUser = CurrentUserDep,
):
	# Collaboration requests live beside the project.
	db = get_firestore_client()
	project_snapshot = _ensure_project_exists(project_id)
	project = project_snapshot.to_dict() or {}

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

	db.collection("projects").document(project_id).set(
		{
			"collabCount": firestore.Increment(1),
			"updatedAt": firestore.SERVER_TIMESTAMP,
		},
		merge=True,
	)

	if project.get("userId") and project.get("userId") != user.uid:
		db.collection("notifications").document().set(
			{
				"type": "collaboration",
				"recipientId": project["userId"],
				"actorId": user.uid,
				"actorName": user.name or user.email or "Developer",
				"actorPhotoURL": "",
				"message": f"{user.name or user.email or 'Developer'} raised their hand for your project {project.get('title', 'Project')}.",
				"isRead": False,
				"createdAt": firestore.SERVER_TIMESTAMP,
				"targetType": "project",
				"targetId": project_id,
				"projectId": project_id,
				"projectTitle": project.get("title", "Project"),
			}
		)

	db.collection("activities").document().set(
		{
			"type": "collaboration_requested",
			"projectId": project_id,
			"projectTitle": project.get("title", "Project"),
			"projectDescription": project.get("description", ""),
			"projectStage": project.get("stage", "idea"),
			"projectSupportNeeded": project.get("supportNeeded", ""),
			"projectTechStack": project.get("techStack", []),
			"projectUserId": project.get("userId", ""),
			"projectUserName": project.get("userName", "Developer"),
			"actorId": user.uid,
			"actorName": user.name or user.email or "Developer",
			"createdAt": firestore.SERVER_TIMESTAMP,
		}
	)

	return {"id": ref.id, "message": "Collaboration request submitted"}


@router.get("/projects/{project_id}/collaboration-requests")
# Implements list collaboration requests.
def list_collaboration_requests(
	project_id: str,
	user: CurrentUser = CurrentUserDep,
	limit: int = Query(default=20, ge=1, le=50),
	after: str | None = Query(default=None),
):
	# Return requests in reverse chronological order.
	db = get_firestore_client()
	_ensure_project_exists(project_id)

	project_snapshot = db.collection("projects").document(project_id).get()
	project = project_snapshot.to_dict() or {}
	if project.get("userId") != user.uid:
		raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only owner can view collaboration requests")

	query_ref = (
		db.collection("projects")
		.document(project_id)
		.collection("collaborationRequests")
		.order_by("createdAt", direction=firestore.Query.DESCENDING)
		.limit(limit)
	)

	if after:
		cursor_snapshot = (
			db.collection("projects")
			.document(project_id)
			.collection("collaborationRequests")
			.document(after)
			.get()
		)
		if not cursor_snapshot.exists:
			raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cursor request not found")
		query_ref = query_ref.start_after(cursor_snapshot)

	items = [serialize_snapshot(snapshot) for snapshot in query_ref.stream()]
	return {
		"items": items,
		"nextCursor": items[-1]["id"] if items else None,
		"count": len(items),
		"viewer": user.uid,
	}

