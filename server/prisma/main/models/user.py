"""User, referral, address, loyalty, promotions, notifications - user and notification related models."""
import random
import string
import uuid
from datetime import timedelta

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    """Creates support-staff ``User`` rows (email is the username)."""

    def create_user(self, email, password=None, **extra_fields):
        """
        Create a normal user with normalized email and hashed password.

        Args:
            email: Login email (required).
            password: Plain password (optional for OAuth-style flows).
            **extra_fields: Extra ``User`` model fields.

        Returns:
            Saved ``User`` instance.
        """
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        extra_fields.setdefault("username", email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Create Django admin superuser (``is_staff`` + ``is_superuser``)."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """
    Support app operator account (not B2C/fleet customers).

    ``is_support`` / ``SupportStaff`` gate access to the mobile support app and JWT login.
    """

    gender_choices = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    first_name = models.CharField(max_length=155)
    last_name = models.CharField(max_length=155)
    email = models.EmailField(unique=True)
    gender = models.CharField(max_length=10, choices=gender_choices, blank=True, null=True)
    dob = models.DateField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_admin = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    is_support = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    allow_push_notifications = models.BooleanField(default=True)
    allow_email_notifications = models.BooleanField(default=True)
    notification_token = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    def __str__(self):
        full = self.get_full_name().strip()
        return f"{full} — {self.email}" if full else self.email

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        db_table = 'users'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email'], name='idx_email'),
            models.Index(fields=['first_name', 'last_name'], name='idx_user_name'),
        ]
        constraints = [
            models.UniqueConstraint(fields=['email'], name='unique_email'),
        ]

    def save(self, *args, **kwargs):
        """Assign UUID primary key on first save if not set."""
        if not self.id:
            self.id = uuid.uuid4()
        return super().save(*args, **kwargs)


class PasswordResetToken(models.Model):
    """Single-use token for support-app password reset email links."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey("User", on_delete=models.CASCADE)
    token = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)

    class Meta:
        db_table = "password_reset_tokens"

    def is_expired(self):
        """True when ``expires_at`` is in the past."""
        return timezone.now() > self.expires_at

    def is_valid(self):
        """True when the token has not been used and is not expired."""
        return not self.used and not self.is_expired()

    def __str__(self):
        return f"Password reset token for {self.user.email}"


class SupportStaff(models.Model):
    """Links a ``User`` to a support role (``admin`` or ``support``) for RBAC in the app."""

    support_roles = [
        ('admin', 'Admin'),
        ('support', 'Support'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='support_staff')
    role = models.CharField(max_length=100, choices=support_roles)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Support Staff'
        verbose_name_plural = 'Support Staff'
        db_table = 'support_staff'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['role'], name='idx_support_role'),
        ]