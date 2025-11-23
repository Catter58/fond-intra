"""
Serializers for audit app.
"""
from rest_framework import serializers

from apps.accounts.serializers import UserBasicSerializer
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    """Serializer for audit logs."""
    user = UserBasicSerializer(read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model = AuditLog
        fields = ['id', 'user', 'action', 'action_display', 'entity_type',
                  'entity_id', 'entity_repr', 'old_values', 'new_values',
                  'ip_address', 'created_at']


class AuditLogListSerializer(serializers.ModelSerializer):
    """Brief serializer for audit log list."""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model = AuditLog
        fields = ['id', 'user_name', 'action', 'action_display', 'entity_type',
                  'entity_id', 'entity_repr', 'created_at']
