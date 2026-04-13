# Purpose: Project source file used by the MzansiBuilds application.
# Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

from fastapi import APIRouter, Query

from auth import CurrentUser, CurrentUserDep
from firebase_admin import firestore
from firebase_admin_config import get_firestore_client
from routes._helpers import serialize_snapshot

router = APIRouter()


@router.get("/activities")
# Implements list activity feed.
def list_activity_feed(
	user: CurrentUser = CurrentUserDep,
	limit: int = Query(default=20, ge=1, le=50),
	after: str | None = Query(default=None),
):
	# Lightweight read model for feed timeline.
	db = get_firestore_client()
	query_ref = db.collection("activities").order_by("createdAt", direction=firestore.Query.DESCENDING).limit(limit)

	if after:
		cursor_snapshot = db.collection("activities").document(after).get()
		if cursor_snapshot.exists:
			query_ref = query_ref.start_after(cursor_snapshot)

	items = [serialize_snapshot(snapshot) for snapshot in query_ref.stream()]
	return {
		"items": items,
		"nextCursor": items[-1]["id"] if items else None,
		"count": len(items),
		"viewer": user.uid,
	}
