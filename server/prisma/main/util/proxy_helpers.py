"""Helpers for support BFF → client/detailer proxy requests."""

from django.conf import settings

SUPPORT_ACTOR_HEADER = "X-Support-Actor-Email"


def require_support_internal_key() -> str | None:
    """Return configured key, or None if missing (caller should return 503)."""
    return (getattr(settings, "SUPPORT_INTERNAL_API_KEY", None) or "").strip() or None


def internal_proxy_headers(
    request, *, content_type_json: bool = False, actor_email: str | None = None
) -> dict:
    """
    Build headers for BFF → client/detailer proxy calls.

    Always sends ``X-Support-Internal-Key``. Sets ``X-Support-Actor-Email`` from
    ``actor_email`` or the authenticated support user's email for audit on upstream.

    Args:
        request: Incoming DRF/Django request (for JWT user email).
        content_type_json: When True, add ``Content-Type: application/json``.
        actor_email: Override actor email (rare; default from ``request.user``).

    Returns:
        Header dict suitable for ``requests.get/post/patch``.
    """
    headers = {"Accept": "application/json"}
    if content_type_json:
        headers["Content-Type"] = "application/json"
    key = require_support_internal_key()
    if key:
        headers["X-Support-Internal-Key"] = key
    email = actor_email
    if not email:
        user = getattr(request, "user", None)
        if user is not None and getattr(user, "is_authenticated", False):
            email = (getattr(user, "email", "") or "").strip()
    if email:
        headers[SUPPORT_ACTOR_HEADER] = email
    return headers
