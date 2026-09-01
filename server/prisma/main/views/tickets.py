"""
HTTP proxy: support-app → **client** Prisma support ticket routes.

Authenticated support staff; forwards to ``{CLIENT_API_URL}/api/v1/support/tickets/{action}/``
with ``X-Support-Internal-Key``.
"""
import logging

import requests
from django.conf import settings
from main.util.proxy_helpers import internal_proxy_headers
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)

GET_ACTIONS = frozenset(
    {
        "list_tickets",
        "get_ticket_detail",
    }
)
PATCH_ACTIONS = frozenset({"update_ticket"})


class SupportTicketsProxyView(APIView):
    """
    BFF for client support ticket list, detail, and status updates.

    **Auth:** JWT here; ``X-Support-Internal-Key`` on upstream client calls.
    """

    permission_classes = [IsAuthenticated]

    def _client_url(self, action: str) -> str:
        """Client support tickets action URL."""
        base = (settings.CLIENT_API_URL or "").rstrip("/")
        return f"{base}/api/v1/support/tickets/{action}/"

    def _headers(self, content_type_json: bool = False) -> dict:
        """Proxy headers with internal API key."""
        return internal_proxy_headers(content_type_json=content_type_json)

    def _forward_response(self, resp: requests.Response) -> Response:
        """Mirror client ticket API JSON response."""
        try:
            payload = resp.json() if resp.content else {}
        except ValueError:
            payload = {"error": resp.text or "Invalid JSON from client"}
        return Response(payload, status=resp.status_code)

    def get(self, request, action, *args, **kwargs):
        """Proxy ticket list/detail reads."""
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
            logger.warning("Support tickets proxy GET failed: %s", exc)
            return Response(
                {"error": "Client API unavailable", "detail": str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return self._forward_response(resp)

    def patch(self, request, action, *args, **kwargs):
        """Proxy ticket status updates (e.g. resolve/close) to client API."""
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
            logger.warning("Support tickets proxy PATCH failed: %s", exc)
            return Response(
                {"error": "Client API unavailable", "detail": str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return self._forward_response(resp)
