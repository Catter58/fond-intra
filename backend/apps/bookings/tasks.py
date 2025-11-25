"""
Celery tasks for bookings.
"""
import logging
from datetime import timedelta

from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(name='bookings.send_booking_reminders')
def send_booking_reminders():
    """
    Send reminders for bookings starting in 30 minutes.
    Runs every 15 minutes to catch upcoming bookings.
    """
    from apps.bookings.models import Booking
    from apps.notifications.models import Notification

    now = timezone.now()
    reminder_window_start = now + timedelta(minutes=25)
    reminder_window_end = now + timedelta(minutes=35)

    # Find bookings starting in ~30 minutes
    upcoming_bookings = Booking.objects.filter(
        status=Booking.Status.CONFIRMED,
        starts_at__gt=reminder_window_start,
        starts_at__lte=reminder_window_end
    ).select_related('user', 'resource')

    if not upcoming_bookings.exists():
        logger.info("No bookings to remind about")
        return 0

    reminders_sent = 0
    for booking in upcoming_bookings:
        # Check if reminder already sent
        existing = Notification.objects.filter(
            user=booking.user,
            related_object_type='Booking',
            related_object_id=booking.pk,
            title__contains='Напоминание'
        ).exists()

        if existing:
            continue

        start_time = booking.starts_at.astimezone(timezone.get_current_timezone())
        Notification.objects.create(
            user=booking.user,
            type='system',
            title='Напоминание о бронировании',
            message=f'{booking.resource.name}: "{booking.title}" начинается в {start_time.strftime("%H:%M")}',
            link=f'/bookings/resources/{booking.resource.id}',
            related_object_type='Booking',
            related_object_id=booking.pk
        )
        reminders_sent += 1

    logger.info(f"Sent {reminders_sent} booking reminders")
    return reminders_sent


@shared_task(name='bookings.send_daily_bookings_summary')
def send_daily_bookings_summary():
    """
    Send daily summary of today's bookings to users.
    Runs daily at 8:00 AM.
    """
    from django.db.models import Count
    from apps.accounts.models import User
    from apps.bookings.models import Booking
    from apps.notifications.models import Notification

    today = timezone.now().date()

    # Get users with bookings today
    users_with_bookings = User.objects.filter(
        bookings__starts_at__date=today,
        bookings__status=Booking.Status.CONFIRMED,
        is_active=True,
        is_archived=False
    ).annotate(
        bookings_today=Count('bookings', filter=lambda: True)
    ).distinct()

    if not users_with_bookings.exists():
        logger.info("No users with bookings today")
        return 0

    summaries_sent = 0
    for user in users_with_bookings:
        user_bookings = Booking.objects.filter(
            user=user,
            starts_at__date=today,
            status=Booking.Status.CONFIRMED
        ).select_related('resource').order_by('starts_at')

        if not user_bookings.exists():
            continue

        bookings_count = user_bookings.count()
        first_booking = user_bookings.first()
        start_time = first_booking.starts_at.astimezone(timezone.get_current_timezone())

        if bookings_count == 1:
            message = f'Сегодня у вас 1 бронирование: {first_booking.resource.name} в {start_time.strftime("%H:%M")}'
        else:
            message = f'Сегодня у вас {bookings_count} бронирований. Первое: {first_booking.resource.name} в {start_time.strftime("%H:%M")}'

        Notification.objects.create(
            user=user,
            type='system',
            title='Бронирования на сегодня',
            message=message,
            link='/bookings'
        )
        summaries_sent += 1

    logger.info(f"Sent {summaries_sent} daily booking summaries")
    return summaries_sent


@shared_task(name='bookings.cleanup_past_bookings')
def cleanup_past_bookings():
    """
    Mark past bookings as completed.
    Runs daily to update booking statuses.
    """
    from apps.bookings.models import Booking

    now = timezone.now()

    # Mark confirmed bookings that have ended as completed
    updated = Booking.objects.filter(
        status=Booking.Status.CONFIRMED,
        ends_at__lt=now
    ).update(status=Booking.Status.COMPLETED)

    logger.info(f"Marked {updated} bookings as completed")
    return updated
