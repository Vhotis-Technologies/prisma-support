"""
HTTP proxy: support-app → client Prisma ``support/gift-vouchers/{action}/``.
"""
import logging

import requests
from django.conf import settings
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)

GET_ACTIONS = frozenset({"list_gift_vouchers", "get_gift_voucher_detail"})
PATCH_ACTIONS = frozenset({"update_gift_voucher"})


class SupportGiftVouchersProxyView(APIView):
    permission_classes = [IsAuthenticated]

    def _client_url(self, action: str) -> str:
        base = (settings.CLIENT_API_URL or "").rstrip("/")
        return f"{base}/api/v1/support/gift-vouchers/{action}/"

    def _headers(self, content_type_json: bool = False) -> dict:
        headers = {"Accept": "application/json"}
        if content_type_json:
            headers["Content-Type"] = "application/json"
        key = getattr(settings, "SUPPORT_INTERNAL_API_KEY", "") or ""
        if key:
            headers["X-Support-Internal-Key"] = key
        return headers

    def _forward_response(self, resp: requests.Response) -> Response:
        try:
            payload = resp.json() if resp.content else {}
        except ValueError:
            payload = {"error": resp.text or "Invalid JSON from client"}
        return Response(payload, status=resp.status_code)

    def _no_client_url(self):
        return Response(
            {"error": "CLIENT_API_URL is not configured"},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    def get(self, request, action, *args, **kwargs):
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
            logger.warning("Support gift vouchers proxy GET failed: %s", exc)
            return Response(
                {"error": "Client API unavailable", "detail": str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return self._forward_response(resp)

    def patch(self, request, action, *args, **kwargs):
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
            logger.warning("Support gift vouchers proxy PATCH failed: %s", exc)
            return Response(
                {"error": "Client API unavailable", "detail": str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return self._forward_response(resp)
