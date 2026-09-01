"""Re-export support models so Django registers AUTH_USER_MODEL ``main.User``."""
from .tickets import SupportTicket, SupportTicketUpdate
from .user import PasswordResetToken, SupportStaff, User, UserManager
from .crew_chat import CrewChatThread, CrewChatMessage

__all__ = [
    "User",
    "UserManager",
    "PasswordResetToken",
    "SupportStaff",
    "SupportTicket",
    "SupportTicketUpdate",
    "CrewChatThread",
    "CrewChatMessage",
]
