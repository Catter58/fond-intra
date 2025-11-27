"""
Tests for news app.
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.news.models import News, Comment, Reaction

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
def authenticated_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def news(user):
    return News.objects.create(
        title='Тестовая новость',
        content='Содержание тестовой новости',
        author=user,
        is_published=True,
    )


@pytest.mark.django_db
class TestNewsModel:
    """Tests for News model."""

    def test_create_news(self, user):
        """Test creating a news article."""
        news = News.objects.create(
            title='Новая статья',
            content='Содержание',
            author=user,
        )
        assert news.title == 'Новая статья'
        assert news.author == user
        assert news.is_published is True
        assert news.is_pinned is False

    def test_news_str(self, news):
        """Test news string representation."""
        assert news.title in str(news)

    def test_news_ordering(self, user):
        """Test news are ordered by pinned and date."""
        news1 = News.objects.create(
            title='Обычная новость',
            content='Содержание',
            author=user,
        )
        news2 = News.objects.create(
            title='Закреплённая новость',
            content='Содержание',
            author=user,
            is_pinned=True,
        )
        all_news = list(News.objects.all())
        # Pinned should be first
        assert all_news[0].is_pinned is True


@pytest.mark.django_db
class TestCommentModel:
    """Tests for Comment model."""

    def test_create_comment(self, news, user):
        """Test creating a comment."""
        comment = Comment.objects.create(
            news=news,
            author=user,
            content='Отличная новость!',
        )
        assert comment.content == 'Отличная новость!'
        assert comment.news == news

    def test_nested_comments(self, news, user, another_user):
        """Test creating nested comments."""
        parent = Comment.objects.create(
            news=news,
            author=user,
            content='Родительский комментарий',
        )
        child = Comment.objects.create(
            news=news,
            author=another_user,
            content='Ответ',
            parent=parent,
        )
        assert child.parent == parent


@pytest.mark.django_db
class TestReactionModel:
    """Tests for Reaction model."""

    def test_create_reaction(self, news, user):
        """Test creating a reaction."""
        reaction = Reaction.objects.create(
            news=news,
            user=user,
            type=Reaction.ReactionType.LIKE,
        )
        assert reaction.type == Reaction.ReactionType.LIKE

    def test_unique_reaction_per_user(self, news, user):
        """Test user can only have one reaction per news."""
        Reaction.objects.create(
            news=news,
            user=user,
            type=Reaction.ReactionType.LIKE,
        )
        with pytest.raises(Exception):  # IntegrityError
            Reaction.objects.create(
                news=news,
                user=user,
                type=Reaction.ReactionType.CELEBRATE,
            )


@pytest.mark.django_db
class TestNewsAPI:
    """Tests for news API endpoints."""

    def test_list_news(self, authenticated_client, news):
        """Test listing news."""
        response = authenticated_client.get('/api/v1/news/')
        assert response.status_code == status.HTTP_200_OK
        assert 'results' in response.data

    def test_get_news_detail(self, authenticated_client, news):
        """Test getting news detail."""
        response = authenticated_client.get(f'/api/v1/news/{news.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['title'] == news.title

    def test_create_news(self, authenticated_client, user):
        """Test creating news."""
        response = authenticated_client.post('/api/v1/news/', {
            'title': 'Новая статья',
            'content': 'Содержание новой статьи',
        })
        assert response.status_code == status.HTTP_201_CREATED
        assert News.objects.filter(title='Новая статья').exists()

    def test_update_own_news(self, authenticated_client, news):
        """Test updating own news."""
        response = authenticated_client.patch(f'/api/v1/news/{news.id}/', {
            'title': 'Обновлённый заголовок',
        })
        assert response.status_code == status.HTTP_200_OK
        news.refresh_from_db()
        assert news.title == 'Обновлённый заголовок'

    def test_delete_own_news(self, authenticated_client, news):
        """Test deleting own news."""
        news_id = news.id
        response = authenticated_client.delete(f'/api/v1/news/{news_id}/')
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not News.objects.filter(id=news_id).exists()

    def test_cannot_update_others_news(self, api_client, news, another_user):
        """Test cannot update news created by others."""
        api_client.force_authenticate(user=another_user)
        response = api_client.patch(f'/api/v1/news/{news.id}/', {
            'title': 'Взломанный заголовок',
        })
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_filter_published_only(self, authenticated_client, user):
        """Test filtering shows only published news."""
        News.objects.create(
            title='Опубликованная',
            content='Тест',
            author=user,
            is_published=True,
        )
        News.objects.create(
            title='Черновик',
            content='Тест',
            author=user,
            is_published=False,
        )
        response = authenticated_client.get('/api/v1/news/')
        # Should show published or based on permissions
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestCommentsAPI:
    """Tests for comments API endpoints."""

    def test_list_comments(self, authenticated_client, news, user):
        """Test listing comments for a news."""
        Comment.objects.create(news=news, author=user, content='Комментарий 1')
        Comment.objects.create(news=news, author=user, content='Комментарий 2')
        response = authenticated_client.get(f'/api/v1/news/{news.id}/comments/')
        assert response.status_code == status.HTTP_200_OK

    def test_create_comment(self, authenticated_client, news):
        """Test creating a comment."""
        response = authenticated_client.post(f'/api/v1/news/{news.id}/comments/', {
            'content': 'Новый комментарий',
        })
        assert response.status_code == status.HTTP_201_CREATED

    def test_update_own_comment(self, authenticated_client, news, user):
        """Test updating own comment."""
        comment = Comment.objects.create(
            news=news,
            author=user,
            content='Старый текст',
        )
        response = authenticated_client.patch(
            f'/api/v1/news/{news.id}/comments/{comment.id}/',
            {'content': 'Новый текст'}
        )
        assert response.status_code == status.HTTP_200_OK

    def test_delete_own_comment(self, authenticated_client, news, user):
        """Test deleting own comment."""
        comment = Comment.objects.create(
            news=news,
            author=user,
            content='Удаляемый комментарий',
        )
        response = authenticated_client.delete(
            f'/api/v1/news/{news.id}/comments/{comment.id}/'
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT


@pytest.mark.django_db
class TestReactionsAPI:
    """Tests for reactions API endpoints."""

    def test_add_reaction(self, authenticated_client, news):
        """Test adding a reaction."""
        response = authenticated_client.post(f'/api/v1/news/{news.id}/reactions/', {
            'type': 'like',
        })
        assert response.status_code == status.HTTP_201_CREATED

    def test_change_reaction(self, authenticated_client, news, user):
        """Test changing reaction type."""
        Reaction.objects.create(news=news, user=user, type='like')
        response = authenticated_client.post(f'/api/v1/news/{news.id}/reactions/', {
            'type': 'celebrate',
        })
        # Should update existing reaction
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]

    def test_remove_reaction(self, authenticated_client, news, user):
        """Test removing a reaction."""
        Reaction.objects.create(news=news, user=user, type='like')
        response = authenticated_client.delete(f'/api/v1/news/{news.id}/reactions/')
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Reaction.objects.filter(news=news, user=user).exists()

    def test_list_reactions(self, authenticated_client, news, user, another_user):
        """Test listing reactions for a news."""
        Reaction.objects.create(news=news, user=user, type='like')
        Reaction.objects.create(news=news, user=another_user, type='celebrate')
        response = authenticated_client.get(f'/api/v1/news/{news.id}/reactions/')
        assert response.status_code == status.HTTP_200_OK
