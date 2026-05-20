"""Shared rate-limit response for django-ratelimit."""

from django.http import JsonResponse


def rate_limit_json_response(request, *args, **kwargs):
    """django-ratelimit callback: return 429 JSON when per-user/IP limits are exceeded."""
    return JsonResponse({"detail": "Too many requests. Try again later."}, status=429)
