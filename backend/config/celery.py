"""
Celery configuration for fond_intra project.
"""
import os

from celery import Celery
from celery.schedules import crontab

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

app = Celery('fond_intra')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

# Celery Beat Schedule
app.conf.beat_schedule = {
    # Send birthday notifications daily at 9:00 AM
    'send-birthday-notifications': {
        'task': 'notifications.send_birthday_notifications',
        'schedule': crontab(hour=9, minute=0),
    },
    # Cleanup old notifications weekly on Sunday at 3:00 AM
    'cleanup-old-notifications': {
        'task': 'notifications.cleanup_old_notifications',
        'schedule': crontab(hour=3, minute=0, day_of_week=0),
        'args': (90,),  # Delete notifications older than 90 days
    },
}


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """Debug task for testing Celery."""
    print(f'Request: {self.request!r}')
