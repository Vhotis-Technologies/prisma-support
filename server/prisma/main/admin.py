"""Django admin registrations for support staff users and local ticket models."""
from django.contrib import admin

# Register your models here.
from main.models.user import SupportStaff, User
from main.models.tickets import SupportTicket, SupportTicketUpdate

admin.site.register(SupportStaff)
admin.site.register(User)
admin.site.register(SupportTicket)
admin.site.register(SupportTicketUpdate)
