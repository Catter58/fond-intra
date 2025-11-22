"""
Notification models: Notification and NotificationSettings.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _


class Notification(models.Model):
    """
    Notification for a user.
    """
    class NotificationType(models.TextChoices):
        BIRTHDAY = 'birthday', _('Birthday')
        ACHIEVEMENT = 'achievement', _('Achievement')
        NEWS = 'news', _('News')
        COMMENT = 'comment', _('Comment')
        REACTION = 'reaction', _('Reaction')
        SYSTEM = 'system', _('System')

    user = models.ForeignKey(
        'accounts.User',
        verbose_name=_('user'),
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    type = models.CharField(
        _('type'),
        max_length=20,
        choices=NotificationType.choices
    )
    title = models.CharField(_('title'), max_length=200)
    message = models.TextField(_('message'))
    link = models.CharField(_('link'), max_length=500, blank=True)
    is_read = models.BooleanField(_('read'), default=False)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)

    # Optional reference to related object
    related_object_type = models.CharField(
        _('related object type'),
        max_length=50,
        blank=True
    )
    related_object_id = models.PositiveIntegerField(
        _('related object id'),
        null=True,
        blank=True
    )

    class Meta:
        verbose_name = _('notification')
        verbose_name_plural = _('notifications')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['user', 'created_at']),
        ]

    def __str__(self):
        return f"{self.user} - {self.title}"

    def mark_as_read(self):
        """Mark notification as read."""
        if not self.is_read:
            self.is_read = True
            self.save(update_fields=['is_read'])


class NotificationSettings(models.Model):
    """
    User's notification preferences.
    """
    user = models.OneToOneField(
        'accounts.User',
        verbose_name=_('user'),
        on_delete=models.CASCADE,
        related_name='notification_settings'
    )
    birthdays_enabled = models.BooleanField(
        _('birthday notifications'),
        default=True
    )
    achievements_enabled = models.BooleanField(
        _('achievement notifications'),
        default=True
    )
    news_enabled = models.BooleanField(
        _('news notifications'),
        default=True
    )
    comments_enabled = models.BooleanField(
        _('comment notifications'),
        default=True
    )
    reactions_enabled = models.BooleanField(
        _('reaction notifications'),
        default=True
    )
    email_enabled = models.BooleanField(
        _('email notifications'),
        default=False
    )

    class Meta:
        verbose_name = _('notification settings')
        verbose_name_plural = _('notification settings')

    def __str__(self):
        return f"Notification settings for {self.user}"
