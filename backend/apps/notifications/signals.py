"""
Django signals for triggering notifications.
"""
import logging

from django.db.models.signals import post_save
from django.dispatch import receiver

logger = logging.getLogger(__name__)


@receiver(post_save, sender='achievements.AchievementAward')
def notify_on_achievement_award(sender, instance, created, **kwargs):
    """Send notification when achievement is awarded."""
    if created:
        from apps.notifications.tasks import notify_achievement_awarded
        notify_achievement_awarded.delay(instance.pk)
        logger.debug(f"Queued achievement notification for award {instance.pk}")


@receiver(post_save, sender='news.News')
def notify_on_news_publish(sender, instance, created, **kwargs):
    """Send notification when news is published."""
    if instance.is_published:
        # Check if this is a new publication or just published
        from apps.notifications.tasks import notify_news_published
        notify_news_published.delay(instance.pk)
        logger.debug(f"Queued news notification for news {instance.pk}")


@receiver(post_save, sender='news.Comment')
def notify_on_comment(sender, instance, created, **kwargs):
    """Send notification when comment is added."""
    if created:
        from apps.notifications.tasks import notify_comment_added
        notify_comment_added.delay(instance.pk)
        logger.debug(f"Queued comment notification for comment {instance.pk}")


@receiver(post_save, sender='news.Reaction')
def notify_on_reaction(sender, instance, created, **kwargs):
    """Send notification when reaction is added."""
    if created:
        from apps.notifications.tasks import notify_reaction_added
        notify_reaction_added.delay(instance.pk)
        logger.debug(f"Queued reaction notification for reaction {instance.pk}")
