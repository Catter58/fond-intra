"""
Views for ideas app.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count, Q

from core.pagination import StandardPagination
from .models import Idea, IdeaVote, IdeaComment
from .serializers import (
    IdeaSerializer,
    IdeaCreateSerializer,
    IdeaUpdateSerializer,
    IdeaStatusUpdateSerializer,
    IdeaCommentSerializer,
    IdeaCommentCreateSerializer,
)


class IdeaViewSet(viewsets.ModelViewSet):
    """
    ViewSet for ideas.

    list: Get all ideas with filters
    create: Create new idea
    retrieve: Get idea details
    update: Update own idea
    destroy: Delete own idea (or admin)
    """
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination

    def get_queryset(self):
        queryset = Idea.objects.select_related(
            'author', 'author__position', 'author__department'
        ).prefetch_related('votes', 'comments')

        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)

        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Filter by author
        author = self.request.query_params.get('author')
        if author:
            queryset = queryset.filter(author_id=author)

        # Sorting
        sort = self.request.query_params.get('sort', '-created_at')
        if sort == 'votes':
            queryset = queryset.annotate(
                score=Count('votes', filter=Q(votes__is_upvote=True)) -
                      Count('votes', filter=Q(votes__is_upvote=False))
            ).order_by('-score')
        elif sort == '-votes':
            queryset = queryset.annotate(
                score=Count('votes', filter=Q(votes__is_upvote=True)) -
                      Count('votes', filter=Q(votes__is_upvote=False))
            ).order_by('score')
        elif sort == 'comments':
            queryset = queryset.annotate(
                comments_count=Count('comments')
            ).order_by('-comments_count')
        else:
            queryset = queryset.order_by(sort)

        return queryset

    def get_serializer_class(self):
        if self.action == 'create':
            return IdeaCreateSerializer
        if self.action in ['update', 'partial_update']:
            return IdeaUpdateSerializer
        return IdeaSerializer

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        # Only author can update
        if instance.author != request.user and not request.user.is_superuser:
            if not (request.user.role and request.user.role.is_admin):
                return Response(
                    {'detail': 'Вы можете редактировать только свои идеи.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # Only author or admin can delete
        if instance.author != request.user and not request.user.is_superuser:
            if not (request.user.role and request.user.role.is_admin):
                return Response(
                    {'detail': 'Вы можете удалять только свои идеи.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def vote(self, request, pk=None):
        """Vote on an idea."""
        idea = self.get_object()
        is_upvote = request.data.get('is_upvote', True)

        # Can't vote on own idea
        if idea.author == request.user:
            return Response(
                {'detail': 'Нельзя голосовать за свою идею.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        vote, created = IdeaVote.objects.get_or_create(
            idea=idea,
            user=request.user,
            defaults={'is_upvote': is_upvote}
        )

        if not created:
            # Update existing vote
            if vote.is_upvote != is_upvote:
                vote.is_upvote = is_upvote
                vote.save()

        serializer = IdeaSerializer(idea, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['delete'])
    def unvote(self, request, pk=None):
        """Remove vote from an idea."""
        idea = self.get_object()
        IdeaVote.objects.filter(idea=idea, user=request.user).delete()
        serializer = IdeaSerializer(idea, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Update idea status (admin only)."""
        idea = self.get_object()

        if not request.user.is_superuser:
            if not (request.user.role and request.user.role.is_admin):
                return Response(
                    {'detail': 'Только администратор может менять статус.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        serializer = IdeaStatusUpdateSerializer(idea, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Create notification for author
        if idea.author != request.user:
            from apps.notifications.models import Notification
            Notification.objects.create(
                user=idea.author,
                type='system',
                title='Статус идеи изменён',
                message=f'Статус вашей идеи "{idea.title[:50]}" изменён на "{idea.get_status_display()}"',
                link='/ideas'
            )

        return Response(IdeaSerializer(idea, context={'request': request}).data)

    @action(detail=True, methods=['get', 'post'])
    def comments(self, request, pk=None):
        """Get or add comments to an idea."""
        idea = self.get_object()

        if request.method == 'GET':
            comments = idea.comments.select_related('author', 'author__position', 'author__department')
            serializer = IdeaCommentSerializer(comments, many=True)
            return Response(serializer.data)

        serializer = IdeaCommentCreateSerializer(
            data=request.data,
            context={'request': request, 'idea': idea}
        )
        serializer.is_valid(raise_exception=True)
        comment = serializer.save()

        # Notify author if it's not them
        if idea.author != request.user:
            from apps.notifications.models import Notification
            Notification.objects.create(
                user=idea.author,
                type='comment',
                title='Новый комментарий к идее',
                message=f'{request.user.get_full_name()} прокомментировал вашу идею "{idea.title[:50]}"',
                link='/ideas'
            )

        return Response(
            IdeaCommentSerializer(comment).data,
            status=status.HTTP_201_CREATED
        )


class IdeaCategoriesView(APIView):
    """Get available idea categories."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        categories = [
            {'value': choice[0], 'label': choice[1]}
            for choice in Idea.Category.choices
        ]
        return Response(categories)


class IdeaStatusesView(APIView):
    """Get available idea statuses."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        statuses = [
            {'value': choice[0], 'label': choice[1]}
            for choice in Idea.Status.choices
        ]
        return Response(statuses)


class MyIdeasView(APIView):
    """Get ideas created by current user."""
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination

    def get(self, request):
        queryset = Idea.objects.filter(author=request.user).select_related(
            'author', 'author__position', 'author__department'
        ).prefetch_related('votes', 'comments').order_by('-created_at')

        serializer = IdeaSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)
