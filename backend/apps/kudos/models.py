"""
Kudos models for employee appreciation.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError


class Kudos(models.Model):
    """
    Model for public kudos/appreciation between employees.
    """
    class Category(models.TextChoices):
        HELP = 'help', _('Помощь')
        GREAT_JOB = 'great_job', _('Отличная работа')
        INITIATIVE = 'initiative', _('Инициатива')
        MENTORSHIP = 'mentorship', _('Наставничество')
        TEAMWORK = 'teamwork', _('Командная работа')

    sender = models.ForeignKey(
        'accounts.User',
        verbose_name=_('отправитель'),
        on_delete=models.CASCADE,
        related_name='kudos_sent'
    )
    recipient = models.ForeignKey(
        'accounts.User',
        verbose_name=_('получатель'),
        on_delete=models.CASCADE,
        related_name='kudos_received'
    )
    category = models.CharField(
        _('категория'),
        max_length=20,
        choices=Category.choices,
        default=Category.GREAT_JOB
    )
    message = models.TextField(
        _('сообщение'),
        max_length=500
    )
    is_public = models.BooleanField(
        _('публичная'),
        default=True
    )
    created_at = models.DateTimeField(
        _('создано'),
        auto_now_add=True
    )

    class Meta:
        verbose_name = _('благодарность')
        verbose_name_plural = _('благодарности')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.sender} → {self.recipient}: {self.get_category_display()}'

    def clean(self):
        if self.sender_id and self.recipient_id and self.sender_id == self.recipient_id:
            raise ValidationError(_('Нельзя отправить благодарность самому себе.'))

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
