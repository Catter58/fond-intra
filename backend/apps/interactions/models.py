"""
Models for user interactions: bookmarks, view history, and profile stats.
"""
from django.db import models
from django.conf import settings


class Bookmark(models.Model):
    """User bookmarks for employees and news."""

    class ContentType(models.TextChoices):
        USER = 'user', 'Сотрудник'
        NEWS = 'news', 'Новость'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bookmarks',
        verbose_name='Пользователь'
    )
    content_type = models.CharField(
        max_length=10,
        choices=ContentType.choices,
        verbose_name='Тип контента'
    )
    object_id = models.PositiveIntegerField(verbose_name='ID объекта')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Добавлено')

    class Meta:
        verbose_name = 'Закладка'
        verbose_name_plural = 'Закладки'
        unique_together = ['user', 'content_type', 'object_id']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user} - {self.content_type}:{self.object_id}"


class ViewHistory(models.Model):
    """Track user's view history for profiles."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='view_history',
        verbose_name='Кто смотрел'
    )
    viewed_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profile_views',
        verbose_name='Чей профиль'
    )
    viewed_at = models.DateTimeField(auto_now=True, verbose_name='Время просмотра')

    class Meta:
        verbose_name = 'История просмотра'
        verbose_name_plural = 'История просмотров'
        unique_together = ['user', 'viewed_user']
        ordering = ['-viewed_at']

    def __str__(self):
        return f"{self.user} просмотрел {self.viewed_user}"


class ProfileView(models.Model):
    """Track profile view counts (anonymous aggregated stats)."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profile_view_stats',
        verbose_name='Пользователь'
    )
    view_count = models.PositiveIntegerField(default=0, verbose_name='Количество просмотров')
    last_viewed_at = models.DateTimeField(null=True, blank=True, verbose_name='Последний просмотр')

    class Meta:
        verbose_name = 'Статистика просмотров профиля'
        verbose_name_plural = 'Статистика просмотров профилей'

    def __str__(self):
        return f"{self.user}: {self.view_count} просмотров"

    def increment(self):
        """Increment view count."""
        from django.utils import timezone
        self.view_count += 1
        self.last_viewed_at = timezone.now()
        self.save(update_fields=['view_count', 'last_viewed_at'])
