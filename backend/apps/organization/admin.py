"""
Admin configuration for organization app.
"""
from django.contrib import admin

from .models import Department, Position


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    """Admin configuration for Department model."""
    list_display = ('name', 'parent', 'head', 'order')
    list_filter = ('parent',)
    search_fields = ('name', 'description')
    raw_id_fields = ('parent', 'head')
    ordering = ('order', 'name')


@admin.register(Position)
class PositionAdmin(admin.ModelAdmin):
    """Admin configuration for Position model."""
    list_display = ('name', 'level')
    search_fields = ('name', 'description')
    ordering = ('-level', 'name')
