"""
Skills URLs.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.skills.views import (
    SkillCategoryViewSet,
    SkillViewSet,
    MySkillsView,
    MySkillDetailView,
)

router = DefaultRouter()
router.register('categories', SkillCategoryViewSet, basename='skill-categories')
router.register('', SkillViewSet, basename='skills')

urlpatterns = [
    path('me/', MySkillsView.as_view(), name='my-skills'),
    path('me/<int:skill_id>/', MySkillDetailView.as_view(), name='my-skill-detail'),
    path('', include(router.urls)),
]
