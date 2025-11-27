"""
Serializers for achievements app.
"""
from rest_framework import serializers

from apps.accounts.serializers import UserBasicSerializer
from .models import Achievement, AchievementAward


class AchievementSerializer(serializers.ModelSerializer):
    """Serializer for Achievement type."""
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    trigger_type_display = serializers.CharField(source='get_trigger_type_display', read_only=True)
    awards_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Achievement
        fields = ['id', 'name', 'description', 'icon', 'category',
                  'category_display', 'is_active', 'awards_count',
                  'is_automatic', 'trigger_type', 'trigger_type_display', 'trigger_value']


class AchievementCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating achievement types."""

    class Meta:
        model = Achievement
        fields = ['name', 'description', 'icon', 'category', 'is_active',
                  'is_automatic', 'trigger_type', 'trigger_value']

    def validate(self, data):
        """Validate that automatic achievements have trigger_type and trigger_value."""
        is_automatic = data.get('is_automatic', False)
        trigger_type = data.get('trigger_type')
        trigger_value = data.get('trigger_value')

        if is_automatic:
            if not trigger_type:
                raise serializers.ValidationError({
                    'trigger_type': 'Trigger type is required for automatic achievements.'
                })
            if not trigger_value or trigger_value <= 0:
                raise serializers.ValidationError({
                    'trigger_value': 'Trigger value must be positive for automatic achievements.'
                })
        elif trigger_type or trigger_value:
            # If not automatic, clear trigger fields
            data['trigger_type'] = None
            data['trigger_value'] = None

        return data


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


class LeaderboardEntrySerializer(serializers.Serializer):
    """Serializer for leaderboard entry."""
    rank = serializers.IntegerField()
    user = UserBasicSerializer()
    count = serializers.IntegerField()
    recent_achievement = AchievementSerializer(allow_null=True)
