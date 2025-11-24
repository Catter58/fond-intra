"""
Admin configuration for surveys app.
"""
from django.contrib import admin
from .models import Survey, Question, QuestionOption, Response, Answer


class QuestionOptionInline(admin.TabularInline):
    model = QuestionOption
    extra = 1


class QuestionInline(admin.StackedInline):
    model = Question
    extra = 1


@admin.register(Survey)
class SurveyAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'status', 'is_anonymous', 'starts_at', 'ends_at', 'created_at']
    list_filter = ['status', 'is_anonymous', 'target_type']
    search_fields = ['title', 'description']
    inlines = [QuestionInline]
    filter_horizontal = ['target_departments', 'target_roles']


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['text', 'survey', 'type', 'is_required', 'order']
    list_filter = ['type', 'is_required']
    search_fields = ['text']
    inlines = [QuestionOptionInline]


@admin.register(QuestionOption)
class QuestionOptionAdmin(admin.ModelAdmin):
    list_display = ['text', 'question', 'order']
    search_fields = ['text']


@admin.register(Response)
class ResponseAdmin(admin.ModelAdmin):
    list_display = ['survey', 'user', 'created_at']
    list_filter = ['survey', 'created_at']


@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ['response', 'question', 'text_value', 'scale_value']
    list_filter = ['question__type']
