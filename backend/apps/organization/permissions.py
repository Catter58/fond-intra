"""
Permissions for organization app.
"""
from rest_framework.permissions import BasePermission


class CanManageOrganization(BasePermission):
    """Allow managing organization structure."""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        return request.user.has_permission('organization.manage')
