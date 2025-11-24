from django.contrib import admin
from .models import ClassifiedCategory, Classified, ClassifiedImage


class ClassifiedImageInline(admin.TabularInline):
    model = ClassifiedImage
    extra = 0


@admin.register(ClassifiedCategory)
class ClassifiedCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'order', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Classified)
class ClassifiedAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'author', 'status', 'price', 'views_count', 'created_at')
    list_filter = ('status', 'category')
    search_fields = ('title', 'description', 'author__email')
    readonly_fields = ('views_count', 'created_at', 'updated_at')
    inlines = [ClassifiedImageInline]
