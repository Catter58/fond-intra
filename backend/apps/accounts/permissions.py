"""
Custom permissions for accounts app.
"""
from rest_framework.permissions import BasePermission


class IsHROrAdmin(BasePermission):
    """Allow access only to HR users or admins."""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        return request.user.has_any_permission([
            'users.create',
            'users.archive',
            'users.edit_all'
        ])


class CanViewPrivateData(BasePermission):
    """Allow viewing private user data."""

    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False

        # Users can see their own private data
        if obj.id == request.user.id:
            return True

        # HR/Admin can see all private data
        if request.user.is_superuser:
            return True

        return request.user.has_permission('users.view_private')


class CanManageUserStatus(BasePermission):
    """Allow managing user statuses."""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        # HR can manage any status
        if request.user.has_permission('users.manage_statuses'):
            return True

        # Managers can manage their subordinates' statuses
        user_id = view.kwargs.get('user_id')
        if user_id:
            from .models import User
            try:
                user = User.objects.get(pk=user_id)
                return user.manager_id == request.user.id
            except User.DoesNotExist:
                pass

        return False
