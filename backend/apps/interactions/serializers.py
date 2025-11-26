"""
Serializers for interactions app.
"""
from rest_framework import serializers
from apps.accounts.serializers import UserListSerializer
from apps.news.models import News
from apps.accounts.models import User
from .models import Bookmark, ViewHistory, ProfileView


class BookmarkSerializer(serializers.ModelSerializer):
    """Serializer for bookmarks."""

    class Meta:
        model = Bookmark
        fields = ['id', 'content_type', 'object_id', 'created_at']
        read_only_fields = ['id', 'created_at']


class BookmarkCreateSerializer(serializers.Serializer):
    """Serializer for creating/toggling bookmarks."""
    content_type = serializers.ChoiceField(choices=Bookmark.ContentType.choices)
    object_id = serializers.IntegerField()

    def validate(self, attrs):
        content_type = attrs['content_type']
        object_id = attrs['object_id']

        # Verify object exists
        if content_type == Bookmark.ContentType.USER:
            if not User.objects.filter(id=object_id, is_active=True).exists():
                raise serializers.ValidationError({'object_id': 'Пользователь не найден'})
        elif content_type == Bookmark.ContentType.NEWS:
            if not News.objects.filter(id=object_id, status='published').exists():
                raise serializers.ValidationError({'object_id': 'Новость не найдена'})

        return attrs


class BookmarkedUserSerializer(serializers.ModelSerializer):
    """Serializer for bookmarked users with bookmark info."""
    full_name = serializers.SerializerMethodField()
    bookmark_id = serializers.IntegerField(source='bookmark.id', read_only=True)
    bookmarked_at = serializers.DateTimeField(source='bookmark.created_at', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'full_name', 'avatar',
                  'department', 'position', 'bookmark_id', 'bookmarked_at']

    def get_full_name(self, obj):
        return obj.get_full_name()

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.department:
            data['department'] = {'id': instance.department.id, 'name': instance.department.name}
        if instance.position:
            data['position'] = {'id': instance.position.id, 'name': instance.position.name}
        # Handle avatar URL
        if instance.avatar:
            data['avatar'] = instance.avatar.url
        else:
            data['avatar'] = None
        return data


class BookmarkedNewsSerializer(serializers.Serializer):
    """Serializer for bookmarked news with bookmark info."""
    id = serializers.IntegerField()
    title = serializers.CharField()
    excerpt = serializers.CharField()
    cover_image = serializers.CharField(allow_null=True)
    published_at = serializers.DateTimeField()
    author = serializers.SerializerMethodField()
    bookmark_id = serializers.IntegerField()
    bookmarked_at = serializers.DateTimeField()

    def get_author(self, obj):
        author = obj.get('author')
        if author:
            return {
                'id': author.id,
                'full_name': author.get_full_name(),
                'avatar': author.avatar.url if author.avatar else None
            }
        return None


class ViewHistorySerializer(serializers.ModelSerializer):
    """Serializer for view history."""
    viewed_user = UserListSerializer(read_only=True)

    class Meta:
        model = ViewHistory
        fields = ['id', 'viewed_user', 'viewed_at']


class ProfileStatsSerializer(serializers.Serializer):
    """Serializer for profile statistics."""
    profile_views = serializers.IntegerField()
    achievements_count = serializers.IntegerField()
    kudos_received = serializers.IntegerField()
    kudos_sent = serializers.IntegerField()
    skills_count = serializers.IntegerField()
    endorsements_received = serializers.IntegerField()
    news_count = serializers.IntegerField()
    comments_count = serializers.IntegerField()
