"""
Permissions for audit app.
"""
from rest_framework.permissions import BasePermission


class CanViewAudit(BasePermission):
    """Allow viewing audit logs."""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        return request.user.has_permission('audit.view')


class CanExportAudit(BasePermission):
    """Allow exporting audit logs."""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        return request.user.has_permission('audit.export')
