"""
Core models for site-wide settings.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _


class SiteSettings(models.Model):
    """
    Singleton model for site-wide settings.
    Only one instance should exist.
    """
    # Registration settings
    registration_enabled = models.BooleanField(
        _('registration enabled'),
        default=False,
        help_text=_('Allow users to register themselves')
    )

    # Default role for new registrations
    default_role = models.ForeignKey(
        'roles.Role',
        verbose_name=_('default role for new users'),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text=_('Role assigned to newly registered users')
    )

    class Meta:
        verbose_name = _('site settings')
        verbose_name_plural = _('site settings')

    def __str__(self):
        return 'Site Settings'

    def save(self, *args, **kwargs):
        # Ensure only one instance exists
        self.pk = 1
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        # Prevent deletion
        pass

    @classmethod
    def get_settings(cls):
        """Get or create the settings instance."""
        settings, _ = cls.objects.get_or_create(pk=1)
        return settings
