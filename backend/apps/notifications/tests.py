"""
Tests for notifications app.
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.notifications.models import Notification, NotificationSettings

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
def authenticated_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def notification(user):
    return Notification.objects.create(
        user=user,
        type=Notification.NotificationType.NEWS,
        title='Тестовое уведомление',
        message='Содержание уведомления',
    )


@pytest.mark.django_db
class TestNotificationModel:
    """Tests for Notification model."""

    def test_create_notification(self, user):
        """Test creating a notification."""
        notif = Notification.objects.create(
            user=user,
            type=Notification.NotificationType.ACHIEVEMENT,
            title='Новая ачивка',
            message='Вы получили ачивку!',
        )
        assert notif.user == user
        assert notif.is_read is False

    def test_notification_str(self, notification):
        """Test notification string representation."""
        assert notification.title in str(notification)

    def test_notification_types(self):
        """Test notification types exist."""
        types = Notification.NotificationType.choices
        assert len(types) >= 4


@pytest.mark.django_db
class TestNotificationSettingsModel:
    """Tests for NotificationSettings model."""

    def test_create_settings(self, user):
        """Test creating notification settings."""
        settings = NotificationSettings.objects.create(
            user=user,
            birthdays_enabled=True,
            achievements_enabled=True,
            news_enabled=False,
            email_enabled=False,
        )
        assert settings.user == user
        assert settings.news_enabled is False

    def test_default_settings(self, user):
        """Test default notification settings values."""
        settings = NotificationSettings.objects.create(user=user)
        assert settings.birthdays_enabled is True
        assert settings.achievements_enabled is True
        assert settings.news_enabled is True
        assert settings.email_enabled is False


@pytest.mark.django_db
class TestNotificationsAPI:
    """Tests for notifications API endpoints."""

    def test_list_notifications(self, authenticated_client, notification):
        """Test listing notifications."""
        response = authenticated_client.get('/api/v1/notifications/')
        assert response.status_code == status.HTTP_200_OK

    def test_get_unread_count(self, authenticated_client, user):
        """Test getting unread notifications count."""
        # Create some unread notifications
        for i in range(3):
            Notification.objects.create(
                user=user,
                type='news',
                title=f'Уведомление {i}',
                message='Тест',
            )
        response = authenticated_client.get('/api/v1/notifications/unread-count/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 3

    def test_mark_as_read(self, authenticated_client, notification):
        """Test marking notification as read."""
        response = authenticated_client.post(
            f'/api/v1/notifications/{notification.id}/read/'
        )
        assert response.status_code == status.HTTP_200_OK
        notification.refresh_from_db()
        assert notification.is_read is True

    def test_mark_all_as_read(self, authenticated_client, user):
        """Test marking all notifications as read."""
        # Create some unread notifications
        for i in range(3):
            Notification.objects.create(
                user=user,
                type='news',
                title=f'Уведомление {i}',
                message='Тест',
            )
        response = authenticated_client.post('/api/v1/notifications/read-all/')
        assert response.status_code == status.HTTP_200_OK
        unread_count = Notification.objects.filter(user=user, is_read=False).count()
        assert unread_count == 0

    def test_get_notification_settings(self, authenticated_client, user):
        """Test getting notification settings."""
        NotificationSettings.objects.create(user=user)
        response = authenticated_client.get('/api/v1/notifications/settings/')
        assert response.status_code == status.HTTP_200_OK

    def test_update_notification_settings(self, authenticated_client, user):
        """Test updating notification settings."""
        NotificationSettings.objects.create(user=user)
        response = authenticated_client.put('/api/v1/notifications/settings/', {
            'birthdays_enabled': False,
            'achievements_enabled': True,
            'news_enabled': True,
            'comments_enabled': True,
            'email_enabled': True,
        })
        assert response.status_code == status.HTTP_200_OK

    def test_cannot_see_others_notifications(self, api_client, notification):
        """Test users cannot see other users' notifications."""
        other_user = User.objects.create_user(
            email='other@example.com',
            password='test123',
            first_name='Other',
            last_name='User',
        )
        api_client.force_authenticate(user=other_user)
        response = api_client.get(f'/api/v1/notifications/{notification.id}/')
        assert response.status_code == status.HTTP_404_NOT_FOUND
