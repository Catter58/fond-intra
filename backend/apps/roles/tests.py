"""
Tests for roles app.
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.roles.models import Role, Permission

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user():
    return User.objects.create_user(
        email='test@example.com',
        password='testpass123',
        first_name='Иван',
        last_name='Петров',
    )


@pytest.fixture
def admin_user():
    return User.objects.create_superuser(
        email='admin@example.com',
        password='adminpass123',
        first_name='Admin',
        last_name='User',
    )


@pytest.fixture
def authenticated_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def admin_client(api_client, admin_user):
    api_client.force_authenticate(user=admin_user)
    return api_client


@pytest.fixture
def permission():
    return Permission.objects.create(
        codename='users.view_all',
        name='Просмотр всех пользователей',
        category='users',
    )


@pytest.fixture
def role(permission):
    role = Role.objects.create(
        name='Тестовая роль',
        description='Описание роли',
    )
    role.permissions.add(permission)
    return role


@pytest.mark.django_db
class TestPermissionModel:
    """Tests for Permission model."""

    def test_create_permission(self):
        """Test creating a permission."""
        perm = Permission.objects.create(
            codename='test.permission',
            name='Тестовое право',
            category='test',
        )
        assert perm.codename == 'test.permission'

    def test_permission_str(self, permission):
        """Test permission string representation."""
        assert permission.codename in str(permission) or permission.name in str(permission)

    def test_permission_uniqueness(self, permission):
        """Test permission codename is unique."""
        with pytest.raises(Exception):
            Permission.objects.create(
                codename=permission.codename,
                name='Дубликат',
                category='test',
            )


@pytest.mark.django_db
class TestRoleModel:
    """Tests for Role model."""

    def test_create_role(self):
        """Test creating a role."""
        role = Role.objects.create(
            name='Новая роль',
            description='Описание',
        )
        assert role.name == 'Новая роль'
        assert role.is_system is False

    def test_role_str(self, role):
        """Test role string representation."""
        assert role.name in str(role)

    def test_role_permissions(self, role, permission):
        """Test role has permissions."""
        assert permission in role.permissions.all()

    def test_system_role(self):
        """Test system role flag."""
        role = Role.objects.create(
            name='Admin',
            is_system=True,
        )
        assert role.is_system is True


@pytest.mark.django_db
class TestUserRoles:
    """Tests for user-role relationships."""

    def test_assign_role_to_user(self, user, role):
        """Test assigning a role to a user."""
        user.roles.add(role)
        assert role in user.roles.all()

    def test_user_has_permission_through_role(self, user, role, permission):
        """Test user has permission through role."""
        user.roles.add(role)
        assert user.has_permission(permission.codename)

    def test_user_without_permission(self, user, permission):
        """Test user without permission."""
        assert not user.has_permission(permission.codename)

    def test_superuser_has_all_permissions(self, admin_user, permission):
        """Test superuser has all permissions."""
        assert admin_user.has_permission(permission.codename)
        assert admin_user.has_permission('any.random.permission')


@pytest.mark.django_db
class TestRolesAPI:
    """Tests for roles API endpoints."""

    def test_list_roles_admin_only(self, authenticated_client, admin_client, role):
        """Test listing roles requires admin."""
        # Regular user should fail
        response = authenticated_client.get('/api/v1/admin/roles/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

        # Admin should succeed
        response = admin_client.get('/api/v1/admin/roles/')
        assert response.status_code == status.HTTP_200_OK

    def test_get_role_detail(self, admin_client, role):
        """Test getting role detail."""
        response = admin_client.get(f'/api/v1/admin/roles/{role.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == role.name

    def test_create_role(self, admin_client, permission):
        """Test creating a role."""
        response = admin_client.post('/api/v1/admin/roles/', {
            'name': 'Новая роль',
            'description': 'Описание роли',
            'permissions': [permission.id],
        })
        assert response.status_code == status.HTTP_201_CREATED

    def test_update_role(self, admin_client, role):
        """Test updating a role."""
        response = admin_client.patch(f'/api/v1/admin/roles/{role.id}/', {
            'description': 'Обновлённое описание',
        })
        assert response.status_code == status.HTTP_200_OK
        role.refresh_from_db()
        assert role.description == 'Обновлённое описание'

    def test_delete_non_system_role(self, admin_client):
        """Test deleting a non-system role."""
        role = Role.objects.create(name='Удаляемая роль')
        response = admin_client.delete(f'/api/v1/admin/roles/{role.id}/')
        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_cannot_delete_system_role(self, admin_client):
        """Test cannot delete a system role."""
        role = Role.objects.create(name='Системная роль', is_system=True)
        response = admin_client.delete(f'/api/v1/admin/roles/{role.id}/')
        assert response.status_code in [
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_403_FORBIDDEN
        ]

    def test_list_permissions(self, admin_client, permission):
        """Test listing all permissions."""
        response = admin_client.get('/api/v1/admin/roles/permissions/')
        assert response.status_code == status.HTTP_200_OK

    def test_assign_role_to_user(self, admin_client, role, user):
        """Test assigning a role to a user."""
        response = admin_client.post(
            f'/api/v1/admin/roles/{role.id}/assign/{user.id}/'
        )
        assert response.status_code == status.HTTP_200_OK
        user.refresh_from_db()
        assert role in user.roles.all()

    def test_revoke_role_from_user(self, admin_client, role, user):
        """Test revoking a role from a user."""
        user.roles.add(role)
        response = admin_client.post(
            f'/api/v1/admin/roles/{role.id}/revoke/{user.id}/'
        )
        assert response.status_code == status.HTTP_200_OK
        user.refresh_from_db()
        assert role not in user.roles.all()
