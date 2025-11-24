"""
Models for ideas app.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _


class Idea(models.Model):
    """Idea/suggestion model."""

    class Category(models.TextChoices):
        PROCESS = 'process', _('Процессы')
        PRODUCT = 'product', _('Продукт')
        CULTURE = 'culture', _('Культура')
        OTHER = 'other', _('Другое')

    class Status(models.TextChoices):
        NEW = 'new', _('Новая')
        UNDER_REVIEW = 'under_review', _('На рассмотрении')
        APPROVED = 'approved', _('Одобрена')
        IN_PROGRESS = 'in_progress', _('В работе')
        IMPLEMENTED = 'implemented', _('Реализована')
        REJECTED = 'rejected', _('Отклонена')

    title = models.CharField(_('Заголовок'), max_length=255)
    description = models.TextField(_('Описание'))
    author = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='ideas',
        verbose_name=_('Автор')
    )
    category = models.CharField(
        _('Категория'),
        max_length=20,
        choices=Category.choices,
        default=Category.OTHER
    )
    status = models.CharField(
        _('Статус'),
        max_length=20,
        choices=Status.choices,
        default=Status.NEW
    )
    admin_comment = models.TextField(_('Комментарий модератора'), blank=True)
    created_at = models.DateTimeField(_('Создано'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Обновлено'), auto_now=True)

    class Meta:
        verbose_name = _('Идея')
        verbose_name_plural = _('Идеи')
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    @property
    def votes_score(self):
        """Calculate net votes (upvotes - downvotes)."""
        upvotes = self.votes.filter(is_upvote=True).count()
        downvotes = self.votes.filter(is_upvote=False).count()
        return upvotes - downvotes

    @property
    def upvotes_count(self):
        return self.votes.filter(is_upvote=True).count()

    @property
    def downvotes_count(self):
        return self.votes.filter(is_upvote=False).count()


class IdeaVote(models.Model):
    """Vote on an idea."""

    idea = models.ForeignKey(
        Idea,
        on_delete=models.CASCADE,
        related_name='votes',
        verbose_name=_('Идея')
    )
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='idea_votes',
        verbose_name=_('Пользователь')
    )
    is_upvote = models.BooleanField(_('За'), default=True)
    created_at = models.DateTimeField(_('Создано'), auto_now_add=True)

    class Meta:
        verbose_name = _('Голос')
        verbose_name_plural = _('Голоса')
        unique_together = ['idea', 'user']

    def __str__(self):
        vote_type = 'за' if self.is_upvote else 'против'
        return f"{self.user} голосовал {vote_type} идеи {self.idea.id}"


class IdeaComment(models.Model):
    """Comment on an idea."""

    idea = models.ForeignKey(
        Idea,
        on_delete=models.CASCADE,
        related_name='comments',
        verbose_name=_('Идея')
    )
    author = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='idea_comments',
        verbose_name=_('Автор')
    )
    text = models.TextField(_('Текст'))
    created_at = models.DateTimeField(_('Создано'), auto_now_add=True)

    class Meta:
        verbose_name = _('Комментарий')
        verbose_name_plural = _('Комментарии')
        ordering = ['created_at']

    def __str__(self):
        return f"Комментарий к {self.idea.title[:30]} от {self.author}"
