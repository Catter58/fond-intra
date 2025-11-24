"""
Service for checking and awarding automatic achievements.
"""
from django.db.models import Count, Q
from django.utils import timezone

from apps.achievements.models import Achievement, AchievementAward
from apps.accounts.models import User
from apps.audit.models import AuditLog
from apps.notifications.models import Notification


def get_user_stats(user: User) -> dict:
    """
    Calculate user statistics for automatic achievement triggers.

    Returns a dictionary with counts for each trigger type.
    """
    from apps.news.models import Comment, Reaction, News
    from apps.skills.models import SkillEndorsement, UserSkill

    stats = {}

    # Comments count
    stats['comments_count'] = Comment.objects.filter(author=user).count()

    # Reactions given
    stats['reactions_given'] = Reaction.objects.filter(user=user).count()

    # Reactions received (on user's news)
    stats['reactions_received'] = Reaction.objects.filter(
        news__author=user
    ).count()

    # News created
    stats['news_created'] = News.objects.filter(
        author=user,
        status='published'
    ).count()

    # Logins count (from audit log)
    stats['logins_count'] = AuditLog.objects.filter(
        user=user,
        action=AuditLog.Action.LOGIN
    ).count()

    # Profile views (stored in user model)
    stats['profile_views'] = getattr(user, 'profile_views_count', 0)

    # Endorsements received
    stats['endorsements_received'] = SkillEndorsement.objects.filter(
        user_skill__user=user
    ).count()

    # Skills count
    stats['skills_count'] = UserSkill.objects.filter(user=user).count()

    # Achievements received
    stats['achievements_count'] = AchievementAward.objects.filter(
        recipient=user
    ).count()

    return stats


def check_automatic_achievements(user: User) -> list:
    """
    Check if user qualifies for any automatic achievements.
    Awards them if conditions are met and returns list of newly awarded achievements.

    Args:
        user: User to check achievements for

    Returns:
        List of Achievement objects that were newly awarded
    """
    # Get all active automatic achievements
    automatic_achievements = Achievement.objects.filter(
        is_active=True,
        is_automatic=True,
        trigger_type__isnull=False,
        trigger_value__isnull=False
    )

    if not automatic_achievements.exists():
        return []

    # Get user's already awarded achievements
    awarded_achievement_ids = AchievementAward.objects.filter(
        recipient=user
    ).values_list('achievement_id', flat=True)

    # Get user statistics
    stats = get_user_stats(user)

    newly_awarded = []

    for achievement in automatic_achievements:
        # Skip if already awarded
        if achievement.id in awarded_achievement_ids:
            continue

        # Check if user meets the threshold
        user_value = stats.get(achievement.trigger_type, 0)

        if user_value >= achievement.trigger_value:
            # Award the achievement
            award = AchievementAward.objects.create(
                achievement=achievement,
                recipient=user,
                awarded_by=None,  # System-awarded
                comment=f'Automatically awarded for reaching {achievement.trigger_value} {achievement.get_trigger_type_display()}'
            )

            # Create notification
            Notification.objects.create(
                user=user,
                type='achievement',
                title='Новое достижение!',
                message=f'Вы получили достижение "{achievement.name}"',
                link=f'/achievements'
            )

            newly_awarded.append(achievement)

    return newly_awarded


def check_achievement_progress(user: User, trigger_type: str) -> dict:
    """
    Get user's progress towards automatic achievements of a specific trigger type.

    Args:
        user: User to check progress for
        trigger_type: Type of trigger to check

    Returns:
        Dictionary with progress information for each achievement
    """
    # Get all active automatic achievements of this trigger type
    achievements = Achievement.objects.filter(
        is_active=True,
        is_automatic=True,
        trigger_type=trigger_type,
        trigger_value__isnull=False
    ).order_by('trigger_value')

    if not achievements.exists():
        return {}

    # Get user's already awarded achievements
    awarded_achievement_ids = set(
        AchievementAward.objects.filter(
            recipient=user
        ).values_list('achievement_id', flat=True)
    )

    # Get user statistics
    stats = get_user_stats(user)
    current_value = stats.get(trigger_type, 0)

    progress_data = []

    for achievement in achievements:
        is_achieved = achievement.id in awarded_achievement_ids
        progress_percentage = min(100, int((current_value / achievement.trigger_value) * 100))

        progress_data.append({
            'achievement': {
                'id': achievement.id,
                'name': achievement.name,
                'description': achievement.description,
                'icon': achievement.icon,
                'trigger_value': achievement.trigger_value,
            },
            'current_value': current_value,
            'is_achieved': is_achieved,
            'progress_percentage': progress_percentage,
            'remaining': max(0, achievement.trigger_value - current_value)
        })

    return {
        'trigger_type': trigger_type,
        'trigger_type_display': Achievement.TriggerType(trigger_type).label,
        'current_value': current_value,
        'achievements': progress_data
    }


def get_all_achievement_progress(user: User) -> list:
    """
    Get user's progress towards all automatic achievements.

    Args:
        user: User to check progress for

    Returns:
        List of progress information for each trigger type
    """
    trigger_types = [choice[0] for choice in Achievement.TriggerType.choices]

    progress_list = []
    for trigger_type in trigger_types:
        progress = check_achievement_progress(user, trigger_type)
        if progress.get('achievements'):  # Only include if there are achievements
            progress_list.append(progress)

    return progress_list
