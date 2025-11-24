"""
Classifieds serializers.
"""
from rest_framework import serializers
from .models import ClassifiedCategory, Classified, ClassifiedImage


class ClassifiedImageSerializer(serializers.ModelSerializer):
    """Serializer for classified image."""

    class Meta:
        model = ClassifiedImage
        fields = ['id', 'image', 'order', 'uploaded_at']
        read_only_fields = ['uploaded_at']


class ClassifiedAuthorSerializer(serializers.Serializer):
    """Nested serializer for classified author."""

    id = serializers.IntegerField()
    full_name = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()
    phone_work = serializers.CharField(allow_blank=True)
    telegram = serializers.CharField(allow_blank=True)

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_avatar(self, obj):
        if obj.avatar:
            return obj.avatar.url
        return None

    def get_department(self, obj):
        if obj.department:
            return obj.department.name
        return None


class ClassifiedCategorySerializer(serializers.ModelSerializer):
    """Serializer for classified category."""

    classifieds_count = serializers.SerializerMethodField()

    class Meta:
        model = ClassifiedCategory
        fields = ['id', 'name', 'slug', 'icon', 'order', 'classifieds_count']

    def get_classifieds_count(self, obj):
        return obj.classifieds.filter(status='active').count()


class ClassifiedListSerializer(serializers.ModelSerializer):
    """Serializer for classified list."""

    author = ClassifiedAuthorSerializer(read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    images_count = serializers.SerializerMethodField()
    first_image = serializers.SerializerMethodField()

    class Meta:
        model = Classified
        fields = [
            'id',
            'title',
            'description',
            'category',
            'category_name',
            'author',
            'price',
            'status',
            'status_display',
            'views_count',
            'images_count',
            'first_image',
            'expires_at',
            'created_at',
        ]

    def get_images_count(self, obj):
        return obj.images.count()

    def get_first_image(self, obj):
        first_image = obj.images.first()
        if first_image:
            return first_image.image.url
        return None


class ClassifiedDetailSerializer(serializers.ModelSerializer):
    """Serializer for classified detail."""

    author = ClassifiedAuthorSerializer(read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    images = ClassifiedImageSerializer(many=True, read_only=True)

    class Meta:
        model = Classified
        fields = [
            'id',
            'title',
            'description',
            'category',
            'category_name',
            'author',
            'contact_info',
            'price',
            'status',
            'status_display',
            'views_count',
            'images',
            'expires_at',
            'created_at',
            'updated_at',
        ]


class ClassifiedCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating classified."""

    class Meta:
        model = Classified
        fields = [
            'id',
            'title',
            'description',
            'category',
            'contact_info',
            'price',
        ]

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)
