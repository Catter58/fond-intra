"""
Audit model for tracking user actions.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _


class AuditLog(models.Model):
    """
    Audit log entry for tracking changes to data.
    """
    class Action(models.TextChoices):
        CREATE = 'create', _('Create')
        UPDATE = 'update', _('Update')
        DELETE = 'delete', _('Delete')
        LOGIN = 'login', _('Login')
        LOGOUT = 'logout', _('Logout')
        ARCHIVE = 'archive', _('Archive')
        RESTORE = 'restore', _('Restore')
        PASSWORD_CHANGE = 'password_change', _('Password Change')
        PASSWORD_RESET = 'password_reset', _('Password Reset')

    user = models.ForeignKey(
        'accounts.User',
        verbose_name=_('user'),
        on_delete=models.SET_NULL,
        null=True,
        related_name='audit_logs'
    )
    action = models.CharField(
        _('action'),
        max_length=20,
        choices=Action.choices
    )
    entity_type = models.CharField(
        _('entity type'),
        max_length=100,
        help_text=_('Model name (e.g., User, News)')
    )
    entity_id = models.PositiveIntegerField(
        _('entity id'),
        null=True,
        blank=True
    )
    entity_repr = models.CharField(
        _('entity representation'),
        max_length=255,
        blank=True,
        help_text=_('String representation of the entity')
    )
    old_values = models.JSONField(
        _('old values'),
        null=True,
        blank=True
    )
    new_values = models.JSONField(
        _('new values'),
        null=True,
        blank=True
    )
    ip_address = models.GenericIPAddressField(
        _('IP address'),
        null=True,
        blank=True
    )
    user_agent = models.TextField(
        _('user agent'),
        blank=True
    )
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)

    class Meta:
        verbose_name = _('audit log')
        verbose_name_plural = _('audit logs')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['entity_type', 'entity_id']),
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['action', 'created_at']),
        ]

    def __str__(self):
        return f"{self.user} - {self.action} - {self.entity_type}"

    @classmethod
    def log(cls, user, action, entity_type, entity_id=None, entity_repr='',
            old_values=None, new_values=None, ip_address=None, user_agent=''):
        """
        Create an audit log entry.
        """
        return cls.objects.create(
            user=user,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_repr=entity_repr,
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address,
            user_agent=user_agent
        )
