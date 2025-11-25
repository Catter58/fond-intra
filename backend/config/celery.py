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
    # Expire classifieds daily at 1:00 AM
    'expire-classifieds': {
        'task': 'classifieds.expire_classifieds',
        'schedule': crontab(hour=1, minute=0),
    },
    # Notify about expiring classifieds daily at 10:00 AM
    'notify-expiring-classifieds': {
        'task': 'classifieds.notify_expiring_soon',
        'schedule': crontab(hour=10, minute=0),
    },
    # Send booking reminders every 15 minutes
    'send-booking-reminders': {
        'task': 'bookings.send_booking_reminders',
        'schedule': crontab(minute='*/15'),
    },
    # Send daily booking summary at 8:00 AM
    'send-daily-bookings-summary': {
        'task': 'bookings.send_daily_bookings_summary',
        'schedule': crontab(hour=8, minute=0),
    },
    # Cleanup past bookings daily at 2:00 AM
    'cleanup-past-bookings': {
        'task': 'bookings.cleanup_past_bookings',
        'schedule': crontab(hour=2, minute=0),
    },
}


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """Debug task for testing Celery."""
    print(f'Request: {self.request!r}')
