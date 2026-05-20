"""
HTTP proxy: support-app → client (partner payouts) and detailer (crew payouts).

Partner actions hit ``CLIENT_API_URL``; crew actions hit ``DETAILER_API_URL``.
"""
from __future__ import annotations

import logging

import requests
from django.conf import settings
from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from main.util.proxy_helpers import internal_proxy_headers, require_support_internal_key
from main.util.ratelimit_helpers import rate_limit_json_response

logger = logging.getLogger(__name__)

CLIENT_GET_ACTIONS = frozenset(
    {"get_payout_queue", "get_partner_payouts", "get_partner_balance"}
)
CLIENT_POST_ACTIONS = frozenset({"mark_partner_payout_paid"})

DETAILER_GET_ACTIONS = frozenset(
    {
        "get_crew_payout_queue",
        "get_crew_payout_detail",
        "get_crew_unpaid_earnings",
        "get_crew_unpaid_earnings_detail",
    }
)
DETAILER_POST_ACTIONS = frozenset(
    {"mark_crew_payout_paid", "create_crew_payout", "record_crew_payment_made"}
)


@method_decorator(
    ratelimit(
        key="user",
        rate="120/m",
        method=["GET", "POST"],
        block=rate_limit_json_response,
    ),
    name="dispatch",
)
class SupportPayoutsProxyView(APIView):
    """
    BFF for partner payouts (client) and crew payouts (detailer).

    **Auth:** JWT + rate limit; upstream requires internal key and actor email header.
    """

    permission_classes = [IsAuthenticated]

    def _forward_response(self, resp: requests.Response) -> Response:
        """Pass through upstream JSON body and status."""
        try:
            payload = resp.json() if resp.content else {}
        except ValueError:
            payload = {"error": resp.text or "Invalid JSON from upstream"}
        return Response(payload, status=resp.status_code)

    def _client_url(self, action: str) -> str:
        """Map BFF action names to client support payout routes (e.g. mark_partner → mark_payout)."""
        base = (settings.CLIENT_API_URL or "").rstrip("/")
        mapped = "mark_payout_paid" if action == "mark_partner_payout_paid" else action
        return f"{base}/api/v1/support/payouts/{mapped}/"

    def _detailer_url(self, action: str) -> str:
        """Map BFF crew payout actions to detailer support payout routes."""
        base = (getattr(settings, "DETAILER_API_URL", None) or "").rstrip("/")
        if action == "get_crew_payout_queue":
            mapped = "get_payout_queue"
        elif action == "mark_crew_payout_paid":
            mapped = "mark_payout_paid"
        else:
            mapped = action
        return f"{base}/api/v1/support/payouts/{mapped}/"

    def _enrich_post_body(self, request, action: str) -> dict:
        """Attach actor email via header on upstream; do not trust client body fields."""
        return dict(request.data) if hasattr(request.data, "items") else {}

    def _proxy_get(self, url: str, params: dict, request, upstream: str) -> Response:
        """Shared GET forwarder with actor email on headers."""
        try:
            resp = requests.get(
                url,
                params=params,
                headers=internal_proxy_headers(request),
                timeout=60,
            )
        except requests.RequestException as exc:
            logger.warning("Support payouts proxy GET %s failed: %s", upstream, exc)
            return Response(
                {"error": f"{upstream} API unavailable", "detail": str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return self._forward_response(resp)

    def _proxy_post(self, url: str, data: dict, request, upstream: str) -> Response:
        """Shared POST forwarder; audit email must not come from request body."""
        try:
            resp = requests.post(
                url,
                json=data,
                headers=internal_proxy_headers(request, content_type_json=True),
                timeout=60,
            )
        except requests.RequestException as exc:
            logger.warning("Support payouts proxy POST %s failed: %s", upstream, exc)
            return Response(
                {"error": f"{upstream} API unavailable", "detail": str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return self._forward_response(resp)

    def get(self, request, action, *args, **kwargs):
        """Route GET to client (partner) or detailer (crew) payout queue endpoints."""
        if not require_support_internal_key():
            return Response(
                {"error": "SUPPORT_INTERNAL_API_KEY is not configured"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        if action in CLIENT_GET_ACTIONS:
            base = (settings.CLIENT_API_URL or "").rstrip("/")
            if not base:
                return Response(
                    {"error": "CLIENT_API_URL is not configured"},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )
            return self._proxy_get(
                self._client_url(action), dict(request.query_params), request, "Client"
            )

        if action in DETAILER_GET_ACTIONS:
            base = (getattr(settings, "DETAILER_API_URL", None) or "").rstrip("/")
            if not base:
                return Response(
                    {"error": "DETAILER_API_URL is not configured"},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )
            return self._proxy_get(
                self._detailer_url(action), dict(request.query_params), request, "Detailer"
            )

        return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request, action, *args, **kwargs):
        """Route POST mark-paid / create payout actions to client or detailer."""
        if not require_support_internal_key():
            return Response(
                {"error": "SUPPORT_INTERNAL_API_KEY is not configured"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        if action in CLIENT_POST_ACTIONS:
            base = (settings.CLIENT_API_URL or "").rstrip("/")
            if not base:
                return Response(
                    {"error": "CLIENT_API_URL is not configured"},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )
            body = self._enrich_post_body(request, action)
            return self._proxy_post(self._client_url(action), body, request, "Client")

        if action in DETAILER_POST_ACTIONS:
            base = (getattr(settings, "DETAILER_API_URL", None) or "").rstrip("/")
            if not base:
                return Response(
                    {"error": "DETAILER_API_URL is not configured"},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )
            body = self._enrich_post_body(request, action)
            return self._proxy_post(self._detailer_url(action), body, request, "Detailer")

        return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)

