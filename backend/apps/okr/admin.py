from django.contrib import admin
from .models import OKRPeriod, Objective, KeyResult, CheckIn


@admin.register(OKRPeriod)
class OKRPeriodAdmin(admin.ModelAdmin):
    list_display = ['name', 'type', 'starts_at', 'ends_at', 'is_active']
    list_filter = ['type', 'is_active']
    search_fields = ['name']


class KeyResultInline(admin.TabularInline):
    model = KeyResult
    extra = 0
    fields = ['title', 'type', 'target_value', 'current_value', 'progress', 'order']


@admin.register(Objective)
class ObjectiveAdmin(admin.ModelAdmin):
    list_display = ['title', 'period', 'level', 'owner', 'status', 'progress']
    list_filter = ['status', 'level', 'period']
    search_fields = ['title', 'description']
    inlines = [KeyResultInline]

    def progress(self, obj):
        return f"{obj.progress}%"
    progress.short_description = 'Прогресс'


@admin.register(KeyResult)
class KeyResultAdmin(admin.ModelAdmin):
    list_display = ['title', 'objective', 'type', 'current_value', 'target_value', 'progress']
    list_filter = ['type', 'objective__status']
    search_fields = ['title']


@admin.register(CheckIn)
class CheckInAdmin(admin.ModelAdmin):
    list_display = ['key_result', 'author', 'previous_value', 'new_value', 'created_at']
    list_filter = ['created_at']
    search_fields = ['comment']
