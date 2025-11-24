"""
URL configuration for classifieds app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import ClassifiedCategoryViewSet, ClassifiedViewSet

router = DefaultRouter()
router.register(r'categories', ClassifiedCategoryViewSet, basename='classified-categories')
router.register(r'', ClassifiedViewSet, basename='classifieds')

urlpatterns = [
    path('', include(router.urls)),
]
