"""
Serializers for surveys app.
"""
from rest_framework import serializers
from django.db import transaction
from .models import Survey, Question, QuestionOption, Response, Answer


class QuestionOptionSerializer(serializers.ModelSerializer):
    """Serializer for question options."""

    class Meta:
        model = QuestionOption
        fields = ['id', 'text', 'order']


class QuestionSerializer(serializers.ModelSerializer):
    """Serializer for survey questions."""
    options = QuestionOptionSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = [
            'id', 'text', 'type', 'is_required', 'order',
            'scale_min', 'scale_max', 'scale_min_label', 'scale_max_label',
            'options'
        ]


class QuestionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating questions with options."""
    options = QuestionOptionSerializer(many=True, required=False)

    class Meta:
        model = Question
        fields = [
            'id', 'text', 'type', 'is_required', 'order',
            'scale_min', 'scale_max', 'scale_min_label', 'scale_max_label',
            'options'
        ]

    def create(self, validated_data):
        options_data = validated_data.pop('options', [])
        question = Question.objects.create(**validated_data)
        for option_data in options_data:
            QuestionOption.objects.create(question=question, **option_data)
        return question

    def update(self, instance, validated_data):
        options_data = validated_data.pop('options', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if options_data is not None:
            instance.options.all().delete()
            for option_data in options_data:
                QuestionOption.objects.create(question=instance, **option_data)

        return instance


class SurveyListSerializer(serializers.ModelSerializer):
    """Serializer for survey list view."""
    author_id = serializers.IntegerField(source='author.id', read_only=True)
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)
    questions_count = serializers.IntegerField(read_only=True)
    responses_count = serializers.IntegerField(read_only=True)
    has_responded = serializers.SerializerMethodField()

    class Meta:
        model = Survey
        fields = [
            'id', 'title', 'description', 'author_id', 'author_name', 'status',
            'is_anonymous', 'is_required', 'starts_at', 'ends_at', 'target_type',
            'questions_count', 'responses_count', 'has_responded', 'created_at'
        ]

    def get_has_responded(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.has_user_responded(request.user)
        return False


class SurveyDetailSerializer(serializers.ModelSerializer):
    """Serializer for survey detail view with questions."""
    author_id = serializers.IntegerField(source='author.id', read_only=True)
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)
    questions = QuestionSerializer(many=True, read_only=True)
    questions_count = serializers.IntegerField(read_only=True)
    responses_count = serializers.IntegerField(read_only=True)
    has_responded = serializers.SerializerMethodField()

    class Meta:
        model = Survey
        fields = [
            'id', 'title', 'description', 'author_id', 'author_name', 'status',
            'is_anonymous', 'is_required', 'starts_at', 'ends_at',
            'target_type', 'questions', 'questions_count', 'responses_count',
            'has_responded', 'created_at'
        ]

    def get_has_responded(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.has_user_responded(request.user)
        return False


class SurveyCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating surveys."""
    questions = QuestionCreateSerializer(many=True, required=False)

    class Meta:
        model = Survey
        fields = [
            'id', 'title', 'description', 'is_anonymous', 'is_required',
            'status', 'starts_at', 'ends_at', 'target_type',
            'target_departments', 'target_roles', 'questions'
        ]

    def create(self, validated_data):
        questions_data = validated_data.pop('questions', [])
        target_departments = validated_data.pop('target_departments', [])
        target_roles = validated_data.pop('target_roles', [])

        with transaction.atomic():
            survey = Survey.objects.create(**validated_data)
            survey.target_departments.set(target_departments)
            survey.target_roles.set(target_roles)

            for idx, question_data in enumerate(questions_data):
                options_data = question_data.pop('options', [])
                question = Question.objects.create(
                    survey=survey,
                    order=idx,
                    **question_data
                )
                for opt_idx, option_data in enumerate(options_data):
                    QuestionOption.objects.create(
                        question=question,
                        order=opt_idx,
                        **option_data
                    )

        return survey

    def update(self, instance, validated_data):
        questions_data = validated_data.pop('questions', None)
        target_departments = validated_data.pop('target_departments', None)
        target_roles = validated_data.pop('target_roles', None)

        with transaction.atomic():
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()

            if target_departments is not None:
                instance.target_departments.set(target_departments)
            if target_roles is not None:
                instance.target_roles.set(target_roles)

            if questions_data is not None:
                instance.questions.all().delete()
                for idx, question_data in enumerate(questions_data):
                    options_data = question_data.pop('options', [])
                    question = Question.objects.create(
                        survey=instance,
                        order=idx,
                        **question_data
                    )
                    for opt_idx, option_data in enumerate(options_data):
                        QuestionOption.objects.create(
                            question=question,
                            order=opt_idx,
                            **option_data
                        )

        return instance


class AnswerSerializer(serializers.ModelSerializer):
    """Serializer for answers."""

    class Meta:
        model = Answer
        fields = ['question', 'selected_options', 'text_value', 'scale_value']


class ResponseCreateSerializer(serializers.Serializer):
    """Serializer for submitting survey responses."""
    answers = serializers.ListField(child=serializers.DictField())

    def validate_answers(self, value):
        survey = self.context.get('survey')
        if not survey:
            raise serializers.ValidationError("Опрос не найден")

        required_questions = survey.questions.filter(is_required=True)
        answered_question_ids = {a.get('question_id') for a in value}

        for question in required_questions:
            if question.id not in answered_question_ids:
                raise serializers.ValidationError(
                    f"Вопрос '{question.text[:50]}...' обязателен для ответа"
                )

        return value

    def create(self, validated_data):
        survey = self.context.get('survey')
        user = self.context.get('request').user
        answers_data = validated_data.get('answers', [])

        with transaction.atomic():
            response = Response.objects.create(
                survey=survey,
                user=user if not survey.is_anonymous else None
            )

            for answer_data in answers_data:
                question_id = answer_data.get('question_id')
                try:
                    question = survey.questions.get(id=question_id)
                except Question.DoesNotExist:
                    continue

                answer = Answer.objects.create(
                    response=response,
                    question=question,
                    text_value=answer_data.get('text_value', ''),
                    scale_value=answer_data.get('scale_value')
                )

                selected_option_ids = answer_data.get('selected_options', [])
                if selected_option_ids:
                    options = QuestionOption.objects.filter(
                        id__in=selected_option_ids,
                        question=question
                    )
                    answer.selected_options.set(options)

        return response


class SurveyResultsSerializer(serializers.Serializer):
    """Serializer for survey results/statistics."""
    total_responses = serializers.IntegerField()
    questions = serializers.ListField()
