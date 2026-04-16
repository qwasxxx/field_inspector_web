"""Small shared helpers."""

import secrets


def new_id(prefix: str = "") -> str:
    """Generate a URL-safe unique id string."""

    body = secrets.token_urlsafe(12)
    return f"{prefix}{body}" if prefix else body
