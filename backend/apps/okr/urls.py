from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    OKRPeriodViewSet, ObjectiveViewSet, KeyResultViewSet,
    LevelsView, StatusesView, OKRStatsView
)

router = DefaultRouter()
router.register('periods', OKRPeriodViewSet, basename='periods')
router.register('objectives', ObjectiveViewSet, basename='objectives')
router.register('key-results', KeyResultViewSet, basename='key-results')

urlpatterns = [
    path('', include(router.urls)),
    path('levels/', LevelsView.as_view({'get': 'list'}), name='levels'),
    path('statuses/', StatusesView.as_view({'get': 'list'}), name='statuses'),
    path('stats/', OKRStatsView.as_view({'get': 'list'}), name='stats'),
]
