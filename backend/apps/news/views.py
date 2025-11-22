"""
Views for news app.
"""
from django.db.models import Count
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework.parsers import MultiPartParser, FormParser

from apps.audit.models import AuditLog
from apps.notifications.models import Notification
from .models import News, NewsAttachment, Comment, Reaction
from .serializers import (
    NewsListSerializer,
    NewsDetailSerializer,
    NewsCreateSerializer,
    NewsUpdateSerializer,
    NewsAttachmentSerializer,
    CommentSerializer,
    CommentCreateSerializer,
    ReactionSerializer,
)
from .permissions import CanEditNews, CanPinNews


class NewsViewSet(ModelViewSet):
    """CRUD for news."""
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = News.objects.select_related('author').annotate(
            comments_count=Count('comments')
        )
        if self.action == 'list':
            queryset = queryset.filter(is_published=True)
        return queryset.order_by('-is_pinned', '-created_at')

    def get_serializer_class(self):
        if self.action == 'create':
            return NewsCreateSerializer
        if self.action in ['update', 'partial_update']:
            return NewsUpdateSerializer
        if self.action == 'retrieve':
            return NewsDetailSerializer
        return NewsListSerializer

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), CanEditNews()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        news = serializer.save(author=self.request.user)
        AuditLog.log(
            user=self.request.user,
            action=AuditLog.Action.CREATE,
            entity_type='News',
            entity_id=news.id,
            entity_repr=news.title,
            ip_address=getattr(self.request, 'audit_ip', None),
            user_agent=getattr(self.request, 'audit_user_agent', '')
        )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanPinNews])
    def pin(self, request, pk=None):
        """Pin a news post."""
        news = self.get_object()
        news.is_pinned = True
        news.save()
        return Response({'detail': 'News pinned.'})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanPinNews])
    def unpin(self, request, pk=None):
        """Unpin a news post."""
        news = self.get_object()
        news.is_pinned = False
        news.save()
        return Response({'detail': 'News unpinned.'})


class NewsAttachmentView(APIView):
    """Upload attachments to news."""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, news_id):
        """Upload attachment."""
        try:
            news = News.objects.get(pk=news_id)
        except News.DoesNotExist:
            return Response(
                {'detail': 'News not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check permission
        if news.author != request.user and not request.user.has_permission('news.edit_all'):
            return Response(
                {'detail': 'Permission denied.'},
                status=status.HTTP_403_FORBIDDEN
            )

        file = request.FILES.get('file')
        if not file:
            return Response(
                {'detail': 'No file provided.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        attachment = NewsAttachment.objects.create(
            news=news,
            file=file,
            file_name=file.name,
            file_type=file.content_type,
            file_size=file.size
        )

        return Response(
            NewsAttachmentSerializer(attachment).data,
            status=status.HTTP_201_CREATED
        )

    def delete(self, request, news_id, attachment_id):
        """Delete attachment."""
        try:
            attachment = NewsAttachment.objects.get(
                pk=attachment_id,
                news_id=news_id
            )
        except NewsAttachment.DoesNotExist:
            return Response(
                {'detail': 'Attachment not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check permission
        if attachment.news.author != request.user and not request.user.has_permission('news.edit_all'):
            return Response(
                {'detail': 'Permission denied.'},
                status=status.HTTP_403_FORBIDDEN
            )

        attachment.file.delete()
        attachment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CommentViewSet(ModelViewSet):
    """CRUD for comments on news."""
    permission_classes = [IsAuthenticated]
    pagination_class = None  # Comments don't need pagination

    def get_queryset(self):
        news_id = self.kwargs.get('news_id')
        return Comment.objects.filter(
            news_id=news_id,
            parent__isnull=True  # Only top-level comments
        ).select_related('author').prefetch_related('replies')

    def get_serializer_class(self):
        if self.action == 'create':
            return CommentCreateSerializer
        return CommentSerializer

    def perform_create(self, serializer):
        news_id = self.kwargs.get('news_id')
        comment = serializer.save(
            news_id=news_id,
            author=self.request.user
        )

        # Notify news author
        news = comment.news
        if news.author and news.author != self.request.user:
            Notification.objects.create(
                user=news.author,
                type=Notification.NotificationType.COMMENT,
                title=">2K9 :><<5=B0@89",
                message=f"{self.request.user.get_full_name()} ?@>:><<5=B8@>20; 20HC =>2>ABL",
                link=f"/news/{news.id}",
                related_object_type='Comment',
                related_object_id=comment.id
            )

        # If reply, notify parent comment author
        if comment.parent and comment.parent.author != self.request.user:
            Notification.objects.create(
                user=comment.parent.author,
                type=Notification.NotificationType.COMMENT,
                title="B25B =0 :><<5=B0@89",
                message=f"{self.request.user.get_full_name()} >B25B8; =0 20H :><<5=B0@89",
                link=f"/news/{news.id}",
                related_object_type='Comment',
                related_object_id=comment.id
            )

    def destroy(self, request, *args, **kwargs):
        comment = self.get_object()
        # Only author or admin can delete
        if comment.author != request.user and not request.user.has_permission('comments.delete_all'):
            return Response(
                {'detail': 'Permission denied.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


class ReactionView(APIView):
    """Manage reactions on news."""
    permission_classes = [IsAuthenticated]

    def get(self, request, news_id):
        """Get reactions for news."""
        reactions = Reaction.objects.filter(
            news_id=news_id
        ).select_related('user')
        serializer = ReactionSerializer(reactions, many=True)
        return Response(serializer.data)

    def post(self, request, news_id):
        """Add or update reaction."""
        reaction_type = request.data.get('type')

        if reaction_type not in dict(Reaction.ReactionType.choices):
            return Response(
                {'detail': 'Invalid reaction type.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        reaction, created = Reaction.objects.update_or_create(
            news_id=news_id,
            user=request.user,
            defaults={'type': reaction_type}
        )

        # Notify news author on new reaction
        if created:
            try:
                news = News.objects.get(pk=news_id)
                if news.author and news.author != request.user:
                    Notification.objects.create(
                        user=news.author,
                        type=Notification.NotificationType.REACTION,
                        title=">20O @50:F8O",
                        message=f"{request.user.get_full_name()} >B@5038@>20; =0 20HC =>2>ABL",
                        link=f"/news/{news.id}",
                        related_object_type='Reaction',
                        related_object_id=reaction.id
                    )
            except News.DoesNotExist:
                pass

        return Response(
            ReactionSerializer(reaction).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )

    def delete(self, request, news_id):
        """Remove reaction."""
        try:
            reaction = Reaction.objects.get(
                news_id=news_id,
                user=request.user
            )
            reaction.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Reaction.DoesNotExist:
            return Response(
                {'detail': 'Reaction not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
