"""
Admin configuration for news app.
"""
from django.contrib import admin

from .models import News, NewsAttachment, Comment, Reaction


class NewsAttachmentInline(admin.TabularInline):
    """Inline for news attachments."""
    model = NewsAttachment
    extra = 0


@admin.register(News)
class NewsAdmin(admin.ModelAdmin):
    """Admin configuration for News model."""
    list_display = ('title', 'author', 'is_pinned', 'is_published', 'created_at')
    list_filter = ('is_pinned', 'is_published', 'created_at')
    search_fields = ('title', 'content', 'author__email')
    raw_id_fields = ('author',)
    date_hierarchy = 'created_at'
    inlines = [NewsAttachmentInline]


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    """Admin configuration for Comment model."""
    list_display = ('author', 'news', 'parent', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('content', 'author__email', 'news__title')
    raw_id_fields = ('author', 'news', 'parent')


@admin.register(Reaction)
class ReactionAdmin(admin.ModelAdmin):
    """Admin configuration for Reaction model."""
    list_display = ('user', 'news', 'type', 'created_at')
    list_filter = ('type', 'created_at')
    search_fields = ('user__email', 'news__title')
    raw_id_fields = ('user', 'news')
