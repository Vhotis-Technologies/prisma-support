"""
HTTP proxy: support-app → **client** Prisma ``get_activity_feed``.

Forwards query params (``limit``, ``since``) and returns the client JSON as-is.
"""
import logging

import requests
from django.conf import settings
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)


class SupportActivitiesProxyView(APIView):
    """Thin wrapper: authenticated support staff → client support activities route."""

    permission_classes = [IsAuthenticated]
    action_handler = {
        "get_activity_feed": "_get_activity_feed",
    }

    def get(self, request, *args, **kwargs):
        """Dispatch GET by URL ``action`` to the configured handler."""
        action = kwargs.get("action")
        if action not in self.action_handler:
            return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)
        handler = getattr(self, self.action_handler[action])
        return handler(request)

    def _get_activity_feed(self, request):
        """Proxy ``get_activity_feed`` with ``limit`` / ``since`` query params."""
        base = (settings.CLIENT_API_URL or "").rstrip("/")
        if not base:
            return Response(
                {"error": "CLIENT_API_URL is not configured"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        url = f"{base}/api/v1/support/activities/get_activity_feed/"
        headers = {"Accept": "application/json"}
        key = getattr(settings, "SUPPORT_INTERNAL_API_KEY", "") or ""
        if key:
            headers["X-Support-Internal-Key"] = key
        params = {k: request.query_params.get(k) for k in request.query_params}
        logger.info(
            "Activities proxy: requesting client GET %s with params=%s",
            url,
            params,
        )
        try:
            resp = requests.get(url, headers=headers, params=params, timeout=60)
        except requests.RequestException as exc:
            logger.warning("Support activities proxy GET failed: %s", exc)
            return Response(
                {"error": "Client API unavailable", "detail": str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        try:
            payload = resp.json() if resp.content else {}
        except ValueError:
            payload = {"error": resp.text or "Invalid JSON from client"}
        return Response(payload, status=resp.status_code)
