"""
Current-user profile for logged-in support staff.

**GET** — returns ``support_app_user_payload`` (identity, role, gender/dob when set,
notification flags).

**PATCH** — partial update of ``allow_email_notifications`` / ``allow_push_notifications``.
"""

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from main.serializers import support_app_user_payload


class ProfileView(APIView):
    """GET current user payload; PATCH notification preferences."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Return current user's profile payload for the support app."""
        return Response(support_app_user_payload(request.user))

    def patch(self, request):
        """Update email/push notification preference flags on the current user."""
        user = request.user
        email = request.data.get("allow_email_notifications")
        push = request.data.get("allow_push_notifications")
        fields = []
        if email is not None:
            user.allow_email_notifications = bool(email)
            fields.append("allow_email_notifications")
        if push is not None:
            user.allow_push_notifications = bool(push)
            fields.append("allow_push_notifications")
        if fields:
            user.save(update_fields=fields)
        return Response(support_app_user_payload(user))
