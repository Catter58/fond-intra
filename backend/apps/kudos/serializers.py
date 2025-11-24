"""
Serializers for kudos app.
"""
from rest_framework import serializers
from .models import Kudos


class KudosSenderRecipientSerializer(serializers.Serializer):
    """Simplified user serializer for kudos."""
    id = serializers.IntegerField()
    full_name = serializers.CharField(source='get_full_name')
    avatar = serializers.SerializerMethodField()
    position = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()

    def get_avatar(self, obj):
        if obj.avatar:
            return obj.avatar.url
        return None

    def get_position(self, obj):
        if obj.position:
            return obj.position.name
        return None

    def get_department(self, obj):
        if obj.department:
            return obj.department.name
        return None


class KudosSerializer(serializers.ModelSerializer):
    """Serializer for reading kudos."""
    sender = KudosSenderRecipientSerializer(read_only=True)
    recipient = KudosSenderRecipientSerializer(read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = Kudos
        fields = [
            'id', 'sender', 'recipient', 'category', 'category_display',
            'message', 'is_public', 'created_at'
        ]
        read_only_fields = ['id', 'sender', 'created_at']


class KudosCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating kudos."""

    class Meta:
        model = Kudos
        fields = ['recipient', 'category', 'message', 'is_public']

    def validate_recipient(self, value):
        request = self.context.get('request')
        if request and request.user == value:
            raise serializers.ValidationError('Нельзя отправить благодарность самому себе.')
        return value

    def create(self, validated_data):
        validated_data['sender'] = self.context['request'].user
        return super().create(validated_data)


class KudosCategorySerializer(serializers.Serializer):
    """Serializer for kudos categories."""
    value = serializers.CharField()
    label = serializers.CharField()
