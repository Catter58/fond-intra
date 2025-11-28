"""
Roles URLs (under /api/v1/admin/).
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.roles.views import AdminStatsView, PermissionListView, RoleViewSet
from core.views import AdminSiteSettingsView, SiteSettingsView

router = DefaultRouter()
router.register('roles', RoleViewSet, basename='roles')

urlpatterns = [
    path('stats/', AdminStatsView.as_view(), name='admin-stats'),
    path('permissions/', PermissionListView.as_view(), name='permissions-list'),
    path('settings/', AdminSiteSettingsView.as_view(), name='admin-settings-get'),
    path('settings/update/', SiteSettingsView.as_view(), name='admin-settings-update'),
    path('', include(router.urls)),
]
