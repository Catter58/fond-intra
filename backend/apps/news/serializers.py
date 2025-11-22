"""
Serializers for news app.
"""
from rest_framework import serializers

from apps.accounts.serializers import UserBasicSerializer
from .models import News, NewsAttachment, Comment, Reaction


class NewsAttachmentSerializer(serializers.ModelSerializer):
    """Serializer for news attachments."""

    class Meta:
        model = NewsAttachment
        fields = ['id', 'file', 'file_name', 'file_type', 'file_size', 'uploaded_at']
        read_only_fields = ['file_name', 'file_type', 'file_size', 'uploaded_at']


class ReactionSerializer(serializers.ModelSerializer):
    """Serializer for reactions."""
    user = UserBasicSerializer(read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)

    class Meta:
        model = Reaction
        fields = ['id', 'user', 'type', 'type_display', 'created_at']


class CommentSerializer(serializers.ModelSerializer):
    """Serializer for comments."""
    author = UserBasicSerializer(read_only=True)
    replies = serializers.SerializerMethodField()
    replies_count = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'author', 'parent', 'content', 'created_at',
                  'updated_at', 'replies', 'replies_count']

    def get_replies(self, obj):
        if obj.parent is None:  # Only get replies for top-level comments
            replies = obj.replies.select_related('author')[:5]
            return CommentSerializer(replies, many=True).data
        return []

    def get_replies_count(self, obj):
        return obj.replies.count()


class CommentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating comments."""

    class Meta:
        model = Comment
        fields = ['content', 'parent']

    def validate_content(self, value):
        if not value or len(value.strip()) < 1:
            raise serializers.ValidationError("Comment cannot be empty.")
        return value


class NewsListSerializer(serializers.ModelSerializer):
    """Serializer for news list."""
    author = UserBasicSerializer(read_only=True)
    comments_count = serializers.IntegerField(read_only=True)
    reactions_count = serializers.SerializerMethodField()
    reactions_summary = serializers.SerializerMethodField()
    user_reaction = serializers.SerializerMethodField()

    class Meta:
        model = News
        fields = ['id', 'title', 'content', 'author', 'is_pinned',
                  'created_at', 'updated_at', 'comments_count',
                  'reactions_count', 'reactions_summary', 'user_reaction']

    def get_reactions_count(self, obj):
        return obj.reactions.count()

    def get_reactions_summary(self, obj):
        return {r['type']: r['count'] for r in obj.get_reactions_summary()}

    def get_user_reaction(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            reaction = obj.reactions.filter(user=request.user).first()
            if reaction:
                return reaction.type
        return None


class NewsDetailSerializer(serializers.ModelSerializer):
    """Serializer for news detail."""
    author = UserBasicSerializer(read_only=True)
    attachments = NewsAttachmentSerializer(many=True, read_only=True)
    reactions_summary = serializers.SerializerMethodField()
    user_reaction = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    reactions_count = serializers.SerializerMethodField()

    class Meta:
        model = News
        fields = ['id', 'title', 'content', 'author', 'is_pinned',
                  'is_published', 'created_at', 'updated_at',
                  'attachments', 'reactions_summary', 'user_reaction',
                  'comments_count', 'reactions_count']

    def get_comments_count(self, obj):
        return obj.comments.count()

    def get_reactions_count(self, obj):
        return obj.reactions.count()

    def get_reactions_summary(self, obj):
        return {r['type']: r['count'] for r in obj.get_reactions_summary()}

    def get_user_reaction(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            reaction = obj.reactions.filter(user=request.user).first()
            if reaction:
                return reaction.type
        return None


class NewsCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating news."""

    class Meta:
        model = News
        fields = ['title', 'content', 'is_published']

    def validate_title(self, value):
        if len(value) < 5:
            raise serializers.ValidationError(
                "Title must be at least 5 characters."
            )
        return value


class NewsUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating news."""

    class Meta:
        model = News
        fields = ['title', 'content', 'is_published']
