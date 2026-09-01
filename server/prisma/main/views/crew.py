"""
HTTP proxy: support-app → **detailer** Prisma API (crew / detailers).

Targets ``DETAILER_API_URL`` (not the client). Requires ``SUPPORT_INTERNAL_API_KEY``
to be set; without it crew reads/writes cannot be forwarded securely.
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
        "get_crew_list",
        "get_crew_detail",
    }
)
PATCH_ACTIONS = frozenset(
    {
        "update_crew",
    }
)


class SupportCrewProxyView(APIView):
    """Forwards GET/PATCH to detailer ``/api/v1/support/crew/...``."""

    permission_classes = [IsAuthenticated]

    def _detailer_url(self, action: str) -> str:
        """Build detailer support crew URL for the given action segment."""
        base = (getattr(settings, "DETAILER_API_URL", None) or "").rstrip("/")
        return f"{base}/api/v1/support/crew/{action}/"

    def _headers(self, content_type_json: bool = False) -> dict:
        """Internal key headers for detailer API (required for crew proxy)."""
        return internal_proxy_headers(content_type_json=content_type_json)

    def _forward_response(self, resp: requests.Response) -> Response:
        """Mirror detailer JSON response to the support app."""
        try:
            payload = resp.json() if resp.content else {}
        except ValueError:
            payload = {"error": resp.text or "Invalid JSON from detailer"}
        return Response(payload, status=resp.status_code)

    def get(self, request, action, *args, **kwargs):
        """Proxy crew list/detail GET; fails fast if internal key or detailer URL missing."""
        if action not in GET_ACTIONS:
            return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)
        key = (getattr(settings, "SUPPORT_INTERNAL_API_KEY", None) or "").strip()
        if not key:
            logger.error(
                "SUPPORT_INTERNAL_API_KEY is empty; cannot proxy crew calls to detailer. "
                "Set the same key in support/.env as on detailer (X-Support-Internal-Key)."
            )
            return Response(
                {
                    "error": "Support server is not configured to call detailer "
                    "(set SUPPORT_INTERNAL_API_KEY in support environment).",
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        base = (getattr(settings, "DETAILER_API_URL", None) or "").rstrip("/")
        if not base:
            return Response(
                {"error": "DETAILER_API_URL is not configured"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        url = self._detailer_url(action)
        params = dict(request.query_params)
        try:
            resp = requests.get(
                url,
                params=params,
                headers=self._headers(),
                timeout=60,
            )
        except requests.RequestException as exc:
            logger.warning("Support crew proxy GET failed: %s", exc)
            return Response(
                {"error": "Detailer API unavailable", "detail": str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return self._forward_response(resp)

    def patch(self, request, action, *args, **kwargs):
        """Proxy crew profile updates (e.g. ``update_crew``) to detailer API."""
        if action not in PATCH_ACTIONS:
            return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)
        key = (getattr(settings, "SUPPORT_INTERNAL_API_KEY", None) or "").strip()
        if not key:
            logger.error(
                "SUPPORT_INTERNAL_API_KEY is empty; cannot proxy crew PATCH to detailer."
            )
            print("SUPPORT_INTERNAL_API_KEY is empty; cannot proxy crew PATCH to detailer.")
            return Response(
                {
                    "error": "Support server is not configured to call detailer "
                    "(set SUPPORT_INTERNAL_API_KEY in support environment).",
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        base = (getattr(settings, "DETAILER_API_URL", None) or "").rstrip("/")
        if not base:
            return Response(
                {"error": "DETAILER_API_URL is not configured"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        url = self._detailer_url(action)
        try:
            resp = requests.patch(
                url,
                json=request.data,
                headers=self._headers(content_type_json=True),
                timeout=60,
            )
        except requests.RequestException as exc:
            logger.warning("Support crew proxy PATCH failed: %s", exc)
            return Response(
                {"error": "Detailer API unavailable", "detail": str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return self._forward_response(resp)
