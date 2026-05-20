"""Celery application for the support Django project (email tasks autodiscovery)."""
import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'prisma.settings')

app = Celery('prisma')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """Smoke-test Celery worker connectivity (logs request repr)."""
    print(f'Request: {self.request!r}')
