"""
Admin configuration for audit app.
"""
from django.contrib import admin

from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    """Admin configuration for AuditLog model."""
    list_display = ('user', 'action', 'entity_type', 'entity_id', 'ip_address', 'created_at')
    list_filter = ('action', 'entity_type', 'created_at')
    search_fields = ('user__email', 'entity_type', 'entity_repr')
    raw_id_fields = ('user',)
    date_hierarchy = 'created_at'
    readonly_fields = (
        'user', 'action', 'entity_type', 'entity_id', 'entity_repr',
        'old_values', 'new_values', 'ip_address', 'user_agent', 'created_at'
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
