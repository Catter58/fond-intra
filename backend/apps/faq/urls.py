"""
URL configuration for FAQ app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import FAQCategoryViewSet, FAQItemViewSet

router = DefaultRouter()
router.register(r'categories', FAQCategoryViewSet, basename='faq-categories')
router.register(r'items', FAQItemViewSet, basename='faq-items')

urlpatterns = [
    path('', include(router.urls)),
]
