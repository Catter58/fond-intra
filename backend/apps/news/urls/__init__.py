"""
News URLs.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.news.views import (
    NewsViewSet,
    NewsAttachmentView,
    CommentViewSet,
    ReactionView,
)

router = DefaultRouter()
router.register('', NewsViewSet, basename='news')

urlpatterns = [
    path('', include(router.urls)),
    path('<int:news_id>/attachments/', NewsAttachmentView.as_view(), name='news-attachments'),
    path('<int:news_id>/attachments/<int:attachment_id>/', NewsAttachmentView.as_view(), name='news-attachment-delete'),
    path('<int:news_id>/comments/', CommentViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='news-comments'),
    path('<int:news_id>/comments/<int:pk>/', CommentViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='news-comment-detail'),
    path('<int:news_id>/reactions/', ReactionView.as_view(), name='news-reactions'),
]
