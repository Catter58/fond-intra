"""
Views for kudos app.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q

from core.pagination import StandardPagination
from .models import Kudos
from .serializers import (
    KudosSerializer,
    KudosCreateSerializer,
    KudosCategorySerializer,
)


class KudosViewSet(viewsets.ModelViewSet):
    """
    ViewSet for kudos CRUD operations.

    list: Public kudos feed
    create: Send new kudos
    retrieve: Get single kudos
    destroy: Delete own kudos
    """
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination

    def get_queryset(self):
        queryset = Kudos.objects.select_related(
            'sender', 'sender__position', 'sender__department',
            'recipient', 'recipient__position', 'recipient__department'
        )

        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)

        # Filter by department
        department = self.request.query_params.get('department')
        if department:
            queryset = queryset.filter(
                Q(sender__department_id=department) | Q(recipient__department_id=department)
            )

        # For list action, show only public kudos (unless viewing own)
        if self.action == 'list':
            user = self.request.user
            queryset = queryset.filter(
                Q(is_public=True) | Q(sender=user) | Q(recipient=user)
            )

        return queryset.order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'create':
            return KudosCreateSerializer
        return KudosSerializer

    def perform_create(self, serializer):
        kudos = serializer.save()
        # Create notification for recipient
        from apps.notifications.models import Notification
        Notification.objects.create(
            user=kudos.recipient,
            type='system',
            title='Новая благодарность',
            message=f'{kudos.sender.get_full_name()} отправил вам благодарность: {kudos.get_category_display()}',
            link=f'/kudos'
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # Only sender can delete their kudos
        if instance.sender != request.user:
            return Response(
                {'detail': 'Вы можете удалять только свои благодарности.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def received(self, request):
        """Get kudos received by current user."""
        queryset = self.get_queryset().filter(recipient=request.user)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = KudosSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = KudosSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def sent(self, request):
        """Get kudos sent by current user."""
        queryset = self.get_queryset().filter(sender=request.user)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = KudosSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = KudosSerializer(queryset, many=True)
        return Response(serializer.data)


class KudosCategoriesView(APIView):
    """Get available kudos categories."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        categories = [
            {'value': choice[0], 'label': choice[1]}
            for choice in Kudos.Category.choices
        ]
        return Response(categories)


class UserKudosView(APIView):
    """Get kudos for a specific user."""
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        queryset = Kudos.objects.filter(
            Q(recipient_id=user_id) & (Q(is_public=True) | Q(sender=request.user) | Q(recipient=request.user))
        ).select_related(
            'sender', 'sender__position', 'sender__department',
            'recipient', 'recipient__position', 'recipient__department'
        ).order_by('-created_at')[:20]

        serializer = KudosSerializer(queryset, many=True)
        return Response(serializer.data)


class KudosStatsView(APIView):
    """Get kudos statistics."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import Count
        from django.utils import timezone
        from datetime import timedelta

        # Stats for last 30 days
        thirty_days_ago = timezone.now() - timedelta(days=30)

        # Top recipients
        top_recipients = Kudos.objects.filter(
            created_at__gte=thirty_days_ago,
            is_public=True
        ).values(
            'recipient__id',
            'recipient__first_name',
            'recipient__last_name'
        ).annotate(
            count=Count('id')
        ).order_by('-count')[:5]

        # Category distribution
        category_stats = Kudos.objects.filter(
            created_at__gte=thirty_days_ago,
            is_public=True
        ).values('category').annotate(
            count=Count('id')
        ).order_by('-count')

        # Add category labels
        category_labels = dict(Kudos.Category.choices)
        for stat in category_stats:
            stat['label'] = category_labels.get(stat['category'], stat['category'])

        return Response({
            'top_recipients': [
                {
                    'id': r['recipient__id'],
                    'full_name': f"{r['recipient__first_name']} {r['recipient__last_name']}",
                    'count': r['count']
                }
                for r in top_recipients
            ],
            'category_stats': list(category_stats),
            'total_count': Kudos.objects.filter(
                created_at__gte=thirty_days_ago,
                is_public=True
            ).count()
        })
