"""
HTTP proxy: support-app → **client** Prisma support accounting routes.

JSON actions forward JSON as-is. ``export_month_pdf`` passes through binary PDF bytes
and Content-Disposition headers.
"""
import logging

import requests
from django.conf import settings
from django.http import HttpResponse
from main.util.proxy_helpers import internal_proxy_headers
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)

JSON_ACTIONS = frozenset(
    {
        "get_monthly_summaries",
        "get_month_detail",
    }
)
PDF_ACTION = "export_month_pdf"


class SupportAccountingProxyView(APIView):
    """
    BFF proxy for client support accounting (summaries, month detail, PDF export).

    **Auth:** JWT ``IsAuthenticated`` on this app; upstream uses ``X-Support-Internal-Key``.
    """

    permission_classes = [IsAuthenticated]

    def perform_content_negotiation(self, request, force=False):
        """Force JSON renderer for PDF action so DRF does not reject ``Accept: */*`` early."""
        if self.kwargs.get("action") == PDF_ACTION:
            return JSONRenderer(), JSONRenderer.media_type
        return super().perform_content_negotiation(request, force)

    def _client_url(self, action: str) -> str:
        """Full URL to client ``/api/v1/support/accounting/{action}/``."""
        base = (settings.CLIENT_API_URL or "").rstrip("/")
        return f"{base}/api/v1/support/accounting/{action}/"

    def _headers(self) -> dict[str, str]:
        """Proxy headers with internal key (no actor email on accounting reads)."""
        return internal_proxy_headers()

    def _forward_json(self, resp: requests.Response) -> Response:
        """Pass through client JSON body and HTTP status to the support app."""
        try:
            payload = resp.json() if resp.content else {}
        except (ValueError, TypeError):
            payload = {"error": resp.text or "Invalid JSON from client"}
        return Response(payload, status=resp.status_code)

    def get(self, request, action, *args, **kwargs):
        """Forward GET to client accounting action (JSON or binary PDF)."""
        if action == PDF_ACTION:
            return self._forward_pdf(request)
        if action not in JSON_ACTIONS:
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
            resp = requests.get(url, headers=self._headers(), params=params, timeout=120)
        except requests.RequestException as exc:
            logger.warning("Support accounting proxy GET failed: %s", exc)
            return Response(
                {"error": "Client API unavailable", "detail": str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return self._forward_json(resp)

    def _forward_pdf(self, request):
        """Stream PDF bytes and Content-Disposition from client export endpoint."""
        base = (settings.CLIENT_API_URL or "").rstrip("/")
        if not base:
            return Response(
                {"error": "CLIENT_API_URL is not configured"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        url = self._client_url(PDF_ACTION)
        # Client API uses DRF APIView; Accept application/pdf alone triggers NotAcceptable before the PDF handler runs.
        headers = internal_proxy_headers(request)
        headers["Accept"] = "*/*"
        params = dict(request.query_params)
        try:
            resp = requests.get(url, headers=headers, params=params, timeout=120)
        except requests.RequestException as exc:
            logger.warning("Support accounting PDF proxy failed: %s", exc)
            return Response(
                {"error": "Client API unavailable", "detail": str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        if resp.status_code != status.HTTP_200_OK:
            return self._forward_json(resp)

        django_resp = HttpResponse(
            resp.content,
            content_type=resp.headers.get("Content-Type", "application/pdf"),
        )
        cd = resp.headers.get("Content-Disposition")
        if cd:
            django_resp["Content-Disposition"] = cd
        return django_resp
