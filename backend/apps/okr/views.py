from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import OKRPeriod, Objective, KeyResult, CheckIn
from .serializers import (
    OKRPeriodSerializer,
    ObjectiveListSerializer, ObjectiveDetailSerializer,
    ObjectiveCreateSerializer, ObjectiveUpdateSerializer,
    ObjectiveTreeSerializer,
    KeyResultSerializer, KeyResultCreateSerializer, KeyResultUpdateSerializer,
    CheckInSerializer, CheckInCreateSerializer
)


class OKRPeriodViewSet(viewsets.ModelViewSet):
    """ViewSet для периодов OKR"""
    queryset = OKRPeriod.objects.all()
    serializer_class = OKRPeriodSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['type', 'is_active']
    ordering_fields = ['starts_at', 'ends_at', 'name']
    ordering = ['-starts_at']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return super().get_permissions()

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Получить активный период"""
        period = self.queryset.filter(is_active=True).first()
        if period:
            serializer = self.get_serializer(period)
            return Response(serializer.data)
        return Response({'detail': 'Активный период не найден'}, status=404)


class ObjectiveViewSet(viewsets.ModelViewSet):
    """ViewSet для целей (Objectives)"""
    queryset = Objective.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['period', 'level', 'status', 'owner', 'department']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'title', 'status']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return ObjectiveListSerializer
        elif self.action == 'retrieve':
            return ObjectiveDetailSerializer
        elif self.action == 'create':
            return ObjectiveCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ObjectiveUpdateSerializer
        return ObjectiveListSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user

        # Фильтр "Мои OKR"
        if self.action == 'my':
            return qs.filter(owner=user)

        # Фильтр "Команда" - OKR подчинённых
        if self.action == 'team':
            subordinates = user.subordinates.values_list('id', flat=True)
            return qs.filter(Q(owner=user) | Q(owner__in=subordinates))

        # Фильтр "Компания" - только company level
        if self.action == 'company':
            return qs.filter(level=Objective.Level.COMPANY)

        return qs

    def perform_create(self, serializer):
        # Владелец по умолчанию - текущий пользователь
        owner = self.request.user
        if 'owner_id' in self.request.data:
            from apps.accounts.models import User
            owner = User.objects.get(id=self.request.data['owner_id'])
        serializer.save(owner=owner)

    @action(detail=False, methods=['get'])
    def my(self, request):
        """Получить OKR текущего пользователя"""
        queryset = self.filter_queryset(self.get_queryset())
        serializer = ObjectiveListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def team(self, request):
        """Получить OKR команды (подчинённых)"""
        queryset = self.filter_queryset(self.get_queryset())
        serializer = ObjectiveListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def company(self, request):
        """Получить OKR компании"""
        queryset = self.filter_queryset(self.get_queryset())
        serializer = ObjectiveListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def tree(self, request):
        """Получить дерево целей"""
        period_id = request.query_params.get('period')
        queryset = self.queryset.filter(parent__isnull=True)
        if period_id:
            queryset = queryset.filter(period_id=period_id)
        queryset = queryset.filter(status__in=['active', 'completed'])
        serializer = ObjectiveTreeSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='key-results')
    def add_key_result(self, request, pk=None):
        """Добавить Key Result к цели"""
        objective = self.get_object()

        # Проверка прав (владелец или админ)
        if objective.owner != request.user and not request.user.is_staff:
            return Response(
                {'detail': 'Вы не можете добавлять KR к этой цели'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = KeyResultCreateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(objective=objective)
            return Response(
                KeyResultSerializer(serializer.instance).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def check_ins(self, request, pk=None):
        """Получить историю check-ins для цели"""
        objective = self.get_object()
        check_ins = CheckIn.objects.filter(
            key_result__objective=objective
        ).order_by('-created_at')
        serializer = CheckInSerializer(check_ins, many=True)
        return Response(serializer.data)


class KeyResultViewSet(viewsets.ModelViewSet):
    """ViewSet для ключевых результатов"""
    queryset = KeyResult.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return KeyResultCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return KeyResultUpdateSerializer
        return KeyResultSerializer

    def get_permissions(self):
        return super().get_permissions()

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        # Только владелец objective или админ
        if obj.objective.owner != request.user and not request.user.is_staff:
            self.permission_denied(request, message='Нет прав на изменение этого KR')

    @action(detail=True, methods=['post'], url_path='check-in')
    def check_in(self, request, pk=None):
        """Создать check-in для KR"""
        key_result = self.get_object()

        # Проверка прав
        if key_result.objective.owner != request.user and not request.user.is_staff:
            return Response(
                {'detail': 'Вы не можете добавлять check-in к этому KR'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = CheckInCreateSerializer(data=request.data)
        if serializer.is_valid():
            # Сохраняем предыдущие значения
            previous_value = key_result.current_value
            previous_progress = key_result.progress

            # Обновляем KR
            new_value = serializer.validated_data['new_value']
            key_result.current_value = new_value
            key_result.save()

            # Создаём check-in
            check_in = CheckIn.objects.create(
                key_result=key_result,
                author=request.user,
                previous_value=previous_value,
                new_value=new_value,
                previous_progress=previous_progress,
                new_progress=key_result.progress,
                comment=serializer.validated_data.get('comment', '')
            )

            return Response(
                CheckInSerializer(check_in).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """Получить историю check-ins для KR"""
        key_result = self.get_object()
        check_ins = key_result.check_ins.all()
        serializer = CheckInSerializer(check_ins, many=True)
        return Response(serializer.data)


class LevelsView(viewsets.ViewSet):
    """ViewSet для получения списка уровней"""
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        levels = [
            {'value': choice[0], 'label': choice[1]}
            for choice in Objective.Level.choices
        ]
        return Response(levels)


class StatusesView(viewsets.ViewSet):
    """ViewSet для получения списка статусов"""
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        statuses = [
            {'value': choice[0], 'label': choice[1]}
            for choice in Objective.Status.choices
        ]
        return Response(statuses)


class OKRStatsView(viewsets.ViewSet):
    """ViewSet для статистики OKR"""
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        from django.db.models import Avg, Count
        from django.db.models.functions import TruncDate

        user = request.user
        period_id = request.query_params.get('period')

        # Base queryset
        objectives_qs = Objective.objects.all()
        if period_id:
            objectives_qs = objectives_qs.filter(period_id=period_id)

        # My objectives
        my_objectives = objectives_qs.filter(owner=user)
        my_active = my_objectives.filter(status=Objective.Status.ACTIVE)

        # Calculate average progress for my objectives
        my_avg_progress = my_active.aggregate(avg=Avg('key_results__progress'))['avg'] or 0

        # Count by status
        my_by_status = {}
        for status_choice in Objective.Status.choices:
            my_by_status[status_choice[0]] = my_objectives.filter(status=status_choice[0]).count()

        # Count by level
        my_by_level = {}
        for level_choice in Objective.Level.choices:
            my_by_level[level_choice[0]] = my_objectives.filter(level=level_choice[0]).count()

        # Team objectives (subordinates)
        subordinates = user.subordinates.values_list('id', flat=True)
        team_objectives = objectives_qs.filter(Q(owner=user) | Q(owner__in=subordinates))
        team_active = team_objectives.filter(status=Objective.Status.ACTIVE)
        team_avg_progress = team_active.aggregate(avg=Avg('key_results__progress'))['avg'] or 0

        # Company objectives
        company_objectives = objectives_qs.filter(level=Objective.Level.COMPANY)
        company_active = company_objectives.filter(status=Objective.Status.ACTIVE)
        company_avg_progress = company_active.aggregate(avg=Avg('key_results__progress'))['avg'] or 0

        # Key Results stats
        my_key_results = KeyResult.objects.filter(objective__in=my_objectives)
        kr_total = my_key_results.count()
        kr_completed = my_key_results.filter(progress__gte=100).count()
        kr_in_progress = my_key_results.filter(progress__gt=0, progress__lt=100).count()
        kr_not_started = my_key_results.filter(progress=0).count()

        # Progress distribution for my active objectives
        progress_distribution = {
            '0-25': my_active.filter(key_results__progress__gte=0, key_results__progress__lt=25).distinct().count(),
            '25-50': my_active.filter(key_results__progress__gte=25, key_results__progress__lt=50).distinct().count(),
            '50-75': my_active.filter(key_results__progress__gte=50, key_results__progress__lt=75).distinct().count(),
            '75-100': my_active.filter(key_results__progress__gte=75, key_results__progress__lte=100).distinct().count(),
        }

        # Recent check-ins
        recent_check_ins = CheckIn.objects.filter(
            key_result__objective__owner=user
        ).order_by('-created_at')[:5]

        recent_check_ins_data = []
        for ci in recent_check_ins:
            recent_check_ins_data.append({
                'id': ci.id,
                'key_result_title': ci.key_result.title,
                'objective_title': ci.key_result.objective.title,
                'previous_value': float(ci.previous_value),
                'new_value': float(ci.new_value),
                'previous_progress': ci.previous_progress,
                'new_progress': ci.new_progress,
                'comment': ci.comment,
                'created_at': ci.created_at.isoformat(),
            })

        # Top objectives by progress
        top_objectives = my_active.order_by('-key_results__progress')[:5]
        top_objectives_data = []
        for obj in top_objectives:
            top_objectives_data.append({
                'id': obj.id,
                'title': obj.title,
                'level': obj.level,
                'progress': obj.progress,
                'key_results_count': obj.key_results.count(),
            })

        return Response({
            'my_stats': {
                'total': my_objectives.count(),
                'active': my_active.count(),
                'avg_progress': round(my_avg_progress, 1),
                'by_status': my_by_status,
                'by_level': my_by_level,
            },
            'team_stats': {
                'total': team_objectives.count(),
                'active': team_active.count(),
                'avg_progress': round(team_avg_progress, 1),
            },
            'company_stats': {
                'total': company_objectives.count(),
                'active': company_active.count(),
                'avg_progress': round(company_avg_progress, 1),
            },
            'key_results': {
                'total': kr_total,
                'completed': kr_completed,
                'in_progress': kr_in_progress,
                'not_started': kr_not_started,
            },
            'progress_distribution': progress_distribution,
            'recent_check_ins': recent_check_ins_data,
            'top_objectives': top_objectives_data,
        })
