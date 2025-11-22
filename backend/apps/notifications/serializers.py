"""
Serializers for notifications app.
"""
from rest_framework import serializers

from .models import Notification, NotificationSettings


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for notifications."""
    type_display = serializers.CharField(source='get_type_display', read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'type', 'type_display', 'title', 'message',
                  'link', 'is_read', 'created_at']


class NotificationSettingsSerializer(serializers.ModelSerializer):
    """Serializer for notification settings."""

    class Meta:
        model = NotificationSettings
        fields = ['birthdays_enabled', 'achievements_enabled', 'news_enabled',
                  'comments_enabled', 'reactions_enabled', 'email_enabled']
