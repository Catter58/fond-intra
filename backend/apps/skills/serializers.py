"""
Serializers for skills app.
"""
from rest_framework import serializers

from .models import SkillCategory, Skill, UserSkill, SkillEndorsement


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
    endorsements_count = serializers.IntegerField(read_only=True)
    is_endorsed_by_current_user = serializers.SerializerMethodField()

    class Meta:
        model = UserSkill
        fields = [
            'id', 'skill', 'skill_name', 'skill_category',
            'level', 'level_display', 'endorsements_count',
            'is_endorsed_by_current_user'
        ]

    def get_is_endorsed_by_current_user(self, obj):
        """Check if current user has endorsed this skill."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.endorsements.filter(endorsed_by=request.user).exists()
        return False


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


class EndorserSerializer(serializers.Serializer):
    """Serializer for endorser basic info."""
    id = serializers.IntegerField()
    full_name = serializers.SerializerMethodField()
    avatar = serializers.CharField()
    position = serializers.CharField(source='position.name', allow_null=True)

    def get_full_name(self, obj):
        """Get full name of the user."""
        return f"{obj.first_name} {obj.last_name}"


class SkillEndorsementSerializer(serializers.ModelSerializer):
    """Serializer for SkillEndorsement."""
    endorsed_by_details = EndorserSerializer(source='endorsed_by', read_only=True)
    skill_name = serializers.CharField(source='user_skill.skill.name', read_only=True)
    user_name = serializers.CharField(source='user_skill.user.full_name', read_only=True)

    class Meta:
        model = SkillEndorsement
        fields = [
            'id', 'user_skill', 'endorsed_by', 'endorsed_by_details',
            'skill_name', 'user_name', 'created_at'
        ]
        read_only_fields = ['created_at']


class SkillEndorsementCreateSerializer(serializers.Serializer):
    """Serializer for creating skill endorsement."""
    user_id = serializers.IntegerField()
    skill_id = serializers.IntegerField()

    def validate(self, data):
        """Validate endorsement data."""
        from apps.accounts.models import User

        user_id = data.get('user_id')
        skill_id = data.get('skill_id')
        endorsed_by = self.context['request'].user

        # Check if user exists
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found.")

        # Check if skill exists
        try:
            skill = Skill.objects.get(id=skill_id)
        except Skill.DoesNotExist:
            raise serializers.ValidationError("Skill not found.")

        # Check if user has this skill
        try:
            user_skill = UserSkill.objects.get(user=user, skill=skill)
        except UserSkill.DoesNotExist:
            raise serializers.ValidationError("User does not have this skill.")

        # Check if user is trying to endorse their own skill
        if user == endorsed_by:
            raise serializers.ValidationError("You cannot endorse your own skills.")

        # Check if already endorsed
        if SkillEndorsement.objects.filter(user_skill=user_skill, endorsed_by=endorsed_by).exists():
            raise serializers.ValidationError("You have already endorsed this skill.")

        data['user_skill'] = user_skill
        return data
