"""
URL configuration for ideas app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    IdeaViewSet,
    IdeaCategoriesView,
    IdeaStatusesView,
    MyIdeasView,
)

router = DefaultRouter()
router.register(r'', IdeaViewSet, basename='ideas')

urlpatterns = [
    path('categories/', IdeaCategoriesView.as_view(), name='idea-categories'),
    path('statuses/', IdeaStatusesView.as_view(), name='idea-statuses'),
    path('my/', MyIdeasView.as_view(), name='my-ideas'),
    path('', include(router.urls)),
]
