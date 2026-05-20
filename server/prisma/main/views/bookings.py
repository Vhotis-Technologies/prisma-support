"""
HTTP proxy: support-app → **client** Prisma API (bookings domain).

Authenticated support staff hit this Django app; each action is forwarded to
``{CLIENT_API_URL}/api/v1/support/bookings/{action}/`` with the same
``X-Support-Internal-Key`` used on the client. Keeps JWT/session logic in one place
(mobile) while business rules stay on the client monolith.
"""
import logging

import requests
from django.conf import settings
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)

GET_ACTIONS = frozenset(
    {
        "get_bookings_list",
        "get_booking_detail",
        "get_bulk_order_detail",
        "get_reschedule_slots",
        "get_bulk_reschedule_slots",
        "get_reassignment_candidates",
        "get_bulk_reassignment_candidates",
        "get_reassignment_history",
    }
)
PATCH_ACTIONS = frozenset(
    {
        "cancel_booking",
        "reschedule_intent",
        "reschedule_booking",
        "cancel_bulk_order",
        "reschedule_bulk_order",
        "reassign_booking",
        "reassign_bulk_order",
    }
)


class SupportBookingsProxyView(APIView):
    """
    ``IsAuthenticated`` — caller must be logged-in support staff; upstream client call uses the internal key.
    """

    permission_classes = [IsAuthenticated]

    def _client_url(self, action: str) -> str:
        """Build client support bookings URL for the given action segment."""
        base = (settings.CLIENT_API_URL or "").rstrip("/")
        return f"{base}/api/v1/support/bookings/{action}/"

    def _headers(self, content_type_json: bool = False) -> dict:
        """Internal key + optional JSON content type for PATCH bodies."""
        headers = {"Accept": "application/json"}
        if content_type_json:
            headers["Content-Type"] = "application/json"
        key = getattr(settings, "SUPPORT_INTERNAL_API_KEY", "") or ""
        if key:
            headers["X-Support-Internal-Key"] = key
        return headers

    def _forward_response(self, resp: requests.Response) -> Response:
        """Mirror client response JSON and status code to the support app."""
        try:
            payload = resp.json() if resp.content else {}
        except ValueError:
            payload = {"error": resp.text or "Invalid JSON from client"}
        return Response(payload, status=resp.status_code)

    def get(self, request, action, *args, **kwargs):
        """Proxy read-only booking actions (list, detail, slots, reassignment candidates)."""
        if action not in GET_ACTIONS:
            return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)
        base = (settings.CLIENT_API_URL or "").rstrip("/")
        if not base:
            return Response(
                {"error": "CLIENT_API_URL is not configured"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        url = self._client_url(action)
        params = dict(request.query_params)
        try:
            resp = requests.get(
                url,
                params=params,
                headers=self._headers(),
                timeout=60,
            )
        except requests.RequestException as exc:
            logger.warning("Support bookings proxy GET failed: %s", exc)
            return Response(
                {"error": "Client API unavailable", "detail": str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return self._forward_response(resp)

    def patch(self, request, action, *args, **kwargs):
        """Proxy mutating booking actions (cancel, reschedule, reassign)."""
        if action not in PATCH_ACTIONS:
            return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)
        base = (settings.CLIENT_API_URL or "").rstrip("/")
        if not base:
            return Response(
                {"error": "CLIENT_API_URL is not configured"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        url = self._client_url(action)
        try:
            resp = requests.patch(
                url,
                json=request.data,
                headers=self._headers(content_type_json=True),
                timeout=60,
            )
        except requests.RequestException as exc:
            logger.warning("Support bookings proxy PATCH failed: %s", exc)
            return Response(
                {"error": "Client API unavailable", "detail": str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return self._forward_response(resp)
