"""
Views for interactions app: bookmarks, view history, profile stats.
"""
import re

from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import GenericViewSet
from rest_framework.mixins import ListModelMixin, DestroyModelMixin

from apps.accounts.models import User
from apps.news.models import News, Comment
from apps.achievements.models import AchievementAward
from apps.kudos.models import Kudos
from apps.skills.models import UserSkill, SkillEndorsement
from .models import Bookmark, ViewHistory, ProfileView
from .serializers import (
    BookmarkSerializer,
    BookmarkCreateSerializer,
    BookmarkedUserSerializer,
    BookmarkedNewsSerializer,
    ViewHistorySerializer,
    ProfileStatsSerializer,
)


class BookmarkViewSet(ListModelMixin, DestroyModelMixin, GenericViewSet):
    """ViewSet for managing bookmarks."""
    permission_classes = [IsAuthenticated]
    serializer_class = BookmarkSerializer
    pagination_class = None  # No pagination for bookmarks

    def get_queryset(self):
        return Bookmark.objects.filter(user=self.request.user)

    def create(self, request):
        """Toggle bookmark - create if not exists, delete if exists."""
        serializer = BookmarkCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        content_type = serializer.validated_data['content_type']
        object_id = serializer.validated_data['object_id']

        bookmark, created = Bookmark.objects.get_or_create(
            user=request.user,
            content_type=content_type,
            object_id=object_id
        )

        if not created:
            # Bookmark exists - remove it
            bookmark.delete()
            return Response({'bookmarked': False}, status=status.HTTP_200_OK)

        return Response({
            'bookmarked': True,
            'id': bookmark.id
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def users(self, request):
        """Get bookmarked users."""
        bookmarks = Bookmark.objects.filter(
            user=request.user,
            content_type=Bookmark.ContentType.USER
        ).values_list('object_id', 'id', 'created_at')

        bookmark_map = {b[0]: {'id': b[1], 'created_at': b[2]} for b in bookmarks}
        user_ids = list(bookmark_map.keys())

        users = User.objects.filter(id__in=user_ids, is_active=True).select_related('department', 'position')

        # Add bookmark info to each user
        result = []
        for user in users:
            user.bookmark = type('Bookmark', (), bookmark_map[user.id])()
            result.append(user)

        # Sort by bookmark date (most recent first)
        result.sort(key=lambda u: u.bookmark.created_at, reverse=True)

        serializer = BookmarkedUserSerializer(result, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def news(self, request):
        """Get bookmarked news."""
        bookmarks = Bookmark.objects.filter(
            user=request.user,
            content_type=Bookmark.ContentType.NEWS
        ).values_list('object_id', 'id', 'created_at')

        bookmark_map = {b[0]: {'id': b[1], 'created_at': b[2]} for b in bookmarks}
        news_ids = list(bookmark_map.keys())

        news_items = News.objects.filter(
            id__in=news_ids,
            status='published'
        ).select_related('author')

        result = []
        for news in news_items:
            # Get cover image
            cover_image = news.get_cover_image()
            cover_url = cover_image.file.url if cover_image and cover_image.file else None

            # Get excerpt from Editor.js content
            excerpt = ''
            if news.content and isinstance(news.content, dict):
                blocks = news.content.get('blocks', [])
                for block in blocks:
                    if block.get('type') == 'paragraph':
                        text = block.get('data', {}).get('text', '')
                        if text:
                            # Strip HTML tags and limit length
                            text = re.sub('<[^<]+?>', '', text)
                            excerpt = text[:200] + '...' if len(text) > 200 else text
                            break

            result.append({
                'id': news.id,
                'title': news.title,
                'excerpt': excerpt,
                'cover_image': cover_url,
                'published_at': news.publish_at or news.created_at,
                'author': news.author,
                'bookmark_id': bookmark_map[news.id]['id'],
                'bookmarked_at': bookmark_map[news.id]['created_at'],
            })

        # Sort by bookmark date (most recent first)
        result.sort(key=lambda n: n['bookmarked_at'], reverse=True)

        serializer = BookmarkedNewsSerializer(result, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def check(self, request):
        """Check if items are bookmarked. Query params: type, ids (comma-separated)."""
        content_type = request.query_params.get('type')
        ids_param = request.query_params.get('ids', '')

        if not content_type or not ids_param:
            return Response({'error': 'type and ids params required'}, status=400)

        try:
            ids = [int(x) for x in ids_param.split(',')]
        except ValueError:
            return Response({'error': 'Invalid ids format'}, status=400)

        bookmarks = Bookmark.objects.filter(
            user=request.user,
            content_type=content_type,
            object_id__in=ids
        ).values_list('object_id', flat=True)

        return Response({str(id): id in bookmarks for id in ids})


class ViewHistoryViewSet(ListModelMixin, GenericViewSet):
    """ViewSet for view history."""
    permission_classes = [IsAuthenticated]
    serializer_class = ViewHistorySerializer
    pagination_class = None  # No pagination, limited in queryset

    def get_queryset(self):
        return ViewHistory.objects.filter(
            user=self.request.user
        ).select_related(
            'viewed_user',
            'viewed_user__department',
            'viewed_user__position'
        )[:20]  # Limit to 20 most recent

    @action(detail=False, methods=['post'])
    def record(self, request):
        """Record a profile view."""
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'user_id required'}, status=400)

        # Don't record viewing your own profile
        if int(user_id) == request.user.id:
            return Response({'recorded': False})

        try:
            viewed_user = User.objects.get(id=user_id, is_active=True)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

        # Update or create view history entry
        ViewHistory.objects.update_or_create(
            user=request.user,
            viewed_user=viewed_user,
            defaults={'viewed_at': timezone.now()}
        )

        # Update profile view stats
        profile_view, _ = ProfileView.objects.get_or_create(user=viewed_user)
        profile_view.increment()

        return Response({'recorded': True})

    @action(detail=False, methods=['delete'])
    def clear(self, request):
        """Clear view history."""
        count, _ = ViewHistory.objects.filter(user=request.user).delete()
        return Response({'cleared': count})


class ProfileStatsView(APIView):
    """Get profile statistics for a user."""
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id=None):
        # If no user_id, use current user
        if user_id is None:
            user_id = request.user.id

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

        # Get profile views
        try:
            profile_views = user.profile_view_stats.view_count
        except ProfileView.DoesNotExist:
            profile_views = 0

        # Achievements count
        achievements_count = AchievementAward.objects.filter(recipient=user).count()

        # Kudos stats
        kudos_received = Kudos.objects.filter(recipient=user).count()
        kudos_sent = Kudos.objects.filter(sender=user).count()

        # Skills stats
        skills_count = UserSkill.objects.filter(user=user).count()
        endorsements_received = SkillEndorsement.objects.filter(
            user_skill__user=user
        ).count()

        # News and comments
        news_count = News.objects.filter(author=user, status='published').count()
        comments_count = Comment.objects.filter(author=user).count()

        stats = {
            'profile_views': profile_views,
            'achievements_count': achievements_count,
            'kudos_received': kudos_received,
            'kudos_sent': kudos_sent,
            'skills_count': skills_count,
            'endorsements_received': endorsements_received,
            'news_count': news_count,
            'comments_count': comments_count,
        }

        serializer = ProfileStatsSerializer(stats)
        return Response(serializer.data)
