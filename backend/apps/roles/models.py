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
        SKILLS = 'skills', _('Skills')
        KUDOS = 'kudos', _('Kudos')
        SURVEYS = 'surveys', _('Surveys')
        IDEAS = 'ideas', _('Ideas')
        FAQ = 'faq', _('FAQ')
        CLASSIFIEDS = 'classifieds', _('Classifieds')
        OKR = 'okr', _('OKR')
        BOOKINGS = 'bookings', _('Bookings')
        WIKI = 'wiki', _('Wiki')
        SETTINGS = 'settings', _('Settings')

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
    ('users.view_all', 'Просмотр всех профилей', 'users'),
    ('users.view_private', 'Просмотр приватных данных', 'users'),
    ('users.edit_own', 'Редактирование своего профиля', 'users'),
    ('users.edit_all', 'Редактирование всех профилей', 'users'),
    ('users.create', 'Создание пользователей', 'users'),
    ('users.archive', 'Архивирование пользователей', 'users'),
    ('users.manage_statuses', 'Управление статусами пользователей', 'users'),

    # Organization
    ('organization.view', 'Просмотр структуры организации', 'organization'),
    ('organization.manage', 'Управление структурой организации', 'organization'),

    # Achievements
    ('achievements.view', 'Просмотр достижений', 'achievements'),
    ('achievements.award', 'Награждение достижениями', 'achievements'),
    ('achievements.manage', 'Управление типами достижений', 'achievements'),

    # News
    ('news.view', 'Просмотр новостей', 'news'),
    ('news.create', 'Создание новостей', 'news'),
    ('news.edit_own', 'Редактирование своих новостей', 'news'),
    ('news.edit_all', 'Редактирование всех новостей', 'news'),
    ('news.delete_own', 'Удаление своих новостей', 'news'),
    ('news.delete_all', 'Удаление всех новостей', 'news'),
    ('news.pin', 'Закрепление новостей', 'news'),

    # Comments
    ('comments.create', 'Создание комментариев', 'comments'),
    ('comments.edit_own', 'Редактирование своих комментариев', 'comments'),
    ('comments.delete_all', 'Удаление любых комментариев', 'comments'),

    # Skills
    ('skills.view', 'Просмотр навыков', 'skills'),
    ('skills.manage_own', 'Управление своими навыками', 'skills'),
    ('skills.manage_all', 'Управление всеми навыками', 'skills'),
    ('skills.endorse', 'Подтверждение навыков коллег', 'skills'),

    # Kudos
    ('kudos.view', 'Просмотр благодарностей', 'kudos'),
    ('kudos.send', 'Отправка благодарностей', 'kudos'),
    ('kudos.manage', 'Управление благодарностями', 'kudos'),

    # Surveys
    ('surveys.view', 'Просмотр опросов', 'surveys'),
    ('surveys.respond', 'Участие в опросах', 'surveys'),
    ('surveys.create', 'Создание опросов', 'surveys'),
    ('surveys.manage', 'Управление всеми опросами', 'surveys'),
    ('surveys.view_results', 'Просмотр результатов опросов', 'surveys'),

    # Ideas
    ('ideas.view', 'Просмотр идей', 'ideas'),
    ('ideas.create', 'Создание идей', 'ideas'),
    ('ideas.vote', 'Голосование за идеи', 'ideas'),
    ('ideas.manage', 'Управление идеями', 'ideas'),

    # FAQ
    ('faq.view', 'Просмотр FAQ', 'faq'),
    ('faq.manage', 'Управление FAQ', 'faq'),

    # Classifieds
    ('classifieds.view', 'Просмотр объявлений', 'classifieds'),
    ('classifieds.create', 'Создание объявлений', 'classifieds'),
    ('classifieds.manage_own', 'Управление своими объявлениями', 'classifieds'),
    ('classifieds.manage_all', 'Управление всеми объявлениями', 'classifieds'),

    # OKR
    ('okr.view', 'Просмотр OKR', 'okr'),
    ('okr.create_own', 'Создание своих OKR', 'okr'),
    ('okr.manage_team', 'Управление OKR команды', 'okr'),
    ('okr.manage_all', 'Управление всеми OKR', 'okr'),

    # Bookings
    ('bookings.view', 'Просмотр бронирований', 'bookings'),
    ('bookings.create', 'Создание бронирований', 'bookings'),
    ('bookings.manage_own', 'Управление своими бронированиями', 'bookings'),
    ('bookings.manage_all', 'Управление всеми бронированиями', 'bookings'),
    ('bookings.manage_resources', 'Управление ресурсами', 'bookings'),

    # Wiki
    ('wiki.view', 'Просмотр базы знаний', 'wiki'),
    ('wiki.create', 'Создание страниц', 'wiki'),
    ('wiki.edit_own', 'Редактирование своих страниц', 'wiki'),
    ('wiki.edit_all', 'Редактирование всех страниц', 'wiki'),
    ('wiki.manage_spaces', 'Управление пространствами', 'wiki'),

    # Roles
    ('roles.view', 'Просмотр ролей', 'roles'),
    ('roles.manage', 'Управление ролями', 'roles'),

    # Audit
    ('audit.view', 'Просмотр журнала аудита', 'audit'),
    ('audit.export', 'Экспорт журнала аудита', 'audit'),

    # Settings
    ('settings.view', 'Просмотр настроек портала', 'settings'),
    ('settings.manage', 'Управление настройками портала', 'settings'),
]

# User role permissions - basic access for all authenticated users
USER_PERMISSIONS = [
    # Users
    'users.view_all', 'users.edit_own',
    # Organization
    'organization.view',
    # Achievements
    'achievements.view',
    # News
    'news.view', 'news.create', 'news.edit_own', 'news.delete_own',
    # Comments
    'comments.create', 'comments.edit_own',
    # Skills
    'skills.view', 'skills.manage_own', 'skills.endorse',
    # Kudos
    'kudos.view', 'kudos.send',
    # Surveys
    'surveys.view', 'surveys.respond',
    # Ideas
    'ideas.view', 'ideas.create', 'ideas.vote',
    # FAQ
    'faq.view',
    # Classifieds
    'classifieds.view', 'classifieds.create', 'classifieds.manage_own',
    # OKR
    'okr.view', 'okr.create_own',
    # Bookings
    'bookings.view', 'bookings.create', 'bookings.manage_own',
    # Wiki
    'wiki.view', 'wiki.create', 'wiki.edit_own',
]

# Default roles with their permissions
DEFAULT_ROLES = {
    'Пользователь': {
        'description': 'Базовая роль для всех пользователей',
        'is_system': True,
        'is_admin': False,
        'permissions': USER_PERMISSIONS
    },
    'Администратор': {
        'description': 'Полный доступ ко всем функциям',
        'is_system': True,
        'is_admin': True,
        'permissions': '__all__'  # Will get all permissions
    },
}
