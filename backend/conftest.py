"""
Shared pytest fixtures for all tests.
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


@pytest.fixture
def api_client():
    """Return an API client."""
    return APIClient()


@pytest.fixture
def user_factory(db):
    """Factory for creating test users."""
    def create_user(email='test@example.com', password='testpass123', **kwargs):
        defaults = {
            'first_name': 'Test',
            'last_name': 'User',
        }
        defaults.update(kwargs)
        return User.objects.create_user(email=email, password=password, **defaults)
    return create_user


@pytest.fixture
def admin_factory(db):
    """Factory for creating admin users."""
    def create_admin(email='admin@example.com', password='adminpass123', **kwargs):
        defaults = {
            'first_name': 'Admin',
            'last_name': 'User',
        }
        defaults.update(kwargs)
        return User.objects.create_superuser(email=email, password=password, **defaults)
    return create_admin


@pytest.fixture
def authenticated_client_factory(api_client, user_factory):
    """Factory for creating authenticated API clients."""
    def create_client(user=None, **user_kwargs):
        if user is None:
            user = user_factory(**user_kwargs)
        api_client.force_authenticate(user=user)
        return api_client, user
    return create_client
