"""
URL configuration for surveys app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    SurveyViewSet,
    SurveyStatusesView,
    QuestionTypesView,
    TargetTypesView,
)

router = DefaultRouter()
router.register(r'', SurveyViewSet, basename='surveys')

urlpatterns = [
    path('statuses/', SurveyStatusesView.as_view(), name='survey-statuses'),
    path('question-types/', QuestionTypesView.as_view(), name='question-types'),
    path('target-types/', TargetTypesView.as_view(), name='target-types'),
    path('', include(router.urls)),
]
