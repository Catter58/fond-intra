"""
Serializers for ideas app.
"""
from rest_framework import serializers
from .models import Idea, IdeaVote, IdeaComment


class IdeaAuthorSerializer(serializers.Serializer):
    """Serializer for idea author."""
    id = serializers.IntegerField()
    full_name = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    position = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_avatar(self, obj):
        if obj.avatar:
            return obj.avatar.url
        return None

    def get_position(self, obj):
        return obj.position.name if obj.position else None

    def get_department(self, obj):
        return obj.department.name if obj.department else None


class IdeaCommentSerializer(serializers.ModelSerializer):
    """Serializer for idea comments."""
    author = IdeaAuthorSerializer(read_only=True)

    class Meta:
        model = IdeaComment
        fields = ['id', 'author', 'text', 'created_at']
        read_only_fields = ['id', 'author', 'created_at']


class IdeaSerializer(serializers.ModelSerializer):
    """Serializer for ideas."""
    author = IdeaAuthorSerializer(read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    votes_score = serializers.IntegerField(read_only=True)
    upvotes_count = serializers.IntegerField(read_only=True)
    downvotes_count = serializers.IntegerField(read_only=True)
    comments_count = serializers.SerializerMethodField()
    user_vote = serializers.SerializerMethodField()

    class Meta:
        model = Idea
        fields = [
            'id', 'title', 'description', 'author', 'category', 'category_display',
            'status', 'status_display', 'admin_comment', 'votes_score',
            'upvotes_count', 'downvotes_count', 'comments_count', 'user_vote',
            'created_at', 'updated_at'
        ]

    def get_comments_count(self, obj):
        return obj.comments.count()

    def get_user_vote(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            vote = obj.votes.filter(user=request.user).first()
            if vote:
                return 'up' if vote.is_upvote else 'down'
        return None


class IdeaCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating ideas."""

    class Meta:
        model = Idea
        fields = ['title', 'description', 'category']

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)


class IdeaUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating ideas (by author)."""

    class Meta:
        model = Idea
        fields = ['title', 'description', 'category']


class IdeaStatusUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating idea status (by admin)."""

    class Meta:
        model = Idea
        fields = ['status', 'admin_comment']


class IdeaCommentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating comments."""

    class Meta:
        model = IdeaComment
        fields = ['text']

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        validated_data['idea'] = self.context['idea']
        return super().create(validated_data)


class IdeaCategorySerializer(serializers.Serializer):
    """Serializer for idea categories."""
    value = serializers.CharField()
    label = serializers.CharField()


class IdeaStatusSerializer(serializers.Serializer):
    """Serializer for idea statuses."""
    value = serializers.CharField()
    label = serializers.CharField()
