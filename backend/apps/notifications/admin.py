"""
Admin configuration for notifications app.
"""
from django.contrib import admin

from .models import Notification, NotificationSettings


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """Admin configuration for Notification model."""
    list_display = ('user', 'type', 'title', 'is_read', 'created_at')
    list_filter = ('type', 'is_read', 'created_at')
    search_fields = ('user__email', 'title', 'message')
    raw_id_fields = ('user',)
    date_hierarchy = 'created_at'


@admin.register(NotificationSettings)
class NotificationSettingsAdmin(admin.ModelAdmin):
    """Admin configuration for NotificationSettings model."""
    list_display = (
        'user', 'birthdays_enabled', 'achievements_enabled',
        'news_enabled', 'email_enabled'
    )
    list_filter = ('birthdays_enabled', 'achievements_enabled', 'email_enabled')
    search_fields = ('user__email',)
    raw_id_fields = ('user',)
