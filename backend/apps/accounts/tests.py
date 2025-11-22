"""
Tests for accounts app.
"""
import pytest
from datetime import date, timedelta
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user_data():
    return {
        'email': 'test@example.com',
        'password': 'testpass123',
        'first_name': 'Иван',
        'last_name': 'Петров',
    }


@pytest.fixture
def user(user_data):
    return User.objects.create_user(**user_data)


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


@pytest.mark.django_db
class TestUserModel:
    """Tests for User model."""

    def test_create_user(self, user_data):
        """Test creating a user with email."""
        user = User.objects.create_user(**user_data)
        assert user.email == user_data['email']
        assert user.first_name == user_data['first_name']
        assert user.last_name == user_data['last_name']
        assert user.check_password(user_data['password'])
        assert not user.is_staff
        assert not user.is_superuser

    def test_create_user_without_email_raises_error(self):
        """Test creating a user without email raises ValueError."""
        with pytest.raises(ValueError):
            User.objects.create_user(email='', password='test123')

    def test_create_superuser(self):
        """Test creating a superuser."""
        admin = User.objects.create_superuser(
            email='super@example.com',
            password='superpass123',
            first_name='Super',
            last_name='Admin',
        )
        assert admin.is_staff
        assert admin.is_superuser
        assert admin.is_active

    def test_user_full_name(self, user):
        """Test get_full_name method."""
        assert user.get_full_name() == 'Петров Иван'

    def test_user_full_name_with_patronymic(self, user):
        """Test get_full_name with patronymic."""
        user.patronymic = 'Сергеевич'
        user.save()
        assert user.get_full_name() == 'Петров Иван Сергеевич'

    def test_user_short_name(self, user):
        """Test get_short_name method."""
        assert user.get_short_name() == 'Иван П.'

    def test_user_str(self, user):
        """Test user string representation."""
        assert str(user) == user.get_full_name()

    def test_get_active_users(self, user):
        """Test get_active manager method."""
        # Create archived user
        archived = User.objects.create_user(
            email='archived@example.com',
            password='test123',
            first_name='Archived',
            last_name='User',
            is_archived=True,
        )
        active_users = User.objects.get_active()
        assert user in active_users
        assert archived not in active_users

    def test_has_permission_superuser(self, admin_user):
        """Test superuser has all permissions."""
        assert admin_user.has_permission('any.permission')

    def test_has_any_permission_superuser(self, admin_user):
        """Test superuser has any permission."""
        assert admin_user.has_any_permission(['perm1', 'perm2'])


@pytest.mark.django_db
class TestUserStatus:
    """Tests for UserStatus model."""

    def test_create_status(self, user):
        """Test creating a user status."""
        from apps.accounts.models import UserStatus
        status = UserStatus.objects.create(
            user=user,
            status=UserStatus.StatusType.VACATION,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=7),
            comment='Annual vacation',
        )
        assert status.user == user
        assert status.status == UserStatus.StatusType.VACATION

    def test_current_status(self, user):
        """Test current_status property."""
        from apps.accounts.models import UserStatus
        # Create current status
        UserStatus.objects.create(
            user=user,
            status=UserStatus.StatusType.REMOTE,
            start_date=date.today() - timedelta(days=1),
            end_date=date.today() + timedelta(days=1),
        )
        assert user.current_status is not None
        assert user.current_status.status == UserStatus.StatusType.REMOTE

    def test_no_current_status(self, user):
        """Test current_status returns None when no active status."""
        assert user.current_status is None


@pytest.mark.django_db
class TestAuthAPI:
    """Tests for authentication API endpoints."""

    def test_login_success(self, api_client, user, user_data):
        """Test successful login."""
        response = api_client.post('/api/v1/auth/login/', {
            'email': user_data['email'],
            'password': user_data['password'],
        })
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data

    def test_login_invalid_credentials(self, api_client, user):
        """Test login with invalid credentials."""
        response = api_client.post('/api/v1/auth/login/', {
            'email': user.email,
            'password': 'wrongpassword',
        })
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_nonexistent_user(self, api_client):
        """Test login with nonexistent user."""
        response = api_client.post('/api/v1/auth/login/', {
            'email': 'nonexistent@example.com',
            'password': 'password123',
        })
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_token_refresh(self, api_client, user, user_data):
        """Test token refresh."""
        # First login
        login_response = api_client.post('/api/v1/auth/login/', {
            'email': user_data['email'],
            'password': user_data['password'],
        })
        refresh_token = login_response.data['refresh']

        # Refresh token
        response = api_client.post('/api/v1/auth/token/refresh/', {
            'refresh': refresh_token,
        })
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data


@pytest.mark.django_db
class TestUsersAPI:
    """Tests for users API endpoints."""

    def test_get_current_user(self, authenticated_client, user):
        """Test getting current user profile."""
        response = authenticated_client.get('/api/v1/users/me/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == user.email

    def test_get_current_user_unauthenticated(self, api_client):
        """Test getting current user without authentication."""
        response = api_client.get('/api/v1/users/me/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_update_current_user(self, authenticated_client, user):
        """Test updating current user profile."""
        response = authenticated_client.patch('/api/v1/users/me/', {
            'telegram': '@testuser',
        })
        assert response.status_code == status.HTTP_200_OK
        user.refresh_from_db()
        assert user.telegram == '@testuser'

    def test_list_users(self, authenticated_client, user, admin_user):
        """Test listing users."""
        response = authenticated_client.get('/api/v1/users/')
        assert response.status_code == status.HTTP_200_OK
        assert 'results' in response.data

    def test_get_user_detail(self, authenticated_client, user, admin_user):
        """Test getting user detail."""
        response = authenticated_client.get(f'/api/v1/users/{admin_user.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == admin_user.email

    def test_search_users(self, authenticated_client, user):
        """Test searching users."""
        response = authenticated_client.get('/api/v1/users/search/', {
            'q': user.first_name,
        })
        assert response.status_code == status.HTTP_200_OK

    def test_birthdays_endpoint(self, authenticated_client, user):
        """Test birthdays endpoint."""
        user.birth_date = date.today()
        user.save()
        response = authenticated_client.get('/api/v1/users/birthdays/')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestPasswordChange:
    """Tests for password change functionality."""

    def test_change_password_success(self, authenticated_client, user, user_data):
        """Test successful password change."""
        response = authenticated_client.post('/api/v1/auth/password/change/', {
            'old_password': user_data['password'],
            'new_password': 'newpassword123',
            'new_password_confirm': 'newpassword123',
        })
        assert response.status_code == status.HTTP_200_OK
        user.refresh_from_db()
        assert user.check_password('newpassword123')

    def test_change_password_wrong_old_password(self, authenticated_client, user):
        """Test password change with wrong old password."""
        response = authenticated_client.post('/api/v1/auth/password/change/', {
            'old_password': 'wrongpassword',
            'new_password': 'newpassword123',
            'new_password_confirm': 'newpassword123',
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST
