"""
Admin configuration for skills app.
"""
from django.contrib import admin

from .models import SkillCategory, Skill, UserSkill


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
    list_display = ('user', 'skill', 'level')
    list_filter = ('level', 'skill__category')
    search_fields = ('user__email', 'user__first_name', 'skill__name')
    raw_id_fields = ('user', 'skill')
