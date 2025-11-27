"""
Achievement models: Achievement and AchievementAward.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _


class Achievement(models.Model):
    """
    Achievement type/template that can be awarded to users.
    """
    class Category(models.TextChoices):
        PROFESSIONAL = 'professional', _('Professional')
        CORPORATE = 'corporate', _('Corporate')
        SOCIAL = 'social', _('Social')
        SPECIAL = 'special', _('Special')

    class TriggerType(models.TextChoices):
        COMMENTS_COUNT = 'comments_count', _('Comments count')
        REACTIONS_GIVEN = 'reactions_given', _('Reactions given')
        REACTIONS_RECEIVED = 'reactions_received', _('Reactions received')
        NEWS_CREATED = 'news_created', _('News created')
        LOGINS_COUNT = 'logins_count', _('Logins count')
        PROFILE_VIEWS = 'profile_views', _('Profile views')
        ENDORSEMENTS_RECEIVED = 'endorsements_received', _('Endorsements received')
        SKILLS_COUNT = 'skills_count', _('Skills count')
        ACHIEVEMENTS_COUNT = 'achievements_count', _('Achievements received')

    name = models.CharField(_('name'), max_length=100)
    description = models.TextField(_('description'))
    icon = models.CharField(
        _('icon'),
        max_length=10,
        default='🏆',
        help_text=_('Emoji icon for the achievement')
    )
    category = models.CharField(
        _('category'),
        max_length=20,
        choices=Category.choices,
        default=Category.PROFESSIONAL
    )
    is_active = models.BooleanField(_('active'), default=True)

    # Automatic achievements fields
    is_automatic = models.BooleanField(
        _('automatic'),
        default=False,
        help_text=_('Achievement is awarded automatically when trigger condition is met')
    )
    trigger_type = models.CharField(
        _('trigger type'),
        max_length=30,
        choices=TriggerType.choices,
        null=True,
        blank=True,
        help_text=_('Type of action that triggers this achievement')
    )
    trigger_value = models.PositiveIntegerField(
        _('trigger value'),
        null=True,
        blank=True,
        help_text=_('Threshold value for the trigger (e.g., 10 comments)')
    )

    created_by = models.ForeignKey(
        'accounts.User',
        verbose_name=_('created by'),
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_achievements'
    )
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('achievement')
        verbose_name_plural = _('achievements')
        ordering = ['category', 'name']

    def __str__(self):
        return self.name


class AchievementAward(models.Model):
    """
    Record of an achievement being awarded to a user.
    """
    achievement = models.ForeignKey(
        Achievement,
        verbose_name=_('achievement'),
        on_delete=models.CASCADE,
        related_name='awards'
    )
    recipient = models.ForeignKey(
        'accounts.User',
        verbose_name=_('recipient'),
        on_delete=models.CASCADE,
        related_name='received_achievements'
    )
    awarded_by = models.ForeignKey(
        'accounts.User',
        verbose_name=_('awarded by'),
        on_delete=models.SET_NULL,
        null=True,
        related_name='given_achievements'
    )
    comment = models.TextField(
        _('comment'),
        help_text=_('Reason for awarding this achievement')
    )
    awarded_at = models.DateTimeField(_('awarded at'), auto_now_add=True)

    class Meta:
        verbose_name = _('achievement award')
        verbose_name_plural = _('achievement awards')
        ordering = ['-awarded_at']

    def __str__(self):
        return f"{self.recipient} - {self.achievement}"
