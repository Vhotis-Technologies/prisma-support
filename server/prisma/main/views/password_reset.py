import secrets
from datetime import timedelta

from django.http import JsonResponse
from django.shortcuts import render
from django.utils import timezone
from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from main.models.user import PasswordResetToken, SupportStaff, User
from main.serializers import support_app_user_payload
from main.tasks import send_password_reset_email


def _password_reset_rate_limit_block(request):
    return JsonResponse({"detail": "Too many requests. Try again later."}, status=429)


def _user_may_use_support_app(user) -> bool:
    return (
        user.is_admin
        or user.is_support
        or SupportStaff.objects.filter(user=user).exists()
    )


@method_decorator(
    ratelimit(
        key="ip", rate="5/m", method="POST", block=_password_reset_rate_limit_block
    ),
    name="post",
)
class RequestPasswordResetView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip().lower()

        if not email:
            return Response(
                {"error": "Email is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {
                    "message": "If an account with that email exists, a password reset link has been sent."
                },
                status=status.HTTP_200_OK,
            )

        if not _user_may_use_support_app(user):
            return Response(
                {
                    "message": "If an account with that email exists, a password reset link has been sent."
                },
                status=status.HTTP_200_OK,
            )

        PasswordResetToken.objects.filter(user=user, used=False).update(used=True)

        token = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timedelta(hours=1)

        PasswordResetToken.objects.create(
            user=user,
            token=token,
            expires_at=expires_at,
        )

        send_password_reset_email.delay(user.email, user.get_full_name(), token)

        return Response(
            {
                "message": "If an account with that email exists, a password reset link has been sent."
            },
            status=status.HTTP_200_OK,
        )


@method_decorator(
    ratelimit(
        key="ip", rate="5/m", method="POST", block=_password_reset_rate_limit_block
    ),
    name="post",
)
class ValidateResetTokenView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get("token", "").strip()

        if not token:
            return Response(
                {"error": "Token is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            reset_token = PasswordResetToken.objects.get(token=token)

            if not reset_token.is_valid():
                return Response(
                    {"error": "Invalid or expired token"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            return Response(
                {
                    "valid": True,
                    "message": "Token is valid",
                    "expires_at": reset_token.expires_at.isoformat(),
                    "user_email": reset_token.user.email,
                },
                status=status.HTTP_200_OK,
            )

        except PasswordResetToken.DoesNotExist:
            return Response(
                {"error": "Invalid or expired token"},
                status=status.HTTP_400_BAD_REQUEST,
            )


@method_decorator(
    ratelimit(
        key="ip", rate="5/m", method="POST", block=_password_reset_rate_limit_block
    ),
    name="post",
)
class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get("token", "").strip()
        new_password = request.data.get("password", "").strip()

        if not token or not new_password:
            return Response(
                {"error": "Token and new password are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(new_password) < 8:
            return Response(
                {"error": "Password must be at least 8 characters long"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            reset_token = PasswordResetToken.objects.get(token=token)

            if not reset_token.is_valid():
                return Response(
                    {"error": "Invalid or expired token"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user = reset_token.user
            if not _user_may_use_support_app(user):
                return Response(
                    {"error": "This account is not authorized for the support app."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            user.set_password(new_password)
            user.save()

            reset_token.used = True
            reset_token.save()

            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)

            return Response(
                {
                    "message": "Password reset successfully",
                    "access": access_token,
                    "refresh": refresh_token,
                    "user": support_app_user_payload(user),
                },
                status=status.HTTP_200_OK,
            )

        except PasswordResetToken.DoesNotExist:
            return Response(
                {"error": "Invalid or expired token"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class WebResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        token = request.GET.get("token", "").strip()

        if not token:
            return render(
                request,
                "password_reset_invalid.html",
                {"error": "Token is required"},
            )

        try:
            reset_token = PasswordResetToken.objects.get(token=token)

            if not reset_token.is_valid():
                return render(
                    request,
                    "password_reset_invalid.html",
                    {"error": "Invalid or expired token"},
                )

            if not _user_may_use_support_app(reset_token.user):
                return render(
                    request,
                    "password_reset_invalid.html",
                    {"error": "This account is not authorized for the support app."},
                )

            return render(
                request,
                "password_reset_form.html",
                {
                    "token": token,
                    "user_email": reset_token.user.email,
                    "expires_at": reset_token.expires_at,
                },
            )

        except PasswordResetToken.DoesNotExist:
            return render(
                request,
                "password_reset_invalid.html",
                {"error": "Invalid or expired token"},
            )

    def post(self, request):
        token = request.POST.get("token", "").strip()
        new_password = request.POST.get("password", "").strip()
        confirm_password = request.POST.get("confirm_password", "").strip()

        if not token or not new_password or not confirm_password:
            return render(
                request,
                "password_reset_form.html",
                {
                    "token": token,
                    "error": "All fields are required",
                },
            )

        if new_password != confirm_password:
            return render(
                request,
                "password_reset_form.html",
                {
                    "token": token,
                    "error": "Passwords do not match",
                },
            )

        if len(new_password) < 8:
            return render(
                request,
                "password_reset_form.html",
                {
                    "token": token,
                    "error": "Password must be at least 8 characters long",
                },
            )

        if not any(c.islower() for c in new_password):
            return render(
                request,
                "password_reset_form.html",
                {
                    "token": token,
                    "error": "Password must contain at least one lowercase letter",
                },
            )

        if not any(c.isupper() for c in new_password):
            return render(
                request,
                "password_reset_form.html",
                {
                    "token": token,
                    "error": "Password must contain at least one uppercase letter",
                },
            )

        try:
            reset_token = PasswordResetToken.objects.get(token=token)

            if not reset_token.is_valid():
                return render(
                    request,
                    "password_reset_invalid.html",
                    {"error": "Invalid or expired token"},
                )

            user = reset_token.user
            if not _user_may_use_support_app(user):
                return render(
                    request,
                    "password_reset_invalid.html",
                    {"error": "This account is not authorized for the support app."},
                )

            user.set_password(new_password)
            user.save()

            reset_token.used = True
            reset_token.save()

            return render(
                request,
                "password_reset_success.html",
                {"user_email": user.email},
            )

        except PasswordResetToken.DoesNotExist:
            return render(
                request,
                "password_reset_invalid.html",
                {"error": "Invalid or expired token"},
            )
