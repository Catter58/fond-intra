"""
Organization URLs.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.organization.views import (
    DepartmentViewSet,
    PositionViewSet,
    OrganizationTreeView,
    DepartmentSkillsMatrixView,
)

router = DefaultRouter()
router.register('departments', DepartmentViewSet, basename='departments')
router.register('positions', PositionViewSet, basename='positions')

urlpatterns = [
    path('', include(router.urls)),
    path('tree/', OrganizationTreeView.as_view(), name='organization-tree'),
    path('departments/<int:department_id>/skills-matrix/', DepartmentSkillsMatrixView.as_view(), name='department-skills-matrix'),
]
