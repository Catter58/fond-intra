"""
News models: News, NewsAttachment, Comment, Reaction, Tag.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _

from core.utils import news_attachment_upload_path


class Tag(models.Model):
    """
    Tag for categorizing news posts.
    """
    name = models.CharField(_('name'), max_length=50, unique=True)
    slug = models.SlugField(_('slug'), max_length=50, unique=True)
    color = models.CharField(
        _('color'),
        max_length=20,
        default='gray',
        help_text='Tag color for display (gray, blue, green, red, purple, cyan, teal, magenta)'
    )
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)

    class Meta:
        verbose_name = _('tag')
        verbose_name_plural = _('tags')
        ordering = ['name']

    def __str__(self):
        return self.name


class News(models.Model):
    """
    News post model.
    """
    class Status(models.TextChoices):
        DRAFT = 'draft', _('Draft')
        SCHEDULED = 'scheduled', _('Scheduled')
        PUBLISHED = 'published', _('Published')

    title = models.CharField(_('title'), max_length=200)
    content = models.JSONField(
        _('content'),
        default=dict,
        help_text='Editor.js JSON content'
    )
    author = models.ForeignKey(
        'accounts.User',
        verbose_name=_('author'),
        on_delete=models.SET_NULL,
        null=True,
        related_name='news_posts'
    )
    tags = models.ManyToManyField(
        Tag,
        verbose_name=_('tags'),
        blank=True,
        related_name='news_posts'
    )
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT
    )
    is_pinned = models.BooleanField(_('pinned'), default=False)
    is_published = models.BooleanField(_('published'), default=True)
    publish_at = models.DateTimeField(_('publish at'), null=True, blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('news')
        verbose_name_plural = _('news')
        ordering = ['-is_pinned', '-created_at']

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        # Sync is_published with status for backward compatibility
        if self.status == self.Status.PUBLISHED:
            self.is_published = True
        else:
            self.is_published = False
        super().save(*args, **kwargs)

    def publish(self):
        """Publish the news post."""
        from django.utils import timezone
        self.status = self.Status.PUBLISHED
        self.is_published = True
        if not self.publish_at:
            self.publish_at = timezone.now()
        self.save()

    def get_reactions_summary(self):
        """Get count of each reaction type."""
        return self.reactions.values('type').annotate(
            count=models.Count('id')
        )

    def get_cover_image(self):
        """Get cover image or first image attachment."""
        cover = self.attachments.filter(is_cover=True).first()
        if cover:
            return cover
        # Fallback to first image
        return self.attachments.filter(
            file_type__startswith='image/'
        ).first()

    def get_images(self):
        """Get all image attachments."""
        return self.attachments.filter(
            file_type__startswith='image/'
        ).order_by('order', 'uploaded_at')


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
    thumbnail = models.ImageField(
        _('thumbnail'),
        upload_to='news/thumbnails/',
        blank=True,
        null=True
    )
    file_name = models.CharField(_('file name'), max_length=255)
    file_type = models.CharField(_('file type'), max_length=100)
    file_size = models.PositiveIntegerField(_('file size'), default=0)
    order = models.PositiveIntegerField(_('order'), default=0)
    is_cover = models.BooleanField(_('is cover image'), default=False)
    uploaded_at = models.DateTimeField(_('uploaded at'), auto_now_add=True)

    class Meta:
        verbose_name = _('news attachment')
        verbose_name_plural = _('news attachments')
        ordering = ['order', 'uploaded_at']

    def __str__(self):
        return self.file_name

    @property
    def is_image(self):
        """Check if attachment is an image."""
        image_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        return self.file_type in image_types

    def save(self, *args, **kwargs):
        # If this is set as cover, unset other covers for this news
        if self.is_cover and self.news_id:
            NewsAttachment.objects.filter(
                news_id=self.news_id,
                is_cover=True
            ).exclude(pk=self.pk).update(is_cover=False)
        super().save(*args, **kwargs)


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

    def get_mentioned_users(self):
        """Extract mentioned usernames from content.

        Mentions are in format @username or @full_name
        Returns a list of User objects.
        """
        import re
        from apps.accounts.models import User

        # Pattern: @ followed by word characters or quoted name
        # @username or @"Full Name"
        pattern = r'@(\w+)|@"([^"]+)"'
        matches = re.findall(pattern, self.content)

        usernames = []
        full_names = []
        for username, full_name in matches:
            if username:
                usernames.append(username)
            if full_name:
                full_names.append(full_name)

        # Find users by email prefix (username) or full name
        users = []
        if usernames:
            # Try to match username as email prefix
            for username in usernames:
                user = User.objects.filter(
                    email__istartswith=f'{username}@'
                ).first()
                if user and user not in users:
                    users.append(user)

        if full_names:
            for name in full_names:
                # Try exact match on full_name
                user = User.objects.filter(full_name__iexact=name).first()
                if user and user not in users:
                    users.append(user)

        return users


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
