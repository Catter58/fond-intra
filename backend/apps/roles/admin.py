"""
Admin configuration for roles app.
"""
from django.contrib import admin

from .models import Permission, Role


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    """Admin configuration for Permission model."""
    list_display = ('codename', 'name', 'category')
    list_filter = ('category',)
    search_fields = ('codename', 'name', 'description')
    ordering = ('category', 'codename')


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    """Admin configuration for Role model."""
    list_display = ('name', 'is_system', 'created_at')
    list_filter = ('is_system',)
    search_fields = ('name', 'description')
    filter_horizontal = ('permissions',)
