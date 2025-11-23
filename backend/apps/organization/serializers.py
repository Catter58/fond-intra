"""
Serializers for organization app.
"""
from rest_framework import serializers

from .models import Department, Position


class PositionSerializer(serializers.ModelSerializer):
    """Serializer for Position model."""

    class Meta:
        model = Position
        fields = ['id', 'name', 'description', 'level']


class DepartmentSerializer(serializers.ModelSerializer):
    """Serializer for Department model."""
    head_name = serializers.CharField(source='head.get_full_name', read_only=True)
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    employees_count = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = ['id', 'name', 'description', 'parent', 'parent_name',
                  'head', 'head_name', 'order', 'employees_count']

    def get_employees_count(self, obj):
        return obj.employees.filter(is_active=True, is_archived=False).count()


class DepartmentCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating departments."""

    class Meta:
        model = Department
        fields = ['name', 'description', 'parent', 'head', 'order']

    def validate_parent(self, value):
        if value and self.instance:
            # Prevent circular reference
            if value.id == self.instance.id:
                raise serializers.ValidationError(
                    "Department cannot be its own parent."
                )
            # Check if parent is a descendant
            descendants = self.instance.get_descendants()
            if value in descendants:
                raise serializers.ValidationError(
                    "Cannot set a descendant as parent."
                )
        return value


class DepartmentTreeSerializer(serializers.ModelSerializer):
    """Serializer for department tree with nested children."""
    children = serializers.SerializerMethodField()
    head_name = serializers.CharField(source='head.get_full_name', read_only=True)
    employees_count = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = ['id', 'name', 'head', 'head_name', 'employees_count', 'children']

    def get_children(self, obj):
        children = obj.children.all()
        return DepartmentTreeSerializer(children, many=True).data

    def get_employees_count(self, obj):
        return obj.employees.filter(is_active=True, is_archived=False).count()


class PositionCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating positions."""

    class Meta:
        model = Position
        fields = ['name', 'description', 'level']
