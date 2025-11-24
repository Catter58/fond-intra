"""
Views for achievements app.
"""
from django.db.models import Count
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView

from apps.audit.models import AuditLog
from apps.notifications.models import Notification
from .models import Achievement, AchievementAward
from .serializers import (
    AchievementSerializer,
    AchievementCreateSerializer,
    AchievementAwardSerializer,
    AchievementAwardCreateSerializer,
    AchievementFeedSerializer,
    UserAchievementSerializer,
    LeaderboardEntrySerializer,
)
from .permissions import CanManageAchievements


class AchievementTypeViewSet(ModelViewSet):
    """CRUD for achievement types."""
    permission_classes = [IsAuthenticated]
    pagination_class = None  # Achievement types are limited, no pagination needed

    def get_queryset(self):
        queryset = Achievement.objects.annotate(
            awards_count=Count('awards')
        )
        if self.action == 'list':
            # Only show active achievements for regular users
            if not self.request.user.has_permission('achievements.manage'):
                queryset = queryset.filter(is_active=True)
        return queryset

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return AchievementCreateSerializer
        return AchievementSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), CanManageAchievements()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        achievement = serializer.save(created_by=self.request.user)
        AuditLog.log(
            user=self.request.user,
            action=AuditLog.Action.CREATE,
            entity_type='Achievement',
            entity_id=achievement.id,
            entity_repr=str(achievement),
            ip_address=getattr(self.request, 'audit_ip', None),
            user_agent=getattr(self.request, 'audit_user_agent', '')
        )


class AchievementAwardView(APIView):
    """Award an achievement to a user."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AchievementAwardCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Create award
        award = serializer.save(awarded_by=request.user)

        # Create notification for recipient
        Notification.objects.create(
            user=award.recipient,
            type=Notification.NotificationType.ACHIEVEMENT,
            title=f">20O 0G82:0: {award.achievement.name}",
            message=f"{request.user.get_full_name()} =03@048; 20A: {award.comment}",
            link=f"/achievements/{award.id}",
            related_object_type='AchievementAward',
            related_object_id=award.id
        )

        # Log
        AuditLog.log(
            user=request.user,
            action=AuditLog.Action.CREATE,
            entity_type='AchievementAward',
            entity_id=award.id,
            entity_repr=f"{award.recipient} - {award.achievement}",
            ip_address=getattr(request, 'audit_ip', None),
            user_agent=getattr(request, 'audit_user_agent', '')
        )

        return Response(
            AchievementAwardSerializer(award).data,
            status=status.HTTP_201_CREATED
        )


class AchievementFeedView(ListAPIView):
    """Feed of recent achievement awards."""
    serializer_class = AchievementFeedSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return AchievementAward.objects.select_related(
            'achievement', 'recipient', 'awarded_by'
        ).order_by('-awarded_at')[:50]


class UserAchievementsView(ListAPIView):
    """Get achievements for a specific user."""
    serializer_class = UserAchievementSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # User achievements are limited, no pagination needed

    def get_queryset(self):
        user_id = self.kwargs.get('user_id')
        return AchievementAward.objects.filter(
            recipient_id=user_id
        ).select_related('achievement', 'awarded_by')


class MyAchievementsView(ListAPIView):
    """Get current user's achievements."""
    serializer_class = UserAchievementSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # User achievements are limited, no pagination needed

    def get_queryset(self):
        return AchievementAward.objects.filter(
            recipient=self.request.user
        ).select_related('achievement', 'awarded_by')


class AchievementStatsView(APIView):
    """Get achievement statistics."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.utils import timezone
        from datetime import timedelta

        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        total_awards = AchievementAward.objects.count()
        this_month = AchievementAward.objects.filter(awarded_at__gte=month_start).count()

        top_achievements = Achievement.objects.annotate(
            count=Count('awards')
        ).filter(count__gt=0).order_by('-count')[:5]

        top_recipients = AchievementAward.objects.values(
            'recipient__id',
            'recipient__first_name',
            'recipient__last_name'
        ).annotate(count=Count('id')).order_by('-count')[:5]

        return Response({
            'total_awards': total_awards,
            'this_month': this_month,
            'top_achievements': [
                {'id': a.id, 'name': a.name, 'count': a.count}
                for a in top_achievements
            ],
            'top_recipients': list(top_recipients)
        })


class AchievementLeaderboardView(APIView):
    """Get achievement leaderboard with filters."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.utils import timezone
        from datetime import timedelta
        from django.db.models import Q, Prefetch

        # Get query parameters
        period = request.query_params.get('period', 'month')  # week, month, quarter, year, all
        department_id = request.query_params.get('department')
        category = request.query_params.get('category')
        limit = int(request.query_params.get('limit', 20))

        # Calculate date filter based on period
        now = timezone.now()
        date_filter = None

        if period == 'week':
            date_filter = now - timedelta(days=7)
        elif period == 'month':
            date_filter = now - timedelta(days=30)
        elif period == 'quarter':
            date_filter = now - timedelta(days=90)
        elif period == 'year':
            date_filter = now - timedelta(days=365)
        # 'all' has no date filter

        # Build queryset
        queryset = AchievementAward.objects.all()

        if date_filter:
            queryset = queryset.filter(awarded_at__gte=date_filter)

        if department_id:
            queryset = queryset.filter(recipient__department_id=department_id)

        if category:
            queryset = queryset.filter(achievement__category=category)

        # Aggregate by recipient
        from django.db.models import Count, Max
        leaderboard = queryset.values(
            'recipient__id',
            'recipient__first_name',
            'recipient__last_name',
            'recipient__avatar',
            'recipient__position__name',
            'recipient__department__name',
        ).annotate(
            count=Count('id'),
            latest_award=Max('awarded_at')
        ).order_by('-count', '-latest_award')[:limit]

        # Get User objects and their recent achievements
        from apps.accounts.models import User
        from apps.accounts.serializers import UserBasicSerializer

        result = []
        for rank, entry in enumerate(leaderboard, start=1):
            user = User.objects.get(id=entry['recipient__id'])

            # Get most recent achievement for this user
            recent_award = queryset.filter(recipient=user).select_related('achievement').order_by('-awarded_at').first()
            recent_achievement = recent_award.achievement if recent_award else None

            result.append({
                'rank': rank,
                'user': UserBasicSerializer(user).data,
                'count': entry['count'],
                'recent_achievement': AchievementSerializer(recent_achievement).data if recent_achievement else None
            })

        return Response(result)


class AchievementProgressView(APIView):
    """Get user's progress towards automatic achievements."""
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id=None):
        from apps.achievements.services import get_all_achievement_progress
        from apps.accounts.models import User

        # If user_id provided, get that user's progress (for viewing others)
        # Otherwise, get current user's progress
        if user_id:
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response(
                    {'detail': 'User not found.'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            user = request.user

        progress_data = get_all_achievement_progress(user)

        return Response({
            'user_id': user.id,
            'progress': progress_data
        })


class TriggerTypesView(APIView):
    """Get available trigger types for automatic achievements."""
    permission_classes = [IsAuthenticated, CanManageAchievements]

    def get(self, request):
        trigger_types = [
            {
                'value': choice[0],
                'label': choice[1]
            }
            for choice in Achievement.TriggerType.choices
        ]

        return Response(trigger_types)
