"""
HTTP proxy: support-app → **client** Prisma API (customers / fleets / partners).

Maps GET/PATCH/POST actions to ``{CLIENT_API_URL}/api/v1/support/customers/{action}/``.
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

GET_ACTIONS = frozenset(
    {
        "get_customers_list",
        "get_b2c_detail",
        "get_fleet_detail",
        "get_partner_detail",
        "get_fleet_branch_detail",
        "get_partner_referred_users",
        "get_vehicle_detail",
    }
)
PATCH_ACTIONS = frozenset(
    {
        "terminate_fleet_subscription",
        "renew_fleet_subscription",
        "terminate_b2c_subscription",
        "renew_b2c_subscription",
        "remove_vehicle",
        "remove_branch",
        "vehicle_transfer",
    }
)
POST_ACTIONS = frozenset({"delete_user_account"})


@method_decorator(
    ratelimit(
        key="user",
        rate="120/m",
        method=["GET", "PATCH", "POST"],
        block=rate_limit_json_response,
    ),
    name="dispatch",
)
class SupportCustomersProxyView(APIView):
    """Staff-authenticated edge; origin server enforces support internal key."""

    permission_classes = [IsAuthenticated]

    def _client_url(self, action: str) -> str:
        """Build client support customers URL for the given action."""
        base = (settings.CLIENT_API_URL or "").rstrip("/")
        return f"{base}/api/v1/support/customers/{action}/"

    def _forward_response(self, resp: requests.Response) -> Response:
        """Pass client JSON/status through; includes actor email on upstream via headers."""
        try:
            payload = resp.json() if resp.content else {}
        except (ValueError, TypeError):
            payload = {"error": resp.text or "Invalid JSON from client"}
        return Response(payload, status=resp.status_code)

    def _require_key(self) -> Response | None:
        """Return 503 Response if ``SUPPORT_INTERNAL_API_KEY`` is unset, else ``None``."""
        if not require_support_internal_key():
            return Response(
                {"error": "SUPPORT_INTERNAL_API_KEY is not configured"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return None

    def get(self, request, action, *args, **kwargs):
        """Proxy customer/fleet/partner read actions to client API."""
        if action not in GET_ACTIONS:
            return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)
        key_err = self._require_key()
        if key_err:
            return key_err
        base = (settings.CLIENT_API_URL or "").rstrip("/")
        if not base:
            return Response(
                {"error": "CLIENT_API_URL is not configured"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        url = self._client_url(action)
        try:
            resp = requests.get(
                url,
                params=dict(request.query_params),
                headers=internal_proxy_headers(request),
                timeout=60,
            )
        except requests.RequestException as exc:
            logger.warning("Support customers proxy GET failed: %s", exc)
            return Response(
                {"error": "Client API unavailable", "detail": str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return self._forward_response(resp)

    def patch(self, request, action, *args, **kwargs):
        """Proxy subscription/vehicle/branch mutations to client API."""
        if action not in PATCH_ACTIONS:
            return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)
        key_err = self._require_key()
        if key_err:
            return key_err
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
                headers=internal_proxy_headers(request, content_type_json=True),
                timeout=60,
            )
        except requests.RequestException as exc:
            logger.warning("Support customers proxy PATCH failed: %s", exc)
            return Response(
                {"error": "Client API unavailable", "detail": str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return self._forward_response(resp)

    def post(self, request, action, *args, **kwargs):
        """Proxy destructive/sensitive POST actions (e.g. ``delete_user_account``)."""
        if action not in POST_ACTIONS:
            return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)
        key_err = self._require_key()
        if key_err:
            return key_err
        base = (settings.CLIENT_API_URL or "").rstrip("/")
        if not base:
            return Response(
                {"error": "CLIENT_API_URL is not configured"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        url = self._client_url(action)
        try:
            resp = requests.post(
                url,
                json=request.data,
                headers=internal_proxy_headers(request, content_type_json=True),
                timeout=60,
            )
        except requests.RequestException as exc:
            logger.warning("Support customers proxy POST failed: %s", exc)
            return Response(
                {"error": "Client API unavailable", "detail": str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return self._forward_response(resp)
