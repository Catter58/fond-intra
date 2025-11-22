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
