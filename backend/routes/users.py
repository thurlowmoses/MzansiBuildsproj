from fastapi import APIRouter
from pydantic import BaseModel

from auth import CurrentUser, CurrentUserDep
from firebase_admin import firestore
from firebase_admin_config import get_firestore_client

router = APIRouter()


class UpdateProfileRequest(BaseModel):
	displayName: str | None = None
	bio: str | None = None
	photoURL: str | None = None
	isPrivate: bool | None = None


@router.get("/me")
def get_my_profile(user: CurrentUser = CurrentUserDep):
	db = get_firestore_client()
	snapshot = db.collection("users").document(user.uid).get()

	if not snapshot.exists:
		return {
			"uid": user.uid,
			"email": user.email,
			"displayName": user.name,
			"bio": "",
			"isPrivate": False,
			"photoURL": "",
		}

	profile = snapshot.to_dict() or {}
	profile["uid"] = user.uid
	profile.setdefault("email", user.email)
	profile.setdefault("displayName", user.name)
	profile.setdefault("bio", "")
	profile.setdefault("isPrivate", False)
	profile.setdefault("photoURL", "")
	return profile


@router.patch("/me")
def update_my_profile(payload: UpdateProfileRequest, user: CurrentUser = CurrentUserDep):
	db = get_firestore_client()
	updates = payload.model_dump(exclude_none=True)
	updates_with_timestamp = {**updates, "updatedAt": firestore.SERVER_TIMESTAMP}
	updates_with_timestamp.setdefault("email", user.email)

	db.collection("users").document(user.uid).set(updates_with_timestamp, merge=True)

	return {
		"message": "Profile updated",
		"uid": user.uid,
		"applied": updates,
	}
