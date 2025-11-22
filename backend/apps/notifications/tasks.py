"""
Celery tasks for notifications.
"""
import logging
from datetime import date, timedelta

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.db.models import Q
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)


@shared_task(name='notifications.send_birthday_notifications')
def send_birthday_notifications():
    """
    Send notifications about upcoming birthdays.
    Runs daily to notify about birthdays happening today and tomorrow.
    """
    from apps.accounts.models import User
    from apps.notifications.models import Notification, NotificationSettings

    today = date.today()
    tomorrow = today + timedelta(days=1)

    # Find users with birthdays today or tomorrow
    birthday_users = User.objects.filter(
        is_active=True,
        is_archived=False,
        birth_date__isnull=False
    ).filter(
        Q(birth_date__month=today.month, birth_date__day=today.day) |
        Q(birth_date__month=tomorrow.month, birth_date__day=tomorrow.day)
    )

    if not birthday_users.exists():
        logger.info("No birthdays today or tomorrow")
        return 0

    # Get all active users who want birthday notifications
    recipients = User.objects.filter(
        is_active=True,
        is_archived=False
    ).exclude(
        pk__in=birthday_users.values_list('pk', flat=True)
    )

    notifications_created = 0

    for birthday_user in birthday_users:
        is_today = (
            birthday_user.birth_date.month == today.month and
            birthday_user.birth_date.day == today.day
        )

        if is_today:
            title = f"🎂 Сегодня день рождения!"
            message = f"Сегодня день рождения у {birthday_user.get_full_name()}. Не забудьте поздравить!"
        else:
            title = f"🎂 Завтра день рождения!"
            message = f"Завтра день рождения у {birthday_user.get_full_name()}. Подготовьте поздравление!"

        for recipient in recipients:
            # Check if user wants birthday notifications
            try:
                settings_obj = recipient.notification_settings
                if not settings_obj.birthdays_enabled:
                    continue
            except NotificationSettings.DoesNotExist:
                pass  # Default is enabled

            # Check if notification already exists for today
            existing = Notification.objects.filter(
                user=recipient,
                type=Notification.NotificationType.BIRTHDAY,
                related_object_type='User',
                related_object_id=birthday_user.pk,
                created_at__date=today
            ).exists()

            if existing:
                continue

            Notification.objects.create(
                user=recipient,
                type=Notification.NotificationType.BIRTHDAY,
                title=title,
                message=message,
                link=f"/employees/{birthday_user.pk}",
                related_object_type='User',
                related_object_id=birthday_user.pk
            )
            notifications_created += 1

    logger.info(f"Created {notifications_created} birthday notifications")
    return notifications_created


@shared_task(name='notifications.send_email_notification')
def send_email_notification(notification_id: int):
    """
    Send email for a specific notification if user has email enabled.
    """
    from apps.notifications.models import Notification, NotificationSettings

    try:
        notification = Notification.objects.select_related('user').get(pk=notification_id)
    except Notification.DoesNotExist:
        logger.warning(f"Notification {notification_id} not found")
        return False

    user = notification.user

    # Check if user wants email notifications
    try:
        if not user.notification_settings.email_enabled:
            return False
    except NotificationSettings.DoesNotExist:
        return False  # Default is disabled for email

    if not user.email:
        logger.warning(f"User {user.pk} has no email address")
        return False

    try:
        # Build email content
        subject = notification.title
        html_message = render_to_string('notifications/email_notification.html', {
            'user': user,
            'notification': notification,
            'site_url': settings.CORS_ALLOWED_ORIGINS[0] if settings.CORS_ALLOWED_ORIGINS else 'http://localhost:5173',
        })
        plain_message = strip_tags(html_message)

        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False
        )
        logger.info(f"Email sent to {user.email} for notification {notification_id}")
        return True

    except Exception as e:
        logger.error(f"Failed to send email to {user.email}: {e}")
        return False


@shared_task(name='notifications.cleanup_old_notifications')
def cleanup_old_notifications(days: int = 90):
    """
    Remove notifications older than specified days.
    Keeps unread notifications.
    """
    from apps.notifications.models import Notification

    cutoff_date = date.today() - timedelta(days=days)

    deleted_count, _ = Notification.objects.filter(
        created_at__date__lt=cutoff_date,
        is_read=True
    ).delete()

    logger.info(f"Deleted {deleted_count} old notifications")
    return deleted_count


def create_notification(
    user,
    notification_type: str,
    title: str,
    message: str,
    link: str = '',
    related_object_type: str = '',
    related_object_id: int = None,
    send_email: bool = True
):
    """
    Helper function to create a notification and optionally send email.
    """
    from apps.notifications.models import Notification

    notification = Notification.objects.create(
        user=user,
        type=notification_type,
        title=title,
        message=message,
        link=link,
        related_object_type=related_object_type,
        related_object_id=related_object_id
    )

    if send_email:
        send_email_notification.delay(notification.pk)

    return notification


