from dataclasses import dataclass

from fastapi import Depends, Header, HTTPException, status

from firebase_admin_config import verify_firebase_token


@dataclass
class CurrentUser:
    # Minimal identity extracted from Firebase.
    uid: str
    email: str | None
    name: str | None


def _parse_bearer_token(authorization: str | None) -> str:
    # Reject missing or malformed auth headers early.
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
        )

    prefix = "Bearer "
    if not authorization.startswith(prefix):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header must use Bearer token",
        )

    token = authorization[len(prefix) :].strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer token is empty",
        )

    return token


def get_current_user(authorization: str | None = Header(default=None)) -> CurrentUser:
    # Verify the Firebase token and expose a small user object.
    token = _parse_bearer_token(authorization)

    try:
        decoded = verify_firebase_token(token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Firebase token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    uid = decoded.get("uid")
    if not uid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is missing required uid claim",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return CurrentUser(
        uid=uid,
        email=decoded.get("email"),
        name=decoded.get("name"),
    )


CurrentUserDep = Depends(get_current_user)
