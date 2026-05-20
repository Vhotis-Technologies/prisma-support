"""
Push notification registration for the support app.

Contract aligns with the consumer client app: ``PATCH …/save_notification_token/`` persists
the Expo/device token on the authenticated ``User`` for downstream FCM/APNs fan-out.
"""

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


class NotificationsView(APIView):
    """PATCH save_notification_token → User.notification_token (same contract as client)."""

    permission_classes = [IsAuthenticated]

    action_handlers = {
        "save_notification_token": "_save_notification_token",
    }

    def patch(self, request, *args, **kwargs):
        """Handle PATCH actions (currently ``save_notification_token`` only)."""
        action = kwargs.get("action")
        if action not in self.action_handlers:
            return Response(
                {"error": "Invalid action"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        handler = getattr(self, self.action_handlers[action])
        return handler(request)

    def _save_notification_token(self, request):
        """Persist Expo/device push token on the authenticated support ``User``."""
        try:
            token = request.data.get("token")
            request.user.notification_token = token
            request.user.save(update_fields=["notification_token"])
            return Response({"success": True}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
