# Purpose: Project source file used by the MzansiBuilds application.
# Notes: Keep behavior-focused changes here and move cross-cutting logic to hooks/utilities.

from datetime import date, datetime


# Implements serialize value.
def _serialize_value(value):
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, list):
        return [_serialize_value(item) for item in value]
    if isinstance(value, dict):
        return {key: _serialize_value(item) for key, item in value.items()}
    return value


# Implements serialize snapshot.
def serialize_snapshot(snapshot):
    payload = snapshot.to_dict() or {}
    payload["id"] = snapshot.id
    return _serialize_value(payload)


# Implements is breakthrough milestone.
def is_breakthrough_milestone(payload):
    return (payload or {}).get("status") == "done"

