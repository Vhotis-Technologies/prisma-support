"""Django admin registrations for support staff users and local ticket models."""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.contrib.auth.forms import UserChangeForm, UserCreationForm

from main.models.tickets import SupportTicket, SupportTicketUpdate
from main.models.user import SupportStaff, User


class SupportUserCreationForm(UserCreationForm):
    """Create users with email + hashed password (password1 / password2)."""

    class Meta:
        model = User
        fields = ("email", "first_name", "last_name")

    def save(self, commit=True):
        user = super().save(commit=False)
        # Keep username in sync with email (USERNAME_FIELD is email).
        user.username = user.email
        if commit:
            user.save()
        return user


class SupportUserChangeForm(UserChangeForm):
    """Edit user fields; password is changed via the dedicated admin password form."""

    class Meta:
        model = User
        fields = "__all__"


class SupportStaffInline(admin.StackedInline):
    """Attach support role when creating/editing a user."""

    model = SupportStaff
    extra = 1
    max_num = 1
    can_delete = True


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    """
    Proper User admin: add form hashes password via ``set_password``.
    Do not type into a raw password CharField — use Add user or \"change password\".
    """

    add_form = SupportUserCreationForm
    form = SupportUserChangeForm
    model = User
    inlines = [SupportStaffInline]

    list_display = (
        "email",
        "first_name",
        "last_name",
        "is_support",
        "is_admin",
        "is_staff",
        "is_active",
        "created_at",
    )
    list_filter = ("is_support", "is_admin", "is_staff", "is_active", "is_superuser")
    search_fields = ("email", "first_name", "last_name")
    ordering = ("email",)
    readonly_fields = ("id", "created_at", "updated_at", "last_login", "date_joined")

    fieldsets = (
        (None, {"fields": ("id", "email", "password")}),
        (
            "Personal info",
            {"fields": ("first_name", "last_name", "gender", "dob")},
        ),
        (
            "Support access",
            {
                "fields": (
                    "is_support",
                    "is_admin",
                    "is_verified",
                    "allow_email_notifications",
                    "allow_push_notifications",
                )
            },
        ),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        (
            "Important dates",
            {"fields": ("last_login", "date_joined", "created_at", "updated_at")},
        ),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "first_name",
                    "last_name",
                    "password1",
                    "password2",
                    "is_support",
                    "is_admin",
                    "is_staff",
                    "is_active",
                ),
                "description": (
                    "Password is hashed automatically. "
                    "Tick is_support (and add Support staff role below) for app login."
                ),
            },
        ),
    )


@admin.register(SupportStaff)
class SupportStaffAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "created_at")
    list_filter = ("role",)
    search_fields = ("user__email", "user__first_name", "user__last_name")
    autocomplete_fields = ("user",)


admin.site.register(SupportTicket)
admin.site.register(SupportTicketUpdate)
