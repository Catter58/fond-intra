"""
Skills URLs.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    SkillCategoryViewSet,
    SkillViewSet,
    MySkillsView,
    MySkillDetailView,
    SkillEndorseView,
    SkillEndorsementsView,
)

# Create router FIRST and register viewsets
router = DefaultRouter()
router.register('categories', SkillCategoryViewSet, basename='skill-categories')
router.register('catalog', SkillViewSet, basename='skills')  # Using 'catalog' to avoid conflicts

# Define URL patterns - specific paths BEFORE router
urlpatterns = [
    # My skills (specific paths first)
    path('my/', MySkillsView.as_view(), name='my-skills'),
    path('my/<int:skill_id>/', MySkillDetailView.as_view(), name='my-skill-detail'),

    # Skill endorsements (specific paths first)
    path('endorse/', SkillEndorseView.as_view(), name='skill-endorse'),
    path('users/<int:user_id>/skills/<int:skill_id>/endorsements/',
         SkillEndorsementsView.as_view(), name='skill-endorsements'),

    # Router URLs LAST (will match /skills/categories/ and /skills/catalog/)
    path('', include(router.urls)),
]
