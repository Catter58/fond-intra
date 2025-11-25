from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ResourceTypeViewSet, ResourceViewSet, BookingViewSet

router = DefaultRouter()
router.register(r'resource-types', ResourceTypeViewSet, basename='resource-type')
router.register(r'resources', ResourceViewSet, basename='resource')
router.register(r'bookings', BookingViewSet, basename='booking')

urlpatterns = [
    path('', include(router.urls)),
]
