# Celery app loaded when Django starts so shared_task uses this app.
from .celery import app

__all__ = ('app',)
