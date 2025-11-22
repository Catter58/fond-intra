"""
Serializers for roles app.
"""
from rest_framework import serializers

from .models import Permission, Role


class PermissionSerializer(serializers.ModelSerializer):
    """Serializer for permissions."""
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = Permission
        fields = ['id', 'codename', 'name', 'description', 'category', 'category_display']


class RoleSerializer(serializers.ModelSerializer):
    """Serializer for roles."""
    permissions = PermissionSerializer(many=True, read_only=True)
    users_count = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = ['id', 'name', 'description', 'permissions', 'is_system',
                  'users_count', 'created_at']

    def get_users_count(self, obj):
        return obj.users.count()


class RoleListSerializer(serializers.ModelSerializer):
    """Brief serializer for role list."""
    permissions_count = serializers.SerializerMethodField()
    users_count = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = ['id', 'name', 'description', 'is_system',
                  'permissions_count', 'users_count']

    def get_permissions_count(self, obj):
        return obj.permissions.count()

    def get_users_count(self, obj):
        return obj.users.count()


class RoleCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating roles."""
    permissions = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Permission.objects.all(),
        required=False
    )

    class Meta:
        model = Role
        fields = ['name', 'description', 'permissions']

    def validate_name(self, value):
        # Check uniqueness
        instance = self.instance
        if Role.objects.filter(name=value).exclude(pk=instance.pk if instance else None).exists():
            raise serializers.ValidationError("Role with this name already exists.")
        return value
