"""
HTTP proxy: support-app → client (partner payouts) and detailer (crew payouts).

Partner actions hit ``CLIENT_API_URL``; crew actions hit ``DETAILER_API_URL``.
"""
from __future__ import annotations

import logging

import requests
from django.conf import settings
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

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
DETAILER_POST_ACTIONS = frozenset({"mark_crew_payout_paid", "create_crew_payout"})


class SupportPayoutsProxyView(APIView):
    permission_classes = [IsAuthenticated]

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
            payload = {"error": resp.text or "Invalid JSON from upstream"}
        return Response(payload, status=resp.status_code)

    def _client_url(self, action: str) -> str:
        base = (settings.CLIENT_API_URL or "").rstrip("/")
        mapped = "mark_payout_paid" if action == "mark_partner_payout_paid" else action
        return f"{base}/api/v1/support/payouts/{mapped}/"

    def _detailer_url(self, action: str) -> str:
        base = (getattr(settings, "DETAILER_API_URL", None) or "").rstrip("/")
        if action == "get_crew_payout_queue":
            mapped = "get_payout_queue"
        elif action == "mark_crew_payout_paid":
            mapped = "mark_payout_paid"
        else:
            mapped = action
        return f"{base}/api/v1/support/payouts/{mapped}/"

    def _enrich_post_body(self, request, action: str) -> dict:
        """Attach the calling support user's email so downstream APIs can audit it."""
        data = dict(request.data) if hasattr(request.data, "items") else {}
        user = getattr(request, "user", None)
        if user is not None and getattr(user, "is_authenticated", False):
            if not data.get("support_user_email"):
                email = (getattr(user, "email", "") or "").strip()
                if email:
                    data["support_user_email"] = email
        return data

    def _proxy_get(self, url: str, params: dict, upstream: str) -> Response:
        try:
            resp = requests.get(url, params=params, headers=self._headers(), timeout=60)
        except requests.RequestException as exc:
            logger.warning("Support payouts proxy GET %s failed: %s", upstream, exc)
            return Response(
                {"error": f"{upstream} API unavailable", "detail": str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return self._forward_response(resp)

    def _proxy_post(self, url: str, data: dict, upstream: str) -> Response:
        try:
            resp = requests.post(url, json=data, headers=self._headers(content_type_json=True), timeout=60)
        except requests.RequestException as exc:
            logger.warning("Support payouts proxy POST %s failed: %s", upstream, exc)
            return Response(
                {"error": f"{upstream} API unavailable", "detail": str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return self._forward_response(resp)

    def get(self, request, action, *args, **kwargs):
        if action in CLIENT_GET_ACTIONS:
            base = (settings.CLIENT_API_URL or "").rstrip("/")
            if not base:
                return Response({"error": "CLIENT_API_URL is not configured"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            return self._proxy_get(self._client_url(action), dict(request.query_params), "Client")

        if action in DETAILER_GET_ACTIONS:
            base = (getattr(settings, "DETAILER_API_URL", None) or "").rstrip("/")
            if not base:
                return Response({"error": "DETAILER_API_URL is not configured"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            key = (getattr(settings, "SUPPORT_INTERNAL_API_KEY", None) or "").strip()
            if not key:
                return Response(
                    {"error": "SUPPORT_INTERNAL_API_KEY is not configured"},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )
            return self._proxy_get(self._detailer_url(action), dict(request.query_params), "Detailer")

        return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request, action, *args, **kwargs):
        if action in CLIENT_POST_ACTIONS:
            base = (settings.CLIENT_API_URL or "").rstrip("/")
            if not base:
                return Response({"error": "CLIENT_API_URL is not configured"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            body = self._enrich_post_body(request, action)
            return self._proxy_post(self._client_url(action), body, "Client")

        if action in DETAILER_POST_ACTIONS:
            base = (getattr(settings, "DETAILER_API_URL", None) or "").rstrip("/")
            if not base:
                return Response({"error": "DETAILER_API_URL is not configured"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            body = self._enrich_post_body(request, action)
            return self._proxy_post(self._detailer_url(action), body, "Detailer")

        return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)
