import os
from functools import lru_cache
from pathlib import Path

import firebase_admin
from firebase_admin import auth, credentials, firestore


@lru_cache
def get_firebase_app() -> firebase_admin.App:
    """Initialize and return a singleton Firebase Admin app."""
    # Prefer an already-initialized app when available.
    try:
        return firebase_admin.get_app()
    except ValueError:
        cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        project_id = os.getenv("FIREBASE_PROJECT_ID")

        if cred_path:
            # Use a local service-account file when provided.
            credential_file = Path(cred_path)
            if not credential_file.exists():
                raise RuntimeError(
                    "GOOGLE_APPLICATION_CREDENTIALS points to a missing file: "
                    f"{credential_file}. Update the path or remove the variable."
                )

            cred = credentials.Certificate(cred_path)
            return firebase_admin.initialize_app(cred, {"projectId": project_id} if project_id else None)

        try:
            # Fall back to Application Default Credentials.
            cred = credentials.ApplicationDefault()
            return firebase_admin.initialize_app(cred, {"projectId": project_id} if project_id else None)
        except Exception as exc:
            raise RuntimeError(
                "Firebase Admin could not initialize. Set GOOGLE_APPLICATION_CREDENTIALS to a valid "
                "service-account JSON file path, or configure Application Default Credentials."
            ) from exc


@lru_cache
def get_firestore_client() -> firestore.Client:
    # Client setup stays cached for the whole process.
    get_firebase_app()
    return firestore.client()


def verify_firebase_token(id_token: str) -> dict:
    # Firebase Admin handles signature and expiry checks.
    get_firebase_app()
    return auth.verify_id_token(id_token)
