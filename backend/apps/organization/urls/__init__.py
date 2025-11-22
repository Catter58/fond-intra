"""
Organization URLs.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.organization.views import (
    DepartmentViewSet,
    PositionViewSet,
    OrganizationTreeView,
)

router = DefaultRouter()
router.register('departments', DepartmentViewSet, basename='departments')
router.register('positions', PositionViewSet, basename='positions')

urlpatterns = [
    path('', include(router.urls)),
    path('tree/', OrganizationTreeView.as_view(), name='organization-tree'),
]
