"""
Authentication API for the support mobile app and web BFF.

**CustomTokenObtainPairView**
    Issues JWT access/refresh pairs. Serializer enforces support-staff eligibility and
    embeds a normalized user payload for the client.

**AuthenticationView**
    Action-routed POST (e.g. ``create_new_account`` → register) under onboarding URLs.

Both POST entrypoints are IP rate-limited (see ``ratelimit`` decorators) to reduce brute force.
"""
from datetime import datetime

from django.db import transaction
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit
from rest_framework import status
from rest_framework.generics import CreateAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from main.models.user import SupportStaff, User
from main.serializers import (
    CustomTokenObtainPairSerializer,
    support_app_user_payload,
)


def _auth_rate_limit_block(request):
    return JsonResponse({"detail": "Too many requests. Try again later."}, status=429)


@method_decorator(
    ratelimit(key="ip", rate="5/m", method="POST", block=_auth_rate_limit_block),
    name="post",
)
class CustomTokenObtainPairView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer


@method_decorator(
    ratelimit(key="ip", rate="5/m", method="POST", block=_auth_rate_limit_block),
    name="post",
)
class AuthenticationView(CreateAPIView):
    permission_classes = [AllowAny]
    action_handlers = {
        "create_new_account": "register",
    }

    def post(self, request, *args, **kwargs):
        action = kwargs.get("action")
        if action not in self.action_handlers:
            return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)

        handler = getattr(self, self.action_handlers[action])
        return handler(request)

    def register(self, request):
        """
        Self-service support staff signup. Expects request.data.credentials:
        email, password, first_name, last_name (same shape as client register).

        Creates User (is_support) + SupportStaff(role=support). Public admin signup is not allowed.
        """
        try:
            data = request.data.get("credentials")
            if not data or not isinstance(data, dict):
                return Response(
                    {"error": "credentials object is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            email = (data.get("email") or "").strip().lower()
            password = data.get("password") or ""
            first_name = (data.get("first_name") or "").strip()
            last_name = (data.get("last_name") or "").strip()
            gender = (data.get("gender") or "").strip().lower()
            dob_raw = data.get("dob")

            if not all([email, password, first_name, last_name]):
                return Response(
                    {"error": "email, password, first_name, and last_name are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if len(password) < 8:
                return Response(
                    {"error": "Password must be at least 8 characters."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if User.objects.filter(email__iexact=email).exists():
                return Response(
                    {"error": "A user with this email already exists."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            dob = None
            if dob_raw not in (None, ""):
                if not isinstance(dob_raw, str):
                    return Response(
                        {"error": "dob must be an ISO date string (YYYY-MM-DD)."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                try:
                    dob = datetime.strptime(dob_raw[:10], "%Y-%m-%d").date()
                except ValueError:
                    return Response(
                        {"error": "Invalid date of birth."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            if gender and gender not in ("male", "female"):
                return Response(
                    {"error": "gender must be male or female."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            with transaction.atomic():
                user = User.objects.create_user(
                    email=email,
                    password=password,
                    first_name=first_name,
                    last_name=last_name,
                )
                user.is_support = True
                update_fields = ["is_support"]
                if gender:
                    user.gender = gender
                    update_fields.append("gender")
                if dob is not None:
                    user.dob = dob
                    update_fields.append("dob")
                user.save(update_fields=update_fields)
                SupportStaff.objects.create(user=user, role="support")

            refresh = RefreshToken.for_user(user)

            return Response(
                {
                    "message": "Your support account has been created successfully.",
                    "user": support_app_user_payload(user),
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                },
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
