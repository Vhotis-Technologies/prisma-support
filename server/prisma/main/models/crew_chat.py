"""
Crew ↔ Support direct chat models (websocket-backed).

Each crew member gets one persistent thread. Messages flow through websockets
with DB persistence. Support staff can view all threads; crew can only see their own.
"""
import uuid
from django.db import models
from main.models.user import SupportStaff


class CrewChatThread(models.Model):
    """
    One persistent chat thread per crew member.
    
    Tracks unread counts for both sides, last message timestamp, and open/closed status.
    """
    
    class Status(models.TextChoices):
        OPEN = "open", "Open"
        CLOSED = "closed", "Closed"
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    crew_user_id = models.UUIDField(
        unique=True, 
        db_index=True,
        help_text="Detailer User.id (crew member)"
    )
    crew_name = models.CharField(max_length=255)
    crew_email = models.CharField(max_length=255)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.OPEN,
        db_index=True
    )
    last_message_at = models.DateTimeField(auto_now_add=True, db_index=True)
    crew_unread_count = models.IntegerField(
        default=0,
        help_text="Messages from support that crew hasn't seen"
    )
    support_unread_count = models.IntegerField(
        default=0,
        help_text="Messages from crew that support hasn't seen"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = "crew_chat_threads"
        ordering = ["-last_message_at"]
        indexes = [
            models.Index(fields=["status", "-last_message_at"], name="idx_crew_chat_status_time"),
        ]
    
    def __str__(self):
        return f"Chat: {self.crew_name} ({self.status})"


class CrewChatMessage(models.Model):
    """
    Individual message in a crew chat thread.
    
    Compatible with react-native-gifted-chat format on the wire.
    Optional booking_reference for context ("I have a problem with booking #12345").
    """
    
    class SenderRole(models.TextChoices):
        CREW = "crew", "Crew"
        SUPPORT = "support", "Support"
        SYSTEM = "system", "System"
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    thread = models.ForeignKey(
        CrewChatThread,
        on_delete=models.CASCADE,
        related_name="messages"
    )
    sender_role = models.CharField(max_length=20, choices=SenderRole.choices)
    sender_id = models.UUIDField(help_text="User.id (crew) or SupportStaff.id (support)")
    sender_name = models.CharField(max_length=255)
    body = models.TextField()
    booking_reference = models.CharField(
        max_length=64,
        blank=True,
        null=True,
        help_text="Optional booking ref mentioned in this message"
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        db_table = "crew_chat_messages"
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["thread", "created_at"], name="idx_crew_chat_thread_time"),
        ]
    
    def __str__(self):
        return f"{self.sender_role}: {self.body[:30]}"
    
    def to_gifted_chat_format(self):
        """Convert to react-native-gifted-chat IMessage format."""
        return {
            "_id": str(self.id),
            "text": self.body,
            "createdAt": self.created_at.isoformat(),
            "user": {
                "_id": str(self.sender_id),
                "name": self.sender_name,
                "role": self.sender_role,
            },
            "booking_reference": self.booking_reference,
        }
