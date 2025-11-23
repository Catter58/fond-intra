"""
Serializers for skills app.
"""
from rest_framework import serializers

from .models import SkillCategory, Skill, UserSkill


class SkillCategorySerializer(serializers.ModelSerializer):
    """Serializer for SkillCategory."""
    skills_count = serializers.SerializerMethodField()

    class Meta:
        model = SkillCategory
        fields = ['id', 'name', 'description', 'order', 'skills_count']

    def get_skills_count(self, obj):
        return obj.skills.count()


class SkillSerializer(serializers.ModelSerializer):
    """Serializer for Skill."""
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Skill
        fields = ['id', 'name', 'category', 'category_name', 'description']


class SkillCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating skills (admin only)."""

    class Meta:
        model = Skill
        fields = ['name', 'category', 'description']


class UserSkillSerializer(serializers.ModelSerializer):
    """Serializer for UserSkill."""
    skill_name = serializers.CharField(source='skill.name', read_only=True)
    skill_category = serializers.CharField(source='skill.category.name', read_only=True)
    level_display = serializers.CharField(source='get_level_display', read_only=True)

    class Meta:
        model = UserSkill
        fields = ['id', 'skill', 'skill_name', 'skill_category', 'level', 'level_display']


class UserSkillCreateSerializer(serializers.ModelSerializer):
    """Serializer for adding skills to user."""

    class Meta:
        model = UserSkill
        fields = ['skill', 'level']

    def validate_skill(self, value):
        user = self.context['request'].user
        if UserSkill.objects.filter(user=user, skill=value).exists():
            raise serializers.ValidationError("You already have this skill.")
        return value
