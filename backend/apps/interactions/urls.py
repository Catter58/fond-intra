"""
URL configuration for interactions app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookmarkViewSet, ViewHistoryViewSet, ProfileStatsView

router = DefaultRouter()
router.register(r'bookmarks', BookmarkViewSet, basename='bookmarks')
router.register(r'view-history', ViewHistoryViewSet, basename='view-history')

urlpatterns = [
    path('', include(router.urls)),
    path('profile-stats/', ProfileStatsView.as_view(), name='profile-stats-me'),
    path('profile-stats/<int:user_id>/', ProfileStatsView.as_view(), name='profile-stats'),
]
