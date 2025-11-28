from django.urls import path, include
from rest_framework.routers import DefaultRouter
from ..views import WikiSpaceViewSet, WikiPageViewSet, WikiTagViewSet, WikiAttachmentViewSet

router = DefaultRouter()
router.register(r'spaces', WikiSpaceViewSet, basename='wiki-space')
router.register(r'pages', WikiPageViewSet, basename='wiki-page')
router.register(r'tags', WikiTagViewSet, basename='wiki-tag')
router.register(r'attachments', WikiAttachmentViewSet, basename='wiki-attachment')

urlpatterns = [
    path('', include(router.urls)),
]
