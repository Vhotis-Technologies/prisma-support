"""DRF serializers for support API (JWT, model serializers)."""

from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from main.models.user import SupportStaff
from main.models.tickets import SupportTicket, SupportTicketUpdate

User = get_user_model()


def resolve_support_app_role(user) -> str:
    """
    Derive the role string exposed to the support mobile app.

    Prefers ``is_admin``, then ``SupportStaff.role``, else ``"support"``.
    """
    if user.is_admin:
        return "admin"
    staff = SupportStaff.objects.filter(user=user).first()
    if staff:
        return staff.role
    return "support"


def support_app_user_payload(user) -> dict:
    """User object for support app responses (login, register, /me)."""
    return {
        "id": str(user.id),
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "role": resolve_support_app_role(user),
        "allow_email_notifications": user.allow_email_notifications,
        "allow_push_notifications": user.allow_push_notifications,
        "gender": user.gender or None,
        "dob": user.dob.isoformat() if getattr(user, "dob", None) else None,
    }


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = "__all__"


class SupportStaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportStaff
        fields = "__all__"


class SupportTicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportTicket
        fields = "__all__"


class SupportTicketUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportTicketUpdate
        fields = "__all__"


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Same pattern as the client app: normalize email, obtain tokens via super().validate,
    then attach a `user` payload. Restricts login to support/admin staff.
    """

    def validate(self, attrs):
        """
        Normalize email, obtain JWT pair, and reject non-support accounts.

        Raises:
            ValidationError: Wrong password or account without support access.
        """
        email = attrs.get(self.username_field)
        if email:
            normalized_email = email.strip().lower()
            try:
                found = User.objects.get(email__iexact=normalized_email)
                attrs[self.username_field] = found.email
            except User.DoesNotExist:
                attrs[self.username_field] = normalized_email

        try:
            data = super().validate(attrs)
        except ValidationError as e:
            raise e

        user = self.user
        allowed = (
            user.is_admin
            or user.is_support
            or SupportStaff.objects.filter(user=user).exists()
        )
        if not allowed:
            raise serializers.ValidationError(
                "This account is not authorized for the support app.",
                code="no_support_access",
            )

        data["user"] = support_app_user_payload(user)
        return data

    @classmethod
    def get_token(cls, user):
        """Embed ``role`` claim in refresh/access tokens for client-side RBAC."""
        token = super().get_token(user)
        if user.is_admin:
            token["role"] = "admin"
        else:
            staff = SupportStaff.objects.filter(user=user).first()
            token["role"] = staff.role if staff else "support"
        return token
