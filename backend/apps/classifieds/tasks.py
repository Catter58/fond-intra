"""
Celery tasks for classifieds.
"""
import logging
from datetime import datetime

from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(name='classifieds.expire_classifieds')
def expire_classifieds():
    """
    Expire classifieds that have passed their expiration date.
    Runs daily to mark expired classifieds.
    """
    from apps.classifieds.models import Classified
    from apps.notifications.models import Notification

    now = timezone.now()

    # Find active classifieds that have expired
    expired_classifieds = Classified.objects.filter(
        status=Classified.Status.ACTIVE,
        expires_at__lt=now
    ).select_related('author')

    if not expired_classifieds.exists():
        logger.info("No classifieds to expire")
        return 0

    expired_count = 0
    for classified in expired_classifieds:
        # Mark as expired
        classified.status = Classified.Status.EXPIRED
        classified.save(update_fields=['status', 'updated_at'])

        # Notify author
        Notification.objects.create(
            user=classified.author,
            type='system',
            title='Объявление истекло',
            message=f'Срок действия вашего объявления "{classified.title[:50]}" истёк. Вы можете продлить его.',
            link='/classifieds'
        )
        expired_count += 1

    logger.info(f"Expired {expired_count} classifieds")
    return expired_count


@shared_task(name='classifieds.notify_expiring_soon')
def notify_expiring_soon():
    """
    Notify authors about classifieds expiring in 3 days.
    """
    from datetime import timedelta
    from apps.classifieds.models import Classified
    from apps.notifications.models import Notification

    now = timezone.now()
    threshold = now + timedelta(days=3)

    # Find active classifieds expiring soon
    expiring_classifieds = Classified.objects.filter(
        status=Classified.Status.ACTIVE,
        expires_at__gt=now,
        expires_at__lte=threshold
    ).select_related('author')

    if not expiring_classifieds.exists():
        logger.info("No classifieds expiring soon")
        return 0

    notified_count = 0
    for classified in expiring_classifieds:
        # Check if notification already sent today
        existing = Notification.objects.filter(
            user=classified.author,
            related_object_type='Classified',
            related_object_id=classified.pk,
            created_at__date=now.date()
        ).exists()

        if existing:
            continue

        days_left = (classified.expires_at - now).days
        Notification.objects.create(
            user=classified.author,
            type='system',
            title='Объявление скоро истечёт',
            message=f'Объявление "{classified.title[:50]}" истечёт через {days_left} дн. Продлите его, если оно ещё актуально.',
            link='/classifieds',
            related_object_type='Classified',
            related_object_id=classified.pk
        )
        notified_count += 1

    logger.info(f"Sent {notified_count} expiring soon notifications")
    return notified_count
