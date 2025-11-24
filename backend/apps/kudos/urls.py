"""
URLs for kudos app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    KudosViewSet,
    KudosCategoriesView,
    UserKudosView,
    KudosStatsView,
)

router = DefaultRouter()
router.register('', KudosViewSet, basename='kudos')

urlpatterns = [
    path('categories/', KudosCategoriesView.as_view(), name='kudos-categories'),
    path('stats/', KudosStatsView.as_view(), name='kudos-stats'),
    path('user/<int:user_id>/', UserKudosView.as_view(), name='user-kudos'),
    path('', include(router.urls)),
]
