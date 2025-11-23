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
