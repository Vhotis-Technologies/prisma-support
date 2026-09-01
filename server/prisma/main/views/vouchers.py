"""
HTTP proxy: support-app → client Prisma ``support/vouchers/{action}/``.

**Auth:** JWT on BFF; upstream ``X-Support-Internal-Key``.

**Actions:** ``list_vouchers``, ``get_voucher_detail``, ``create_voucher``, ``update_voucher``.
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

GET_ACTIONS = frozenset({"list_vouchers", "get_voucher_detail"})
POST_ACTIONS = frozenset({"create_voucher"})
PATCH_ACTIONS = frozenset({"update_voucher"})


class SupportVouchersProxyView(APIView):
    """Authenticated BFF for promotional voucher CRUD via client API."""

    permission_classes = [IsAuthenticated]

    def _client_url(self, action: str) -> str:
        """Client vouchers action URL."""
        base = (settings.CLIENT_API_URL or "").rstrip("/")
        return f"{base}/api/v1/support/vouchers/{action}/"

    def _headers(self, content_type_json: bool = False) -> dict:
        """Proxy headers including internal API key."""
        return internal_proxy_headers(content_type_json=content_type_json)

    def _forward_response(self, resp: requests.Response) -> Response:
        """Mirror client JSON response."""
        try:
            payload = resp.json() if resp.content else {}
        except ValueError:
            payload = {"error": resp.text or "Invalid JSON from client"}
        return Response(payload, status=resp.status_code)

    def _no_client_url(self):
        """503 when ``CLIENT_API_URL`` is not configured."""
        return Response(
            {"error": "CLIENT_API_URL is not configured"},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    def get(self, request, action, *args, **kwargs):
        """Proxy voucher list/detail GET."""
        if action not in GET_ACTIONS:
            return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)
        base = (settings.CLIENT_API_URL or "").rstrip("/")
        if not base:
            return self._no_client_url()
        url = self._client_url(action)
        try:
            resp = requests.get(
                url,
                params=dict(request.query_params),
                headers=self._headers(),
                timeout=60,
            )
        except requests.RequestException as exc:
            logger.warning("Support vouchers proxy GET failed: %s", exc)
            return Response(
                {"error": "Client API unavailable", "detail": str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return self._forward_response(resp)

    def post(self, request, action, *args, **kwargs):
        """Proxy voucher creation POST to client API."""
        if action not in POST_ACTIONS:
            return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)
        base = (settings.CLIENT_API_URL or "").rstrip("/")
        if not base:
            return self._no_client_url()
        url = self._client_url(action)
        try:
            resp = requests.post(
                url,
                json=request.data,
                headers=self._headers(content_type_json=True),
                timeout=60,
            )
        except requests.RequestException as exc:
            logger.warning("Support vouchers proxy POST failed: %s", exc)
            return Response(
                {"error": "Client API unavailable", "detail": str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return self._forward_response(resp)

    def patch(self, request, action, *args, **kwargs):
        """Proxy voucher updates to client API."""
        if action not in PATCH_ACTIONS:
            return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)
        base = (settings.CLIENT_API_URL or "").rstrip("/")
        if not base:
            return self._no_client_url()
        url = self._client_url(action)
        try:
            resp = requests.patch(
                url,
                json=request.data,
                headers=self._headers(content_type_json=True),
                timeout=60,
            )
        except requests.RequestException as exc:
            logger.warning("Support vouchers proxy PATCH failed: %s", exc)
            return Response(
                {"error": "Client API unavailable", "detail": str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return self._forward_response(resp)
