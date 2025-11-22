"""
Admin configuration for accounts app.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import User, UserStatus


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin configuration for User model."""
    list_display = ('email', 'get_full_name', 'department', 'position', 'is_active', 'is_archived')
    list_filter = ('is_active', 'is_archived', 'is_staff', 'department', 'position')
    search_fields = ('email', 'first_name', 'last_name', 'patronymic')
    ordering = ('last_name', 'first_name')

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal info'), {
            'fields': ('first_name', 'last_name', 'patronymic', 'avatar', 'birth_date')
        }),
        (_('Contact info'), {
            'fields': ('phone_work', 'phone_personal', 'telegram')
        }),
        (_('Organization'), {
            'fields': ('department', 'position', 'manager', 'hire_date')
        }),
        (_('Permissions'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'roles'),
        }),
        (_('Archive'), {
            'fields': ('is_archived', 'archived_at'),
        }),
        (_('Important dates'), {
            'fields': ('last_login', 'date_joined'),
        }),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'password1', 'password2'),
        }),
    )

    filter_horizontal = ('roles',)


@admin.register(UserStatus)
class UserStatusAdmin(admin.ModelAdmin):
    """Admin configuration for UserStatus model."""
    list_display = ('user', 'status', 'start_date', 'end_date', 'created_by')
    list_filter = ('status', 'start_date')
    search_fields = ('user__email', 'user__first_name', 'user__last_name')
    raw_id_fields = ('user', 'created_by')
