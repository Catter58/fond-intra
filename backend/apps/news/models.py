"""
News models: News, NewsAttachment, Comment, Reaction.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _

from core.utils import news_attachment_upload_path


class News(models.Model):
    """
    News post model.
    """
    title = models.CharField(_('title'), max_length=200)
    content = models.TextField(_('content'))
    author = models.ForeignKey(
        'accounts.User',
        verbose_name=_('author'),
        on_delete=models.SET_NULL,
        null=True,
        related_name='news_posts'
    )
    is_pinned = models.BooleanField(_('pinned'), default=False)
    is_published = models.BooleanField(_('published'), default=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('news')
        verbose_name_plural = _('news')
        ordering = ['-is_pinned', '-created_at']

    def __str__(self):
        return self.title

    def get_reactions_summary(self):
        """Get count of each reaction type."""
        return self.reactions.values('type').annotate(
            count=models.Count('id')
        )


class NewsAttachment(models.Model):
    """
    File attachment for news posts.
    """
    news = models.ForeignKey(
        News,
        verbose_name=_('news'),
        on_delete=models.CASCADE,
        related_name='attachments'
    )
    file = models.FileField(
        _('file'),
        upload_to=news_attachment_upload_path
    )
    file_name = models.CharField(_('file name'), max_length=255)
    file_type = models.CharField(_('file type'), max_length=100)
    file_size = models.PositiveIntegerField(_('file size'), default=0)
    uploaded_at = models.DateTimeField(_('uploaded at'), auto_now_add=True)

    class Meta:
        verbose_name = _('news attachment')
        verbose_name_plural = _('news attachments')

    def __str__(self):
        return self.file_name


class Comment(models.Model):
    """
    Comment on a news post. Supports nested comments via parent field.
    """
    news = models.ForeignKey(
        News,
        verbose_name=_('news'),
        on_delete=models.CASCADE,
        related_name='comments'
    )
    author = models.ForeignKey(
        'accounts.User',
        verbose_name=_('author'),
        on_delete=models.SET_NULL,
        null=True,
        related_name='news_comments'
    )
    parent = models.ForeignKey(
        'self',
        verbose_name=_('parent comment'),
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='replies'
    )
    content = models.TextField(_('content'))
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('comment')
        verbose_name_plural = _('comments')
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.author} on {self.news}"

    @property
    def is_reply(self):
        """Check if this is a reply to another comment."""
        return self.parent is not None


class Reaction(models.Model):
    """
    Reaction to a news post (like, celebrate, support, insightful).
    """
    class ReactionType(models.TextChoices):
        LIKE = 'like', _('Like')
        CELEBRATE = 'celebrate', _('Celebrate')
        SUPPORT = 'support', _('Support')
        INSIGHTFUL = 'insightful', _('Insightful')

    news = models.ForeignKey(
        News,
        verbose_name=_('news'),
        on_delete=models.CASCADE,
        related_name='reactions'
    )
    user = models.ForeignKey(
        'accounts.User',
        verbose_name=_('user'),
        on_delete=models.CASCADE,
        related_name='news_reactions'
    )
    type = models.CharField(
        _('type'),
        max_length=20,
        choices=ReactionType.choices
    )
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)

    class Meta:
        verbose_name = _('reaction')
        verbose_name_plural = _('reactions')
        unique_together = ['news', 'user']

    def __str__(self):
        return f"{self.user} - {self.get_type_display()} on {self.news}"
