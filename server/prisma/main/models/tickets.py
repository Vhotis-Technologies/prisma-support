"""Support-side ticket records (source of truth for the support app). Client app links via support_ticket_id."""
import uuid

from django.conf import settings
from django.db import models
from main.models.user import SupportStaff

class SupportTicket(models.Model):
    """
    Canonical ticket row served to the support API.
    `client_ticket_id` ties to the customer-platform ticket when synced; subject/description mirror list + detail UI.
    """

    class Status(models.TextChoices):
        OPEN = "open", "Open"
        IN_PROGRESS = "in_progress", "In progress"
        COMPLETED = "completed", "Completed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client_ticket_id = models.UUIDField(
        null=True,
        blank=True,
        unique=True,
        db_index=True,
        help_text="ID of the ticket on the client/customer API when bridged.",
    )
    client_user_id = models.UUIDField(
        null=True,
        blank=True,
        db_index=True,
        help_text="Customer user id on the client platform.",
    )
    client_name = models.CharField(max_length=255)
    subject = models.CharField(max_length=512)
    description = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.OPEN,
        db_index=True,
    )
    booking_reference = models.CharField(max_length=64, blank=True, null=True)
    issue_type = models.CharField(max_length=64, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "support_tickets"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "-created_at"], name="idx_ticket_status_created"),
        ]

    def __str__(self):
        return f"{self.subject[:50]} ({self.status})"


class SupportTicketUpdate(models.Model):
    """Timeline row; maps to TicketUpdate in the support app (message + resulting status)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket = models.ForeignKey(
        SupportTicket,
        on_delete=models.CASCADE,
        related_name="updates",
    )
    message = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=SupportTicket.Status.choices,
        help_text="Ticket status after this event (matches support UI TicketUpdate.status).",
    )
    created_by = models.ForeignKey(
        SupportStaff,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ticket_updates_authored",
    )
    class Source(models.TextChoices):
        CLIENT = "client", "Client"
        SUPPORT = "support", "Support"
        SYSTEM = "system", "System"

    source = models.CharField(
        max_length=20,
        choices=Source.choices,
        default=Source.SYSTEM,
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "support_ticket_updates"
        ordering = ["created_at"]

    def __str__(self):
        return f"Update {self.id} on {self.ticket_id}"
