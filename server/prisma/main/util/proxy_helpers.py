"""Helpers for support BFF → client/detailer proxy requests and validation of incoming bridge requests."""

from django.conf import settings
from rest_framework.response import Response
from rest_framework import status as http_status

SUPPORT_ACTOR_HEADER = "X-Support-Actor-Email"
INTERNAL_KEY_HEADER = "X-Support-Internal-Key"


def require_support_internal_key() -> str | None:
    """Return configured key, or None if missing (caller should return 503)."""
    return (getattr(settings, "SUPPORT_INTERNAL_API_KEY", None) or "").strip() or None


def validate_internal_key(request) -> tuple[bool, Response | None]:
    """
    Validate that incoming request has correct X-Support-Internal-Key header.
    
    Used by bridge endpoints that receive requests from detailer BFF.
    
    Returns:
        (True, None) if valid
        (False, error_response) if invalid or missing
    """
    expected_key = require_support_internal_key()
    if not expected_key:
        return (
            False,
            Response(
                {"error": "SUPPORT_INTERNAL_API_KEY not configured on support server"},
                status=http_status.HTTP_503_SERVICE_UNAVAILABLE
            )
        )
    
    received_key = request.headers.get(INTERNAL_KEY_HEADER, "").strip()
    if not received_key:
        return (
            False,
            Response(
                {"error": "Missing X-Support-Internal-Key header"},
                status=http_status.HTTP_401_UNAUTHORIZED
            )
        )
    
    if received_key != expected_key:
        return (
            False,
            Response(
                {"error": "Invalid X-Support-Internal-Key"},
                status=http_status.HTTP_403_FORBIDDEN
            )
        )
    
    return (True, None)


def attach_public_hop_headers(headers: dict) -> dict:
    """Add ngrok skip when client/detailer URLs are public tunnels."""
    hop = " ".join(
        [
            getattr(settings, "CLIENT_API_URL", None) or "",
            getattr(settings, "DETAILER_API_URL", None) or "",
        ]
    )
    if "ngrok" in hop:
        headers["ngrok-skip-browser-warning"] = "1"
    return headers


def internal_proxy_headers(
    request=None, *, content_type_json: bool = False, actor_email: str | None = None
) -> dict:
    """
    Build headers for BFF → client/detailer proxy calls.

    Always sends ``X-Support-Internal-Key``. Sets ``X-Support-Actor-Email`` from
    ``actor_email`` or the authenticated support user's email for audit on upstream.

    Args:
        request: Incoming DRF/Django request (for JWT user email). Optional.
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
    if not email and request is not None:
        user = getattr(request, "user", None)
        if user is not None and getattr(user, "is_authenticated", False):
            email = (getattr(user, "email", "") or "").strip()
    if email:
        headers[SUPPORT_ACTOR_HEADER] = email
    return attach_public_hop_headers(headers)
