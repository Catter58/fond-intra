"""
Achievements URLs.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.achievements.views import (
    AchievementTypeViewSet,
    AchievementAwardView,
    AchievementFeedView,
    UserAchievementsView,
    MyAchievementsView,
    AchievementStatsView,
    AchievementLeaderboardView,
    AchievementProgressView,
    TriggerTypesView,
)

router = DefaultRouter()
router.register('types', AchievementTypeViewSet, basename='achievement-types')

urlpatterns = [
    path('', include(router.urls)),
    path('award/', AchievementAwardView.as_view(), name='achievement-award'),
    path('feed/', AchievementFeedView.as_view(), name='achievement-feed'),
    path('my/', MyAchievementsView.as_view(), name='my-achievements'),
    path('user/<int:user_id>/', UserAchievementsView.as_view(), name='user-achievements'),
    path('stats/', AchievementStatsView.as_view(), name='achievement-stats'),
    path('leaderboard/', AchievementLeaderboardView.as_view(), name='achievement-leaderboard'),
    path('progress/', AchievementProgressView.as_view(), name='achievement-progress'),
    path('progress/<int:user_id>/', AchievementProgressView.as_view(), name='user-achievement-progress'),
    path('trigger-types/', TriggerTypesView.as_view(), name='achievement-trigger-types'),
]
