"""
Roles URLs (under /api/v1/admin/).
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.roles.views import AdminStatsView, PermissionListView, RoleViewSet

router = DefaultRouter()
router.register('roles', RoleViewSet, basename='roles')

urlpatterns = [
    path('stats/', AdminStatsView.as_view(), name='admin-stats'),
    path('permissions/', PermissionListView.as_view(), name='permissions-list'),
    path('', include(router.urls)),
]
