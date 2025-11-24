"""
Signal handlers for triggering automatic achievement checks.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.achievements.services import check_automatic_achievements


@receiver(post_save, sender='news.Comment')
def check_achievements_on_comment(sender, instance, created, **kwargs):
    """Check for automatic achievements when a comment is created."""
    if created:
        # Check for comment-related achievements
        check_automatic_achievements(instance.author)


@receiver(post_save, sender='news.Reaction')
def check_achievements_on_reaction(sender, instance, created, **kwargs):
    """Check for automatic achievements when a reaction is created."""
    if created:
        # Check for reaction-given achievements
        check_automatic_achievements(instance.user)

        # Check for reaction-received achievements
        if instance.news.author:
            check_automatic_achievements(instance.news.author)


@receiver(post_save, sender='news.News')
def check_achievements_on_news_publish(sender, instance, created, **kwargs):
    """Check for automatic achievements when news is published."""
    # Check on creation or when status changes to published
    if instance.status == 'published' and instance.author:
        check_automatic_achievements(instance.author)


@receiver(post_save, sender='skills.SkillEndorsement')
def check_achievements_on_endorsement(sender, instance, created, **kwargs):
    """Check for automatic achievements when a skill is endorsed."""
    if created:
        # Check for endorsement-received achievements
        check_automatic_achievements(instance.user_skill.user)


@receiver(post_save, sender='skills.UserSkill')
def check_achievements_on_skill_add(sender, instance, created, **kwargs):
    """Check for automatic achievements when a skill is added."""
    if created:
        # Check for skills-count achievements
        check_automatic_achievements(instance.user)


@receiver(post_save, sender='achievements.AchievementAward')
def check_achievements_on_award(sender, instance, created, **kwargs):
    """Check for automatic achievements when an achievement is awarded."""
    if created:
        # Check for achievements-count achievements
        check_automatic_achievements(instance.recipient)


@receiver(post_save, sender='audit.AuditLog')
def check_achievements_on_login(sender, instance, created, **kwargs):
    """Check for automatic achievements when user logs in."""
    if created and instance.action == 'LOGIN' and instance.user:
        check_automatic_achievements(instance.user)
