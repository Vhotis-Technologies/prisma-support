"""Notify offline crew of new support chat messages via the detailer push service."""
import logging

import requests
from django.conf import settings

from main.util.proxy_helpers import attach_public_hop_headers, require_support_internal_key

logger = logging.getLogger(__name__)


def notify_crew_new_support_message(
    *,
    crew_user_id: str,
    thread_id: str,
    body: str,
    sender_name: str = "Support",
) -> None:
    """
    Ask the detailer server to queue push + in-app notification for a crew member.

    Fire-and-forget: logs errors but never raises, so chat delivery is unaffected.
    """
    body = (body or "").strip()
    if not body:
        return

    base = (getattr(settings, "DETAILER_API_URL", None) or "").rstrip("/")
    key = require_support_internal_key()
    if not base or not key:
        logger.warning(
            "Skipping crew chat notify: DETAILER_API_URL or SUPPORT_INTERNAL_API_KEY not configured"
        )
        return

    url = f"{base}/api/v1/support/crew-chat/notify/"
    headers = attach_public_hop_headers(
        {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "X-Support-Internal-Key": key,
        }
    )
    payload = {
        "crew_user_id": str(crew_user_id),
        "thread_id": str(thread_id),
        "body": body,
        "sender_name": sender_name or "Support",
    }

    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=5)
        if resp.status_code >= 400:
            logger.warning(
                "Crew chat notify failed: status=%s body=%s",
                resp.status_code,
                resp.text[:500],
            )
    except requests.RequestException as exc:
        logger.warning("Crew chat notify request failed: %s", exc)
