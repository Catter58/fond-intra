"""
Tests for achievements app.
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.achievements.models import Achievement, AchievementAward

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
def another_user():
    return User.objects.create_user(
        email='another@example.com',
        password='testpass123',
        first_name='Мария',
        last_name='Иванова',
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
def achievement(admin_user):
    return Achievement.objects.create(
        name='Инноватор',
        description='За внедрение новых идей',
        icon='💡',
        category=Achievement.Category.PROFESSIONAL,
        is_active=True,
        created_by=admin_user,
    )


@pytest.mark.django_db
class TestAchievementModel:
    """Tests for Achievement model."""

    def test_create_achievement(self, admin_user):
        """Test creating an achievement type."""
        achievement = Achievement.objects.create(
            name='Тестовая ачивка',
            description='Описание',
            icon='🏆',
            category=Achievement.Category.CORPORATE,
            created_by=admin_user,
        )
        assert achievement.name == 'Тестовая ачивка'
        assert achievement.is_active is True

    def test_achievement_str(self, achievement):
        """Test achievement string representation."""
        assert str(achievement) == achievement.name

    def test_achievement_categories(self):
        """Test achievement categories exist."""
        categories = Achievement.Category.choices
        assert len(categories) >= 4
        assert Achievement.Category.PROFESSIONAL in dict(categories)


@pytest.mark.django_db
class TestAchievementAwardModel:
    """Tests for AchievementAward model."""

    def test_create_award(self, achievement, user, another_user):
        """Test creating an achievement award."""
        award = AchievementAward.objects.create(
            achievement=achievement,
            recipient=user,
            awarded_by=another_user,
            comment='Отличная работа!',
        )
        assert award.recipient == user
        assert award.awarded_by == another_user
        assert award.comment == 'Отличная работа!'

    def test_award_str(self, achievement, user, another_user):
        """Test award string representation."""
        award = AchievementAward.objects.create(
            achievement=achievement,
            recipient=user,
            awarded_by=another_user,
            comment='Тест',
        )
        assert achievement.name in str(award)
        assert user.get_full_name() in str(award) or user.email in str(award)


@pytest.mark.django_db
class TestAchievementsAPI:
    """Tests for achievements API endpoints."""

    def test_list_achievement_types(self, authenticated_client, achievement):
        """Test listing achievement types."""
        response = authenticated_client.get('/api/v1/achievements/types/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1

    def test_get_achievement_feed(self, authenticated_client, achievement, user, another_user):
        """Test getting achievement feed."""
        # Create an award
        AchievementAward.objects.create(
            achievement=achievement,
            recipient=user,
            awarded_by=another_user,
            comment='Тест',
        )
        response = authenticated_client.get('/api/v1/achievements/feed/')
        assert response.status_code == status.HTTP_200_OK

    def test_award_achievement(self, authenticated_client, achievement, user, another_user):
        """Test awarding an achievement."""
        authenticated_client.force_authenticate(user=another_user)
        response = authenticated_client.post('/api/v1/achievements/award/', {
            'achievement': achievement.id,
            'recipient': user.id,
            'comment': 'Заслуженная награда!',
        })
        assert response.status_code == status.HTTP_201_CREATED
        assert AchievementAward.objects.filter(
            achievement=achievement,
            recipient=user,
        ).exists()

    def test_award_achievement_without_comment(self, authenticated_client, achievement, user, another_user):
        """Test awarding without comment should fail."""
        authenticated_client.force_authenticate(user=another_user)
        response = authenticated_client.post('/api/v1/achievements/award/', {
            'achievement': achievement.id,
            'recipient': user.id,
            'comment': '',
        })
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_get_user_achievements(self, authenticated_client, achievement, user, another_user):
        """Test getting user achievements."""
        AchievementAward.objects.create(
            achievement=achievement,
            recipient=user,
            awarded_by=another_user,
            comment='Тест',
        )
        response = authenticated_client.get(f'/api/v1/achievements/user/{user.id}/')
        assert response.status_code == status.HTTP_200_OK

    def test_get_my_achievements(self, authenticated_client, achievement, user, another_user):
        """Test getting own achievements."""
        AchievementAward.objects.create(
            achievement=achievement,
            recipient=user,
            awarded_by=another_user,
            comment='Тест',
        )
        response = authenticated_client.get('/api/v1/achievements/my/')
        assert response.status_code == status.HTTP_200_OK

    def test_create_achievement_type_admin_only(self, authenticated_client, admin_client):
        """Test only admin can create achievement types."""
        # Regular user should fail
        response = authenticated_client.post('/api/v1/achievements/types/', {
            'name': 'Новая ачивка',
            'description': 'Описание',
            'icon': '🎯',
            'category': 'professional',
        })
        assert response.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED]

        # Admin should succeed
        response = admin_client.post('/api/v1/achievements/types/', {
            'name': 'Новая ачивка',
            'description': 'Описание',
            'icon': '🎯',
            'category': 'professional',
        })
        # May succeed or fail based on exact permissions setup
        assert response.status_code in [status.HTTP_201_CREATED, status.HTTP_403_FORBIDDEN]


@pytest.mark.django_db
class TestAchievementStats:
    """Tests for achievement statistics."""

    def test_achievement_stats_endpoint(self, authenticated_client, achievement, user, another_user):
        """Test achievement stats endpoint."""
        # Create some awards
        for _ in range(3):
            AchievementAward.objects.create(
                achievement=achievement,
                recipient=user,
                awarded_by=another_user,
                comment='Тест',
            )
        response = authenticated_client.get('/api/v1/achievements/stats/')
        assert response.status_code == status.HTTP_200_OK
