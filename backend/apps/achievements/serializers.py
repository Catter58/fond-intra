"""
Serializers for achievements app.
"""
from rest_framework import serializers

from apps.accounts.serializers import UserBasicSerializer
from .models import Achievement, AchievementAward


class AchievementSerializer(serializers.ModelSerializer):
    """Serializer for Achievement type."""
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    awards_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Achievement
        fields = ['id', 'name', 'description', 'icon', 'category',
                  'category_display', 'is_active', 'awards_count']


class AchievementCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating achievement types."""

    class Meta:
        model = Achievement
        fields = ['name', 'description', 'icon', 'category', 'is_active']


class AchievementAwardSerializer(serializers.ModelSerializer):
    """Serializer for achievement awards."""
    achievement = AchievementSerializer(read_only=True)
    recipient = UserBasicSerializer(read_only=True)
    awarded_by = UserBasicSerializer(read_only=True)

    class Meta:
        model = AchievementAward
        fields = ['id', 'achievement', 'recipient', 'awarded_by',
                  'comment', 'awarded_at']


class AchievementAwardCreateSerializer(serializers.ModelSerializer):
    """Serializer for awarding achievements."""

    class Meta:
        model = AchievementAward
        fields = ['achievement', 'recipient', 'comment']

    def validate_achievement(self, value):
        if not value.is_active:
            raise serializers.ValidationError("This achievement is not active.")
        return value

    def validate_comment(self, value):
        if not value or len(value.strip()) < 10:
            raise serializers.ValidationError(
                "Comment must be at least 10 characters."
            )
        return value


class AchievementFeedSerializer(serializers.ModelSerializer):
    """Serializer for achievement feed."""
    achievement = AchievementSerializer(read_only=True)
    recipient = UserBasicSerializer(read_only=True)
    awarded_by = UserBasicSerializer(read_only=True)

    class Meta:
        model = AchievementAward
        fields = ['id', 'achievement', 'recipient', 'awarded_by', 'comment', 'awarded_at']


class UserAchievementSerializer(serializers.ModelSerializer):
    """Serializer for user's achievements."""
    achievement = AchievementSerializer(read_only=True)
    awarded_by = UserBasicSerializer(read_only=True)

    class Meta:
        model = AchievementAward
        fields = ['id', 'achievement', 'awarded_by', 'comment', 'awarded_at']
