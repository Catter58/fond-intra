"""
Management command to initialize default permissions and roles.
"""
from django.core.management.base import BaseCommand

from apps.roles.models import Permission, Role, DEFAULT_PERMISSIONS, DEFAULT_ROLES


class Command(BaseCommand):
    help = 'Initialize default permissions and roles'

    def handle(self, *args, **options):
        self.stdout.write('Creating permissions...')

        # Create permissions
        created_perms = 0
        for codename, name, category in DEFAULT_PERMISSIONS:
            perm, created = Permission.objects.get_or_create(
                codename=codename,
                defaults={
                    'name': name,
                    'category': category
                }
            )
            if created:
                created_perms += 1

        self.stdout.write(f'Created {created_perms} new permissions')

        # Create roles
        self.stdout.write('Creating roles...')
        created_roles = 0

        for role_name, role_data in DEFAULT_ROLES.items():
            role, created = Role.objects.get_or_create(
                name=role_name,
                defaults={
                    'description': role_data['description'],
                    'is_system': role_data['is_system'],
                    'is_admin': role_data.get('is_admin', False)
                }
            )

            if created:
                created_roles += 1
            else:
                # Update is_admin flag for existing roles
                if role.is_admin != role_data.get('is_admin', False):
                    role.is_admin = role_data.get('is_admin', False)
                    role.save(update_fields=['is_admin'])

            # Assign permissions
            if role_data['permissions'] == '__all__':
                role.permissions.set(Permission.objects.all())
            else:
                perms = Permission.objects.filter(
                    codename__in=role_data['permissions']
                )
                role.permissions.set(perms)

        self.stdout.write(f'Created {created_roles} new roles')
        self.stdout.write(self.style.SUCCESS('Successfully initialized roles and permissions'))
