"""
Data migration to create default permissions and roles.
This migration runs automatically when applying migrations.
"""
from django.db import migrations


def create_default_permissions_and_roles(apps, schema_editor):
    """Create all default permissions and two default roles."""
    Permission = apps.get_model('roles', 'Permission')
    Role = apps.get_model('roles', 'Role')

    # All permissions to create
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

    # Permissions for basic user role
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

    # Create all permissions
    created_permissions = {}
    for codename, name, category in DEFAULT_PERMISSIONS:
        permission, _ = Permission.objects.get_or_create(
            codename=codename,
            defaults={
                'name': name,
                'category': category,
                'description': '',
            }
        )
        created_permissions[codename] = permission

    # Create User role
    user_role, created = Role.objects.get_or_create(
        name='Пользователь',
        defaults={
            'description': 'Базовая роль для всех пользователей',
            'is_system': True,
            'is_admin': False,
        }
    )
    if created:
        # Add user permissions
        for codename in USER_PERMISSIONS:
            if codename in created_permissions:
                user_role.permissions.add(created_permissions[codename])

    # Create Admin role
    admin_role, created = Role.objects.get_or_create(
        name='Администратор',
        defaults={
            'description': 'Полный доступ ко всем функциям',
            'is_system': True,
            'is_admin': True,
        }
    )
    if created:
        # Add all permissions to admin
        for permission in created_permissions.values():
            admin_role.permissions.add(permission)


def reverse_migration(apps, schema_editor):
    """Remove default roles and permissions (for rollback)."""
    Permission = apps.get_model('roles', 'Permission')
    Role = apps.get_model('roles', 'Role')

    # Remove default roles (only if they haven't been modified)
    Role.objects.filter(name__in=['Пользователь', 'Администратор'], is_system=True).delete()

    # We don't delete permissions as they might be in use by other roles


class Migration(migrations.Migration):

    dependencies = [
        ('roles', '0002_add_is_admin_field'),
    ]

    operations = [
        migrations.RunPython(
            create_default_permissions_and_roles,
            reverse_migration,
        ),
    ]
