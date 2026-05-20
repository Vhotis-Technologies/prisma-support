"""Django app config for the Prisma support BFF (auth, proxies, local ticket models)."""
from django.apps import AppConfig


class MainConfig(AppConfig):
    """Support application: JWT auth for staff and HTTP proxies to client/detailer APIs."""

    name = 'main'
