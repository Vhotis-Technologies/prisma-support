"""
HTTP proxy: support-app → **client** Prisma ``get_dashboard_data``.

Forwards query params (e.g. ``timeframe``) and returns the client JSON as-is.
Requires ``CLIENT_API_URL`` and optional ``SUPPORT_INTERNAL_API_KEY`` in settings.
"""
import logging

import requests
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated


logger = logging.getLogger(__name__)


class SupportDashboardView(APIView):
    """Thin wrapper around ``requests.get`` to the client support dashboard route."""

    permission_classes = [IsAuthenticated]
    action_handler = {
        'get_dashboard_data': '_get_dashboard_data',
    }

    def get(self, request, *args, **kwargs):
        action = kwargs.get('action')
        if action not in self.action_handler:
            return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
        handler = getattr(self, self.action_handler[action])
        return handler(request)

    def _get_dashboard_data(self, request):
        base = (settings.CLIENT_API_URL or '').rstrip('/')
        if not base:
            return Response(
                {'error': 'CLIENT_API_URL is not configured'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        url = f'{base}/api/v1/support/dashboard/get_dashboard_data/'
        headers = {
            'Accept': 'application/json',
        }
        key = getattr(settings, 'SUPPORT_INTERNAL_API_KEY', '') or ''
        if key:
            headers['X-Support-Internal-Key'] = key
        params = {k: request.query_params.get(k) for k in request.query_params}
        logger.info(
            'Dashboard proxy: requesting client GET %s with params=%s',
            url,
            params,
        )
        try:
            resp = requests.get(url, headers=headers, params=params, timeout=60)
        except requests.RequestException as exc:
            return Response(
                {'error': 'Client API unavailable', 'detail': str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        try:
            payload = resp.json() if resp.content else {}
        except ValueError:
            payload = {'error': resp.text or 'Invalid JSON from client'}
        if resp.status_code != status.HTTP_200_OK:
            return Response(payload, status=resp.status_code)
        return Response(payload, status=status.HTTP_200_OK)
