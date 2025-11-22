"""
Permissions for skills app.
"""
from rest_framework.permissions import BasePermission


class CanManageSkills(BasePermission):
    """Allow managing skill definitions (admin only)."""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        return request.user.has_permission('organization.manage')
