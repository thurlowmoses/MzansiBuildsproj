# Purpose: Project source file used by the MzansiBuilds application.
# Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from auth import CurrentUser, CurrentUserDep
from firebase_admin import firestore
from firebase_admin_config import get_firestore_client

router = APIRouter()


# Defines the UpdateProfileRequest class.
class UpdateProfileRequest(BaseModel):
	# Profile fields the frontend can update.
	displayName: str | None = None
	bio: str | None = None
	photoURL: str | None = None
	isPrivate: bool | None = None


# Defines the FollowRequest class.
class FollowRequest(BaseModel):
	# Request to follow another user.
	targetUserId: str


@router.get("/me")
# Implements get my profile.
def get_my_profile(user: CurrentUser = CurrentUserDep):
	# Return the saved profile or a safe default.
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
# Implements update my profile.
def update_my_profile(payload: UpdateProfileRequest, user: CurrentUser = CurrentUserDep):
	# Merge only the fields that were sent.
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


@router.post("/follow")
# Implements follow user.
def follow_user(payload: FollowRequest, user: CurrentUser = CurrentUserDep):
	# Create a follow relationship and send notification.
	db = get_firestore_client()
	target_id = payload.targetUserId

	# Prevent following yourself.
	if target_id == user.uid:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot follow yourself")

	# Check if target user exists.
	target_snapshot = db.collection("users").document(target_id).get()
	target_data = target_snapshot.to_dict() or {} if target_snapshot.exists else {}

	# Create the follow relationship.
	db.collection("follows").document().set({
		"followerId": user.uid,
		"followerName": user.name or user.email or "Developer",
		"followerPhotoURL": "",
		"followingId": target_id,
		"createdAt": firestore.SERVER_TIMESTAMP,
	})

	# Create notification for the user being followed.
	db.collection("notifications").document().set({
		"type": "follow",
		"recipientId": target_id,
		"actorId": user.uid,
		"actorName": user.name or user.email or "Developer",
		"actorPhotoURL": "",
		"message": f"{user.name or user.email or 'Developer'} started following you.",
		"isRead": False,
		"createdAt": firestore.SERVER_TIMESTAMP,
		"targetType": "profile",
		"targetId": user.uid,
	})

	return {"message": "Followed user", "followingId": target_id}


@router.delete("/follow/{target_id}")
# Implements unfollow user.
def unfollow_user(target_id: str, user: CurrentUser = CurrentUserDep):
	# Remove follow relationship.
	db = get_firestore_client()

	# Find and delete the follow document.
	follows = db.collection("follows").where("followerId", "==", user.uid).where("followingId", "==", target_id).stream()
	for doc in follows:
		doc.reference.delete()

	return {"message": "Unfollowed user", "targetId": target_id}

