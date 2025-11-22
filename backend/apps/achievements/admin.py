"""
Admin configuration for achievements app.
"""
from django.contrib import admin

from .models import Achievement, AchievementAward


@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    """Admin configuration for Achievement model."""
    list_display = ('name', 'category', 'is_active', 'get_awards_count', 'created_by')
    list_filter = ('category', 'is_active')
    search_fields = ('name', 'description')
    raw_id_fields = ('created_by',)

    @admin.display(description='Awards')
    def get_awards_count(self, obj):
        return obj.awards.count()


@admin.register(AchievementAward)
class AchievementAwardAdmin(admin.ModelAdmin):
    """Admin configuration for AchievementAward model."""
    list_display = ('recipient', 'achievement', 'awarded_by', 'awarded_at')
    list_filter = ('achievement', 'awarded_at')
    search_fields = (
        'recipient__email', 'recipient__first_name',
        'awarded_by__email', 'achievement__name'
    )
    raw_id_fields = ('recipient', 'awarded_by', 'achievement')
    date_hierarchy = 'awarded_at'
