"""
Permissions for news app.
"""
from rest_framework.permissions import BasePermission


class CanEditNews(BasePermission):
    """Allow editing news."""

    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        # Author can edit their own news
        if obj.author == request.user:
            return True

        # Content managers can edit all news
        return request.user.has_permission('news.edit_all')


class CanPinNews(BasePermission):
    """Allow pinning/unpinning news."""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        return request.user.has_permission('news.pin')
