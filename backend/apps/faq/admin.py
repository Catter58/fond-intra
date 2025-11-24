from django.contrib import admin
from .models import FAQCategory, FAQItem


class FAQItemInline(admin.TabularInline):
    model = FAQItem
    extra = 0
    fields = ('question', 'order', 'is_published', 'views_count')
    readonly_fields = ('views_count',)


@admin.register(FAQCategory)
class FAQCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'order', 'is_active', 'items_count')
    list_filter = ('is_active',)
    search_fields = ('name', 'description')
    prepopulated_fields = {'slug': ('name',)}
    ordering = ('order', 'name')
    inlines = [FAQItemInline]

    def items_count(self, obj):
        return obj.items.count()
    items_count.short_description = 'Вопросов'


@admin.register(FAQItem)
class FAQItemAdmin(admin.ModelAdmin):
    list_display = ('question', 'category', 'order', 'is_published', 'views_count')
    list_filter = ('category', 'is_published')
    search_fields = ('question', 'answer')
    ordering = ('category__order', 'order')
    readonly_fields = ('views_count', 'created_at', 'updated_at')
