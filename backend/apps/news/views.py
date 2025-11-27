"""
Views for news app.
"""
import json

from django.db.models import Count, Max
from django.db import models
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from apps.audit.models import AuditLog
from apps.notifications.models import Notification
from core.utils import generate_thumbnail
from .models import News, NewsAttachment, Comment, Reaction, Tag
from .serializers import (
    NewsListSerializer,
    NewsDetailSerializer,
    NewsCreateSerializer,
    NewsUpdateSerializer,
    NewsAttachmentSerializer,
    CommentSerializer,
    CommentCreateSerializer,
    ReactionSerializer,
    TagSerializer,
    TagCreateSerializer,
)
from .permissions import CanEditNews, CanPinNews


class NewsViewSet(ModelViewSet):
    """CRUD for news."""
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        queryset = News.objects.select_related('author').prefetch_related('tags').annotate(
            comments_count=Count('comments')
        )
        if self.action == 'list':
            # Check if user wants to see their own drafts
            show_drafts = self.request.query_params.get('drafts') == 'true'
            if show_drafts and self.request.user.is_authenticated:
                # Show user's own drafts
                queryset = queryset.filter(author=self.request.user)
            else:
                # Only published news
                queryset = queryset.filter(status='published')

            # Filter by status
            status_filter = self.request.query_params.get('status')
            if status_filter and show_drafts:
                queryset = queryset.filter(status=status_filter)

            # Filter by tag
            tag = self.request.query_params.get('tag')
            if tag:
                queryset = queryset.filter(tags__slug=tag)
            tag_id = self.request.query_params.get('tag_id')
            if tag_id:
                queryset = queryset.filter(tags__id=tag_id)
        return queryset.order_by('-is_pinned', '-created_at').distinct()

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

        # Handle attachments
        attachments = self.request.FILES.getlist('attachments')
        for idx, file in enumerate(attachments):
            attachment = NewsAttachment(
                news=news,
                file=file,
                file_name=file.name,
                file_type=file.content_type,
                file_size=file.size,
                order=idx
            )

            # Generate thumbnail for images
            if file.content_type.startswith('image/'):
                thumbnail = generate_thumbnail(file)
                if thumbnail:
                    attachment.thumbnail.save(
                        f'thumb_{file.name}.jpg',
                        thumbnail,
                        save=False
                    )
                # Set first image as cover if none set
                if idx == 0:
                    attachment.is_cover = True

            attachment.save()

        AuditLog.log(
            user=self.request.user,
            action=AuditLog.Action.CREATE,
            entity_type='News',
            entity_id=news.id,
            entity_repr=news.title,
            ip_address=getattr(self.request, 'audit_ip', None),
            user_agent=getattr(self.request, 'audit_user_agent', '')
        )

    def perform_update(self, serializer):
        news = serializer.save()

        # Handle new attachments
        attachments = self.request.FILES.getlist('attachments')
        # Get max order for existing attachments
        max_order = news.attachments.aggregate(
            max_order=models.Max('order')
        )['max_order'] or 0

        for idx, file in enumerate(attachments):
            attachment = NewsAttachment(
                news=news,
                file=file,
                file_name=file.name,
                file_type=file.content_type,
                file_size=file.size,
                order=max_order + idx + 1
            )

            # Generate thumbnail for images
            if file.content_type.startswith('image/'):
                thumbnail = generate_thumbnail(file)
                if thumbnail:
                    attachment.thumbnail.save(
                        f'thumb_{file.name}.jpg',
                        thumbnail,
                        save=False
                    )

            attachment.save()

        # Handle deleted attachments
        delete_attachments = self.request.data.get('delete_attachments')
        if delete_attachments:
            try:
                attachment_ids = json.loads(delete_attachments)
                NewsAttachment.objects.filter(
                    id__in=attachment_ids,
                    news=news
                ).delete()
            except (json.JSONDecodeError, TypeError):
                pass

        AuditLog.log(
            user=self.request.user,
            action=AuditLog.Action.UPDATE,
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

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanEditNews])
    def publish(self, request, pk=None):
        """Publish a news post."""
        from django.utils import timezone
        news = self.get_object()
        news.status = News.Status.PUBLISHED
        news.publish_at = timezone.now()
        news.save()
        return Response({'detail': 'News published.', 'status': news.status})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanEditNews])
    def unpublish(self, request, pk=None):
        """Unpublish a news post (move to drafts)."""
        news = self.get_object()
        news.status = News.Status.DRAFT
        news.save()
        return Response({'detail': 'News moved to drafts.', 'status': news.status})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanEditNews])
    def schedule(self, request, pk=None):
        """Schedule a news post for future publishing."""
        from django.utils import timezone
        from django.utils.dateparse import parse_datetime
        news = self.get_object()
        publish_at = request.data.get('publish_at')
        if not publish_at:
            return Response(
                {'detail': 'publish_at is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        parsed_date = parse_datetime(publish_at)
        if not parsed_date:
            return Response(
                {'detail': 'Invalid date format.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if parsed_date <= timezone.now():
            return Response(
                {'detail': 'Scheduled date must be in the future.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        news.status = News.Status.SCHEDULED
        news.publish_at = parsed_date
        news.save()
        return Response({
            'detail': 'News scheduled.',
            'status': news.status,
            'publish_at': news.publish_at.isoformat()
        })

    @action(detail=True, methods=['patch'], url_path='autosave')
    def autosave(self, request, pk=None):
        """Autosave draft content without validation."""
        news = self.get_object()
        # Check permission
        if news.author != request.user and not request.user.has_permission('news.edit_all'):
            return Response(
                {'detail': 'Permission denied.'},
                status=status.HTTP_403_FORBIDDEN
            )
        # Only allow autosave for drafts
        if news.status == News.Status.PUBLISHED:
            return Response(
                {'detail': 'Cannot autosave published news.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        # Update fields without full validation
        if 'title' in request.data:
            news.title = request.data['title']
        if 'content' in request.data:
            news.content = request.data['content']
        if 'tag_ids' in request.data:
            tag_ids = request.data['tag_ids']
            if isinstance(tag_ids, str):
                try:
                    tag_ids = json.loads(tag_ids)
                except:
                    tag_ids = []
            if tag_ids:
                news.tags.set(tag_ids)
        news.save()
        return Response({
            'detail': 'Draft saved.',
            'updated_at': news.updated_at.isoformat()
        })

    @action(detail=True, methods=['post'], url_path='attachments/(?P<attachment_id>[^/.]+)/set-cover')
    def set_cover(self, request, pk=None, attachment_id=None):
        """Set an attachment as cover image."""
        news = self.get_object()
        try:
            attachment = news.attachments.get(pk=attachment_id)
            if not attachment.is_image:
                return Response(
                    {'detail': 'Only images can be set as cover.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            attachment.is_cover = True
            attachment.save()
            return Response({'detail': 'Cover image set.'})
        except NewsAttachment.DoesNotExist:
            return Response(
                {'detail': 'Attachment not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'], url_path='attachments/reorder')
    def reorder_attachments(self, request, pk=None):
        """Reorder attachments."""
        news = self.get_object()
        order_data = request.data.get('order', [])

        if not isinstance(order_data, list):
            return Response(
                {'detail': 'Invalid order data.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        for idx, attachment_id in enumerate(order_data):
            news.attachments.filter(pk=attachment_id).update(order=idx)

        return Response({'detail': 'Attachments reordered.'})


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

        # Get max order for existing attachments
        max_order = news.attachments.aggregate(
            max_order=Max('order')
        )['max_order'] or 0

        attachment = NewsAttachment(
            news=news,
            file=file,
            file_name=file.name,
            file_type=file.content_type,
            file_size=file.size,
            order=max_order + 1
        )

        # Generate thumbnail for images
        if file.content_type.startswith('image/'):
            thumbnail = generate_thumbnail(file)
            if thumbnail:
                attachment.thumbnail.save(
                    f'thumb_{file.name}.jpg',
                    thumbnail,
                    save=False
                )

        attachment.save()

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

        # Track notified users to avoid duplicates
        news = comment.news
        notified_users = set()

        # Notify news author
        if news.author and news.author != self.request.user:
            Notification.objects.create(
                user=news.author,
                type=Notification.NotificationType.COMMENT,
                title="Новый комментарий",
                message=f"{self.request.user.get_full_name()} прокомментировал вашу новость",
                link=f"/news/{news.id}",
                related_object_type='Comment',
                related_object_id=comment.id
            )
            notified_users.add(news.author.id)

        # If reply, notify parent comment author
        if comment.parent and comment.parent.author and comment.parent.author != self.request.user:
            if comment.parent.author.id not in notified_users:
                Notification.objects.create(
                    user=comment.parent.author,
                    type=Notification.NotificationType.COMMENT,
                    title="Ответ на комментарий",
                    message=f"{self.request.user.get_full_name()} ответил на ваш комментарий",
                    link=f"/news/{news.id}",
                    related_object_type='Comment',
                    related_object_id=comment.id
                )
                notified_users.add(comment.parent.author.id)

        # Notify mentioned users
        mentioned_users = comment.get_mentioned_users()
        for user in mentioned_users:
            if user != self.request.user and user.id not in notified_users:
                Notification.objects.create(
                    user=user,
                    type=Notification.NotificationType.COMMENT,
                    title="Упоминание в комментарии",
                    message=f"{self.request.user.get_full_name()} упомянул вас в комментарии",
                    link=f"/news/{news.id}",
                    related_object_type='Comment',
                    related_object_id=comment.id
                )
                notified_users.add(user.id)

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
                        title="Новая реакция",
                        message=f"{request.user.get_full_name()} отреагировал на вашу новость",
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


class TagViewSet(ModelViewSet):
    """CRUD for news tags."""
    permission_classes = [IsAuthenticated]
    queryset = Tag.objects.all()

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return TagCreateSerializer
        return TagSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Only users with permission can manage tags
            return [IsAuthenticated(), CanEditNews()]
        return [IsAuthenticated()]
