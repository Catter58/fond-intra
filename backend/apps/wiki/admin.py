from django.contrib import admin
from .models import WikiSpace, WikiPage, WikiPageVersion, WikiTag, WikiAttachment


@admin.register(WikiSpace)
class WikiSpaceAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'owner', 'department', 'is_public', 'order', 'created_at']
    list_filter = ['is_public', 'department']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    filter_horizontal = ['allowed_departments', 'allowed_roles']


@admin.register(WikiTag)
class WikiTagAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'color']
    search_fields = ['name']
    prepopulated_fields = {'slug': ('name',)}


class WikiAttachmentInline(admin.TabularInline):
    model = WikiAttachment
    extra = 0
    readonly_fields = ['size', 'mime_type', 'created_at']


@admin.register(WikiPage)
class WikiPageAdmin(admin.ModelAdmin):
    list_display = ['title', 'space', 'author', 'is_published', 'is_archived', 'view_count', 'updated_at']
    list_filter = ['space', 'is_published', 'is_archived', 'tags']
    search_fields = ['title', 'excerpt']
    prepopulated_fields = {'slug': ('title',)}
    filter_horizontal = ['tags']
    inlines = [WikiAttachmentInline]
    readonly_fields = ['view_count', 'depth']


@admin.register(WikiPageVersion)
class WikiPageVersionAdmin(admin.ModelAdmin):
    list_display = ['page', 'version_number', 'author', 'change_summary', 'created_at']
    list_filter = ['page__space']
    search_fields = ['page__title', 'change_summary']
    readonly_fields = ['page', 'version_number', 'content', 'title', 'author', 'created_at']


@admin.register(WikiAttachment)
class WikiAttachmentAdmin(admin.ModelAdmin):
    list_display = ['filename', 'page', 'uploaded_by', 'size', 'mime_type', 'created_at']
    list_filter = ['page__space', 'mime_type']
    search_fields = ['filename', 'page__title']
    readonly_fields = ['size', 'mime_type']
