from datetime import date, datetime


def _serialize_value(value):
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, list):
        return [_serialize_value(item) for item in value]
    if isinstance(value, dict):
        return {key: _serialize_value(item) for key, item in value.items()}
    return value


def serialize_snapshot(snapshot):
    payload = snapshot.to_dict() or {}
    payload["id"] = snapshot.id
    return _serialize_value(payload)
