"""
Views for surveys app.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response as DRFResponse
from rest_framework.views import APIView
from django.db.models import Count, Avg, Q
from django.utils import timezone

from core.pagination import StandardPagination
from .models import Survey, Question, QuestionOption, Response, Answer
from .serializers import (
    SurveyListSerializer,
    SurveyDetailSerializer,
    SurveyCreateSerializer,
    QuestionCreateSerializer,
    ResponseCreateSerializer,
    SurveyResultsSerializer,
)


class SurveyViewSet(viewsets.ModelViewSet):
    """
    ViewSet for surveys.

    list: Get available surveys for current user
    create: Create new survey (admin/HR)
    retrieve: Get survey details with questions
    update: Update survey (admin/HR)
    destroy: Delete survey (admin/HR)
    """
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination

    def get_queryset(self):
        user = self.request.user
        queryset = Survey.objects.select_related('author').prefetch_related(
            'questions', 'questions__options', 'target_departments', 'target_roles'
        ).annotate(
            questions_count=Count('questions', distinct=True),
            responses_count=Count('responses', distinct=True)
        )

        # Admin/HR can see all surveys
        if user.is_superuser or (user.role and user.role.is_admin):
            return queryset.order_by('-created_at')

        # Regular users see only active surveys they can participate in
        now = timezone.now()
        queryset = queryset.filter(
            status=Survey.Status.ACTIVE,
            starts_at__lte=now
        ).filter(
            Q(ends_at__isnull=True) | Q(ends_at__gte=now)
        )

        # Filter by target audience
        filtered_ids = []
        for survey in queryset:
            if survey.is_user_in_target(user):
                filtered_ids.append(survey.id)

        return queryset.filter(id__in=filtered_ids).order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'list':
            return SurveyListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return SurveyCreateSerializer
        return SurveyDetailSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=False, methods=['get'])
    def my(self, request):
        """Get surveys created by current user."""
        queryset = Survey.objects.filter(author=request.user).annotate(
            questions_count=Count('questions', distinct=True),
            responses_count=Count('responses', distinct=True)
        ).order_by('-created_at')
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = SurveyListSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        serializer = SurveyListSerializer(queryset, many=True, context={'request': request})
        return DRFResponse(serializer.data)

    @action(detail=True, methods=['post'])
    def respond(self, request, pk=None):
        """Submit response to a survey."""
        survey = self.get_object()

        # Check if survey is active
        if survey.status != Survey.Status.ACTIVE:
            return DRFResponse(
                {'detail': 'Этот опрос недоступен для ответов.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user is in target audience
        if not survey.is_user_in_target(request.user):
            return DRFResponse(
                {'detail': 'Вы не входите в целевую аудиторию этого опроса.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if user has already responded
        if survey.has_user_responded(request.user):
            return DRFResponse(
                {'detail': 'Вы уже прошли этот опрос.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = ResponseCreateSerializer(
            data=request.data,
            context={'request': request, 'survey': survey}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return DRFResponse({'detail': 'Ответ успешно сохранён.'}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def results(self, request, pk=None):
        """Get survey results (for admin/author)."""
        survey = self.get_object()

        # Only author or admin can see results
        if survey.author != request.user and not request.user.is_superuser:
            if not (request.user.role and request.user.role.is_admin):
                return DRFResponse(
                    {'detail': 'У вас нет доступа к результатам этого опроса.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        questions_data = []
        for question in survey.questions.all():
            question_result = {
                'id': question.id,
                'text': question.text,
                'type': question.type,
                'total_answers': question.answers.count(),
            }

            if question.type in [Question.QuestionType.SINGLE_CHOICE, Question.QuestionType.MULTIPLE_CHOICE]:
                options_stats = []
                for option in question.options.all():
                    count = Answer.objects.filter(
                        question=question,
                        selected_options=option
                    ).count()
                    options_stats.append({
                        'id': option.id,
                        'text': option.text,
                        'count': count,
                        'percentage': round(count / max(question_result['total_answers'], 1) * 100, 1)
                    })
                question_result['options_stats'] = options_stats

            elif question.type in [Question.QuestionType.SCALE, Question.QuestionType.NPS]:
                answers = question.answers.exclude(scale_value__isnull=True)
                avg_value = answers.aggregate(avg=Avg('scale_value'))['avg']
                question_result['average'] = round(avg_value, 2) if avg_value else None

                # Distribution
                distribution = {}
                min_val = question.scale_min if question.type == Question.QuestionType.SCALE else 0
                max_val = question.scale_max if question.type == Question.QuestionType.SCALE else 10
                for val in range(min_val, max_val + 1):
                    count = answers.filter(scale_value=val).count()
                    distribution[val] = count
                question_result['distribution'] = distribution

                # NPS calculation
                if question.type == Question.QuestionType.NPS:
                    promoters = answers.filter(scale_value__gte=9).count()
                    detractors = answers.filter(scale_value__lte=6).count()
                    total = answers.count()
                    if total > 0:
                        nps = ((promoters - detractors) / total) * 100
                        question_result['nps_score'] = round(nps, 1)

            elif question.type == Question.QuestionType.TEXT:
                text_answers = question.answers.exclude(text_value='').values_list('text_value', flat=True)
                question_result['text_answers'] = list(text_answers[:50])  # Limit to 50

            questions_data.append(question_result)

        return DRFResponse({
            'total_responses': survey.responses_count,
            'questions': questions_data
        })

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish a draft survey."""
        survey = self.get_object()
        if survey.author != request.user and not request.user.is_superuser:
            return DRFResponse(
                {'detail': 'Только автор может публиковать опрос.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if survey.questions.count() == 0:
            return DRFResponse(
                {'detail': 'Добавьте хотя бы один вопрос перед публикацией.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        survey.status = Survey.Status.ACTIVE
        if not survey.starts_at:
            survey.starts_at = timezone.now()
        survey.save()

        return DRFResponse({'detail': 'Опрос опубликован.'})

    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        """Close an active survey."""
        survey = self.get_object()
        if survey.author != request.user and not request.user.is_superuser:
            return DRFResponse(
                {'detail': 'Только автор может закрыть опрос.'},
                status=status.HTTP_403_FORBIDDEN
            )

        survey.status = Survey.Status.CLOSED
        survey.save()

        return DRFResponse({'detail': 'Опрос закрыт.'})


class SurveyStatusesView(APIView):
    """Get available survey statuses."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        statuses = [
            {'value': choice[0], 'label': choice[1]}
            for choice in Survey.Status.choices
        ]
        return DRFResponse(statuses)


class QuestionTypesView(APIView):
    """Get available question types."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        types = [
            {'value': choice[0], 'label': choice[1]}
            for choice in Question.QuestionType.choices
        ]
        return DRFResponse(types)


class TargetTypesView(APIView):
    """Get available target types."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        types = [
            {'value': choice[0], 'label': choice[1]}
            for choice in Survey.TargetType.choices
        ]
        return DRFResponse(types)
