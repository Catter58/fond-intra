"""
RBAC models: Permission and Role.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _


class Permission(models.Model):
    """
    Custom permission for RBAC system.
    """
    class Category(models.TextChoices):
        USERS = 'users', _('Users')
        ORGANIZATION = 'organization', _('Organization')
        ACHIEVEMENTS = 'achievements', _('Achievements')
        NEWS = 'news', _('News')
        COMMENTS = 'comments', _('Comments')
        ROLES = 'roles', _('Roles')
        AUDIT = 'audit', _('Audit')

    codename = models.CharField(_('codename'), max_length=100, unique=True)
    name = models.CharField(_('name'), max_length=200)
    description = models.TextField(_('description'), blank=True)
    category = models.CharField(
        _('category'),
        max_length=50,
        choices=Category.choices
    )

    class Meta:
        verbose_name = _('permission')
        verbose_name_plural = _('permissions')
        ordering = ['category', 'codename']

    def __str__(self):
        return f"{self.category}: {self.name}"


class Role(models.Model):
    """
    Role that groups permissions together.
    """
    name = models.CharField(_('name'), max_length=100, unique=True)
    description = models.TextField(_('description'), blank=True)
    permissions = models.ManyToManyField(
        Permission,
        verbose_name=_('permissions'),
        blank=True,
        related_name='roles'
    )
    is_system = models.BooleanField(
        _('system role'),
        default=False,
        help_text=_('System roles cannot be deleted')
    )
    is_admin = models.BooleanField(
        _('admin role'),
        default=False,
        help_text=_('Roles with full administrative access')
    )
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('role')
        verbose_name_plural = _('roles')
        ordering = ['name']

    def __str__(self):
        return self.name

    def delete(self, *args, **kwargs):
        if self.is_system:
            raise ValueError(_("System roles cannot be deleted"))
        super().delete(*args, **kwargs)


# Default permissions to be created via migration/fixture
DEFAULT_PERMISSIONS = [
    # Users
    ('users.view_all', 'View all profiles', 'users'),
    ('users.view_private', 'View private data', 'users'),
    ('users.edit_own', 'Edit own profile', 'users'),
    ('users.edit_all', 'Edit all profiles', 'users'),
    ('users.create', 'Create users', 'users'),
    ('users.archive', 'Archive users', 'users'),
    ('users.manage_statuses', 'Manage user statuses', 'users'),

    # Organization
    ('organization.view', 'View organization structure', 'organization'),
    ('organization.manage', 'Manage organization structure', 'organization'),

    # Achievements
    ('achievements.view', 'View achievements', 'achievements'),
    ('achievements.award', 'Award achievements', 'achievements'),
    ('achievements.manage', 'Manage achievement types', 'achievements'),

    # News
    ('news.view', 'View news', 'news'),
    ('news.create', 'Create news', 'news'),
    ('news.edit_own', 'Edit own news', 'news'),
    ('news.edit_all', 'Edit all news', 'news'),
    ('news.delete_own', 'Delete own news', 'news'),
    ('news.delete_all', 'Delete all news', 'news'),
    ('news.pin', 'Pin/unpin news', 'news'),

    # Comments
    ('comments.create', 'Create comments', 'comments'),
    ('comments.edit_own', 'Edit own comments', 'comments'),
    ('comments.delete_all', 'Delete any comment', 'comments'),

    # Roles
    ('roles.view', 'View roles', 'roles'),
    ('roles.manage', 'Manage roles', 'roles'),

    # Audit
    ('audit.view', 'View audit log', 'audit'),
    ('audit.export', 'Export audit log', 'audit'),
]

# Default roles with their permissions
DEFAULT_ROLES = {
    'Employee': {
        'description': 'Basic employee role',
        'is_system': True,
        'permissions': [
            'users.view_all', 'users.edit_own',
            'organization.view',
            'achievements.view', 'achievements.award',
            'news.view', 'news.create', 'news.edit_own', 'news.delete_own',
            'comments.create', 'comments.edit_own',
        ]
    },
    'HR': {
        'description': 'Human Resources role',
        'is_system': True,
        'permissions': [
            'users.view_all', 'users.view_private', 'users.edit_own',
            'users.edit_all', 'users.create', 'users.archive', 'users.manage_statuses',
            'organization.view',
            'achievements.view', 'achievements.award',
            'news.view', 'news.create', 'news.edit_own', 'news.delete_own',
            'comments.create', 'comments.edit_own',
        ]
    },
    'Content Manager': {
        'description': 'Content management role',
        'is_system': True,
        'permissions': [
            'users.view_all', 'users.edit_own',
            'organization.view',
            'achievements.view', 'achievements.award',
            'news.view', 'news.create', 'news.edit_own', 'news.edit_all',
            'news.delete_own', 'news.delete_all', 'news.pin',
            'comments.create', 'comments.edit_own', 'comments.delete_all',
        ]
    },
    'Achievement Admin': {
        'description': 'Achievement management role',
        'is_system': True,
        'permissions': [
            'users.view_all', 'users.edit_own',
            'organization.view',
            'achievements.view', 'achievements.award', 'achievements.manage',
            'news.view', 'news.create', 'news.edit_own', 'news.delete_own',
            'comments.create', 'comments.edit_own',
        ]
    },
    'Admin': {
        'description': 'Full administrator access',
        'is_system': True,
        'is_admin': True,
        'permissions': '__all__'  # Will get all permissions
    },
}
