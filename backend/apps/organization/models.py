"""
Organization models: Department and Position.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _


class Department(models.Model):
    """
    Department model representing organizational units.
    Supports hierarchical structure through parent field.
    """
    name = models.CharField(_('name'), max_length=100)
    description = models.TextField(_('description'), blank=True)
    parent = models.ForeignKey(
        'self',
        verbose_name=_('parent department'),
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='children'
    )
    head = models.ForeignKey(
        'accounts.User',
        verbose_name=_('head'),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='headed_departments'
    )
    order = models.PositiveIntegerField(_('order'), default=0)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('department')
        verbose_name_plural = _('departments')
        ordering = ['order', 'name']

    def __str__(self):
        return self.name

    def get_ancestors(self):
        """Get all ancestor departments."""
        ancestors = []
        current = self.parent
        while current:
            ancestors.append(current)
            current = current.parent
        return ancestors

    def get_descendants(self):
        """Get all descendant departments."""
        descendants = []
        for child in self.children.all():
            descendants.append(child)
            descendants.extend(child.get_descendants())
        return descendants

    def get_full_path(self):
        """Get full path from root to this department."""
        ancestors = self.get_ancestors()
        ancestors.reverse()
        return ' / '.join([d.name for d in ancestors] + [self.name])


class Position(models.Model):
    """
    Position/Job title model.
    """
    name = models.CharField(_('name'), max_length=100)
    description = models.TextField(_('description'), blank=True)
    level = models.PositiveIntegerField(
        _('level'),
        default=0,
        help_text=_('Used for sorting in hierarchy (higher = more senior)')
    )
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('position')
        verbose_name_plural = _('positions')
        ordering = ['-level', 'name']

    def __str__(self):
        return self.name
