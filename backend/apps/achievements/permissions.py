"""
Permissions for achievements app.
"""
from rest_framework.permissions import BasePermission


class CanManageAchievements(BasePermission):
    """Allow managing achievement types."""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        return request.user.has_permission('achievements.manage')
