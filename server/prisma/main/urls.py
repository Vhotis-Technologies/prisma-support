"""URL routes for the support API (included under api/v1/)."""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from main.views.authentication import AuthenticationView, CustomTokenObtainPairView
from main.views.notifications import NotificationsView
from main.views.profile import ProfileView
from main.views.dashboard import SupportDashboardView
from main.views.bookings import SupportBookingsProxyView
from main.views.crew import SupportCrewProxyView
from main.views.customers import SupportCustomersProxyView
from main.views.activities import SupportActivitiesProxyView
from main.views.tickets import SupportTicketsProxyView
from main.views.vouchers import SupportVouchersProxyView
from main.views.accounting import SupportAccountingProxyView
from main.views.password_reset import (
    RequestPasswordResetView,
    ResetPasswordView,
    ValidateResetTokenView,
    WebResetPasswordView,
)

urlpatterns = [
    path("authentication/login/", CustomTokenObtainPairView.as_view(), name="login"),
    path("authentication/refresh/", TokenRefreshView.as_view(), name="refresh"),
    path("onboard/<str:action>/", AuthenticationView.as_view(), name="onboard"),
    path("me/", ProfileView.as_view(), name="me"),
    path("notifications/<str:action>/", NotificationsView.as_view(), name="notifications"),
    path(
        "dashboard/<str:action>/",
        SupportDashboardView.as_view(),
        name="dashboard",
    ),
    path(
        "bookings/<str:action>/",
        SupportBookingsProxyView.as_view(),
        name="bookings",
    ),
    path(
        "crew/<str:action>/",
        SupportCrewProxyView.as_view(),
        name="crew",
    ),
    path(
        "customers/<str:action>/",
        SupportCustomersProxyView.as_view(),
        name="customers",
    ),
    path(
        "activities/<str:action>/",
        SupportActivitiesProxyView.as_view(),
        name="activities",
    ),
    path(
        "tickets/<str:action>/",
        SupportTicketsProxyView.as_view(),
        name="tickets",
    ),
    path(
        "vouchers/<str:action>/",
        SupportVouchersProxyView.as_view(),
        name="vouchers",
    ),
    path(
        "accounting/<str:action>/",
        SupportAccountingProxyView.as_view(),
        name="accounting",
    ),
    path("auth/password-reset/", RequestPasswordResetView.as_view(), name="request_password_reset"),
    path(
        "auth/validate-reset-token/",
        ValidateResetTokenView.as_view(),
        name="validate_reset_token",
    ),
    path("auth/reset-password/", ResetPasswordView.as_view(), name="reset_password"),
    path(
        "auth/web-reset-password/",
        WebResetPasswordView.as_view(),
        name="web_reset_password",
    ),
]
