"""
Admin configuration for skills app.
"""
from django.contrib import admin

from .models import SkillCategory, Skill, UserSkill, SkillEndorsement


@admin.register(SkillCategory)
class SkillCategoryAdmin(admin.ModelAdmin):
    """Admin configuration for SkillCategory model."""
    list_display = ('name', 'order')
    search_fields = ('name',)
    ordering = ('order', 'name')


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    """Admin configuration for Skill model."""
    list_display = ('name', 'category')
    list_filter = ('category',)
    search_fields = ('name', 'description')


@admin.register(UserSkill)
class UserSkillAdmin(admin.ModelAdmin):
    """Admin configuration for UserSkill model."""
    list_display = ('user', 'skill', 'level', 'endorsements_count')
    list_filter = ('level', 'skill__category')
    search_fields = ('user__email', 'user__first_name', 'skill__name')
    raw_id_fields = ('user', 'skill')


@admin.register(SkillEndorsement)
class SkillEndorsementAdmin(admin.ModelAdmin):
    """Admin configuration for SkillEndorsement model."""
    list_display = ('user_skill', 'endorsed_by', 'created_at')
    list_filter = ('created_at',)
    search_fields = (
        'user_skill__user__email',
        'user_skill__user__first_name',
        'user_skill__skill__name',
        'endorsed_by__email',
        'endorsed_by__first_name'
    )
    raw_id_fields = ('user_skill', 'endorsed_by')
    readonly_fields = ('created_at',)
