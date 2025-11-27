"""
Serializers for news app.
"""
import json

from rest_framework import serializers

from apps.accounts.serializers import UserBasicSerializer
from .models import News, NewsAttachment, Comment, Reaction, Tag


class TagSerializer(serializers.ModelSerializer):
    """Serializer for tags."""

    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug', 'color']
        read_only_fields = ['id', 'slug']


class TagCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating tags."""
    slug = serializers.SlugField(required=False)

    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug', 'color']
        read_only_fields = ['id']

    def validate_name(self, value):
        if len(value) < 2:
            raise serializers.ValidationError("Tag name must be at least 2 characters.")
        return value

    def create(self, validated_data):
        # Auto-generate slug if not provided
        if 'slug' not in validated_data or not validated_data['slug']:
            from django.utils.text import slugify
            validated_data['slug'] = slugify(validated_data['name'])
        return super().create(validated_data)


class NewsAttachmentSerializer(serializers.ModelSerializer):
    """Serializer for news attachments."""
    is_image = serializers.BooleanField(read_only=True)

    class Meta:
        model = NewsAttachment
        fields = [
            'id', 'file', 'thumbnail', 'file_name', 'file_type',
            'file_size', 'order', 'is_cover', 'is_image', 'uploaded_at'
        ]
        read_only_fields = [
            'file_name', 'file_type', 'file_size', 'thumbnail',
            'is_image', 'uploaded_at'
        ]


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
    tags = TagSerializer(many=True, read_only=True)
    comments_count = serializers.IntegerField(read_only=True)
    reactions_count = serializers.SerializerMethodField()
    reactions_summary = serializers.SerializerMethodField()
    user_reaction = serializers.SerializerMethodField()
    cover_image = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = News
        fields = ['id', 'title', 'content', 'author', 'tags', 'is_pinned',
                  'status', 'status_display', 'publish_at',
                  'created_at', 'updated_at', 'comments_count',
                  'reactions_count', 'reactions_summary', 'user_reaction',
                  'cover_image']

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

    def get_cover_image(self, obj):
        cover = obj.get_cover_image()
        if cover:
            request = self.context.get('request')
            return {
                'id': cover.id,
                'file': request.build_absolute_uri(cover.file.url) if request else cover.file.url,
                'thumbnail': request.build_absolute_uri(cover.thumbnail.url) if request and cover.thumbnail else None,
            }
        return None


class NewsDetailSerializer(serializers.ModelSerializer):
    """Serializer for news detail."""
    author = UserBasicSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    attachments = NewsAttachmentSerializer(many=True, read_only=True)
    images = serializers.SerializerMethodField()
    reactions_summary = serializers.SerializerMethodField()
    user_reaction = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    reactions_count = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = News
        fields = ['id', 'title', 'content', 'author', 'tags', 'is_pinned',
                  'is_published', 'status', 'status_display', 'publish_at',
                  'created_at', 'updated_at',
                  'attachments', 'images', 'reactions_summary', 'user_reaction',
                  'comments_count', 'reactions_count']

    def get_images(self, obj):
        """Get only image attachments for gallery."""
        images = obj.get_images()
        return NewsAttachmentSerializer(images, many=True, context=self.context).data

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
    tag_ids = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        default=''
    )

    class Meta:
        model = News
        fields = ['id', 'title', 'content', 'status', 'publish_at', 'is_pinned', 'tag_ids']
        read_only_fields = ['id']

    def validate_tag_ids(self, value):
        """Parse JSON string to list of integers."""
        if not value:
            return []
        if isinstance(value, list):
            # Already a list (from JSON body)
            return [int(x) for x in value if str(x).isdigit()]
        if isinstance(value, str):
            try:
                parsed = json.loads(value)
                if isinstance(parsed, list):
                    return [int(x) for x in parsed if str(x).isdigit()]
            except (json.JSONDecodeError, ValueError):
                pass
        return []

    def validate_title(self, value):
        if len(value) < 5:
            raise serializers.ValidationError(
                "Заголовок должен содержать минимум 5 символов."
            )
        return value

    def validate_content(self, value):
        """Validate Editor.js JSON content."""
        # Parse JSON string if received from FormData
        if isinstance(value, str):
            try:
                value = json.loads(value)
            except json.JSONDecodeError:
                raise serializers.ValidationError("Некорректный формат содержимого.")

        if not isinstance(value, dict):
            raise serializers.ValidationError("Некорректный формат содержимого.")
        if 'blocks' not in value:
            raise serializers.ValidationError("Содержимое не может быть пустым.")
        if not isinstance(value.get('blocks'), list):
            raise serializers.ValidationError("Некорректный формат содержимого.")
        return value

    def create(self, validated_data):
        tag_ids = validated_data.pop('tag_ids', [])
        news = super().create(validated_data)
        if tag_ids:
            news.tags.set(tag_ids)
        return news


class NewsUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating news."""
    tag_ids = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True
    )

    class Meta:
        model = News
        fields = ['title', 'content', 'status', 'publish_at', 'is_pinned', 'tag_ids']

    def validate_tag_ids(self, value):
        """Parse JSON string to list of integers."""
        if not value:
            return []
        if isinstance(value, list):
            return [int(x) for x in value if str(x).isdigit()]
        if isinstance(value, str):
            try:
                parsed = json.loads(value)
                if isinstance(parsed, list):
                    return [int(x) for x in parsed if str(x).isdigit()]
            except (json.JSONDecodeError, ValueError):
                pass
        return []

    def validate_content(self, value):
        """Validate Editor.js JSON content."""
        # Parse JSON string if received from FormData
        if isinstance(value, str):
            try:
                value = json.loads(value)
            except json.JSONDecodeError:
                raise serializers.ValidationError("Некорректный формат содержимого.")

        if not isinstance(value, dict):
            raise serializers.ValidationError("Некорректный формат содержимого.")
        if 'blocks' not in value:
            raise serializers.ValidationError("Содержимое не может быть пустым.")
        if not isinstance(value.get('blocks'), list):
            raise serializers.ValidationError("Некорректный формат содержимого.")
        return value

    def update(self, instance, validated_data):
        tag_ids = validated_data.pop('tag_ids', None)
        instance = super().update(instance, validated_data)
        if tag_ids is not None:
            instance.tags.set(tag_ids)
        return instance
