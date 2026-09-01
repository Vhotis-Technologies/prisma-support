"""
Celery tasks for the support Django app (transactional email via Microsoft Graph).
"""
from celery import shared_task
from django.conf import settings
from django.template.loader import render_to_string

from main.util.graph_mail import send_mail as graph_send_mail


def _password_reset_link(reset_token: str) -> str:
    """SPA reset URL when ``SUPPORT_WEB_BASE_URL`` is set; else Django HTML form."""
    web = (getattr(settings, "SUPPORT_WEB_BASE_URL", None) or "").strip().rstrip("/")
    if web:
        return f"{web}/reset-password?token={reset_token}"
    base = (getattr(settings, "SUPPORT_API_URL", None) or "").strip().rstrip("/")
    if not base:
        base = (getattr(settings, "BASE_URL", None) or "").strip().rstrip("/")
    if not base:
        base = "https://support.prismavalet.com"
    return f"{base}/api/v1/auth/web-reset-password/?token={reset_token}"


@shared_task
def send_password_reset_email(user_email, user_name, reset_token):
    """
    Queue HTML password-reset email.

    Prefers the support-web SPA (``SUPPORT_WEB_URL`` / ``SUPPORT_WEB_BASE_URL``)
    at ``/reset-password?token=``. Falls back to Django
    ``/api/v1/auth/web-reset-password/`` until that env is set.

    Args:
        user_email: Recipient address.
        user_name: Display name for template greeting.
        reset_token: Opaque token appended to reset URL query string.

    Returns:
        str: Success or failure message for Celery logs.
    """
    subject = "Reset Your Prisma Support Password"
    web_reset_url = _password_reset_link(reset_token)

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
