"""
Celery tasks for the support Django app (transactional email via Microsoft Graph).
"""
from celery import shared_task
from django.conf import settings
from django.template.loader import render_to_string

from main.util.graph_mail import send_mail as graph_send_mail


@shared_task
def send_password_reset_email(user_email, user_name, reset_token):
    """
    Queue HTML password-reset email with web link to ``/api/v1/auth/web-reset-password/``.

    Args:
        user_email: Recipient address.
        user_name: Display name for template greeting.
        reset_token: Opaque token appended to reset URL query string.

    Returns:
        str: Success or failure message for Celery logs.
    """
    subject = "Reset Your Prisma Support Password"
    base = (getattr(settings, "SUPPORT_API_URL", None) or "").strip().rstrip("/")
    if not base:
        base = (getattr(settings, "BASE_URL", None) or "").strip().rstrip("/")
    if not base:
        base = "https://yourdomain.com"
    web_reset_url = f"{base}/api/v1/auth/web-reset-password/?token={reset_token}"

    html_message = render_to_string(
        "password_reset_email.html",
        {
            "user_name": user_name,
            "web_reset_url": web_reset_url,
            "expires_in": "1 hour",
        },
    )

    try:
        graph_send_mail(subject, html_message, user_email)
        return f"Password reset email sent successfully to {user_email}"
    except Exception as e:
        return f"Failed to send password reset email: {str(e)}"
