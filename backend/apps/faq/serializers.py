"""
FAQ serializers.
"""
from rest_framework import serializers
from .models import FAQCategory, FAQItem


class FAQItemSerializer(serializers.ModelSerializer):
    """Serializer for FAQ item."""

    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = FAQItem
        fields = [
            'id',
            'category',
            'category_name',
            'question',
            'answer',
            'order',
            'is_published',
            'views_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['views_count', 'created_at', 'updated_at']


class FAQCategorySerializer(serializers.ModelSerializer):
    """Serializer for FAQ category."""

    items_count = serializers.SerializerMethodField()

    class Meta:
        model = FAQCategory
        fields = [
            'id',
            'name',
            'slug',
            'description',
            'icon',
            'order',
            'is_active',
            'items_count',
        ]

    def get_items_count(self, obj):
        return obj.items.filter(is_published=True).count()


class FAQCategoryWithItemsSerializer(serializers.ModelSerializer):
    """Serializer for FAQ category with nested items."""

    items = serializers.SerializerMethodField()

    class Meta:
        model = FAQCategory
        fields = [
            'id',
            'name',
            'slug',
            'description',
            'icon',
            'order',
            'items',
        ]

    def get_items(self, obj):
        items = obj.items.filter(is_published=True).order_by('order', 'question')
        return FAQItemSerializer(items, many=True).data


class FAQItemCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating FAQ items."""

    class Meta:
        model = FAQItem
        fields = [
            'id',
            'category',
            'question',
            'answer',
            'order',
            'is_published',
        ]


class FAQCategoryCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating FAQ categories."""

    class Meta:
        model = FAQCategory
        fields = [
            'id',
            'name',
            'slug',
            'description',
            'icon',
            'order',
            'is_active',
        ]
        extra_kwargs = {
            'slug': {'required': False},
        }