@shared_task(name='notifications.notify_achievement_awarded')
def notify_achievement_awarded(award_id: int):
    """
    Notify user about received achievement.
    """
    from apps.achievements.models import AchievementAward
    from apps.notifications.models import Notification, NotificationSettings

    try:
        award = AchievementAward.objects.select_related(
            'recipient', 'giver', 'achievement'
        ).get(pk=award_id)
    except AchievementAward.DoesNotExist:
        logger.warning(f"AchievementAward {award_id} not found")
        return False

    recipient = award.recipient

    # Check if user wants achievement notifications
    try:
        if not recipient.notification_settings.achievements_enabled:
            return False
    except NotificationSettings.DoesNotExist:
        pass  # Default is enabled

    notification = Notification.objects.create(
        user=recipient,
        type=Notification.NotificationType.ACHIEVEMENT,
        title=f"{award.achievement.icon} Вы получили достижение!",
        message=f"{award.giver.get_full_name()} присвоил вам достижение «{award.achievement.name}»",
        link="/achievements",
        related_object_type='AchievementAward',
        related_object_id=award.pk
    )

    # Send email if enabled
    send_email_notification.delay(notification.pk)

    return True


@shared_task(name='notifications.notify_news_published')
def notify_news_published(news_id: int):
    """
    Notify all users about new news article.
    """
    from apps.accounts.models import User
    from apps.news.models import News
    from apps.notifications.models import Notification, NotificationSettings

    try:
        news = News.objects.select_related('author').get(pk=news_id)
    except News.DoesNotExist:
        logger.warning(f"News {news_id} not found")
        return 0

    if not news.is_published:
        return 0

    # Get all active users except the author
    recipients = User.objects.filter(
        is_active=True,
        is_archived=False
    ).exclude(pk=news.author_id)

    notifications_created = 0

    for recipient in recipients:
        # Check if user wants news notifications
        try:
            if not recipient.notification_settings.news_enabled:
                continue
        except NotificationSettings.DoesNotExist:
            pass  # Default is enabled

        notification = Notification.objects.create(
            user=recipient,
            type=Notification.NotificationType.NEWS,
            title="📰 Новая публикация",
            message=f"{news.author.get_full_name()} опубликовал: {news.title}",
            link=f"/news/{news.pk}",
            related_object_type='News',
            related_object_id=news.pk
        )
        notifications_created += 1

        # Send email if enabled
        send_email_notification.delay(notification.pk)

    logger.info(f"Created {notifications_created} news notifications for news {news_id}")
    return notifications_created


@shared_task(name='notifications.notify_comment_added')
def notify_comment_added(comment_id: int):
    """
    Notify news author about new comment.
    """
    from apps.news.models import Comment
    from apps.notifications.models import Notification, NotificationSettings

    try:
        comment = Comment.objects.select_related(
            'news', 'news__author', 'author'
        ).get(pk=comment_id)
    except Comment.DoesNotExist:
        logger.warning(f"Comment {comment_id} not found")
        return False

    news_author = comment.news.author

    # Don't notify if comment author is news author
    if news_author.pk == comment.author_id:
        return False

    # Check if user wants comment notifications
    try:
        if not news_author.notification_settings.comments_enabled:
            return False
    except NotificationSettings.DoesNotExist:
        pass  # Default is enabled

    notification = Notification.objects.create(
        user=news_author,
        type=Notification.NotificationType.COMMENT,
        title="💬 Новый комментарий",
        message=f"{comment.author.get_full_name()} прокомментировал вашу публикацию «{comment.news.title}»",
        link=f"/news/{comment.news_id}",
        related_object_type='Comment',
        related_object_id=comment.pk
    )

    send_email_notification.delay(notification.pk)
    return True


@shared_task(name='notifications.notify_reaction_added')
def notify_reaction_added(reaction_id: int):
    """
    Notify news author about new reaction.
    """
    from apps.news.models import Reaction
    from apps.notifications.models import Notification, NotificationSettings

    try:
        reaction = Reaction.objects.select_related(
            'news', 'news__author', 'user'
        ).get(pk=reaction_id)
    except Reaction.DoesNotExist:
        logger.warning(f"Reaction {reaction_id} not found")
        return False

    news_author = reaction.news.author

    # Don't notify if reaction author is news author
    if news_author.pk == reaction.user_id:
        return False

    # Check if user wants reaction notifications
    try:
        if not news_author.notification_settings.reactions_enabled:
            return False
    except NotificationSettings.DoesNotExist:
        pass  # Default is enabled

    emoji_map = {'like': '👍', 'heart': '❤️', 'celebrate': '🎉', 'support': '🙌'}
    emoji = emoji_map.get(reaction.type, '👍')

    notification = Notification.objects.create(
        user=news_author,
        type=Notification.NotificationType.REACTION,
        title=f"{emoji} Новая реакция",
        message=f"{reaction.user.get_full_name()} отреагировал на вашу публикацию «{reaction.news.title}»",
        link=f"/news/{reaction.news_id}",
        related_object_type='Reaction',
        related_object_id=reaction.pk
    )

    send_email_notification.delay(notification.pk)
    return True
