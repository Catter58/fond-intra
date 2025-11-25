from django.contrib import admin
from .models import ResourceType, Resource, Booking


@admin.register(ResourceType)
class ResourceTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'is_active', 'order']
    list_filter = ['is_active']
    search_fields = ['name']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ['name', 'type', 'location', 'capacity', 'is_active']
    list_filter = ['type', 'is_active']
    search_fields = ['name', 'description', 'location']


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['title', 'resource', 'user', 'starts_at', 'ends_at', 'status']
    list_filter = ['status', 'resource__type', 'starts_at']
    search_fields = ['title', 'user__email', 'user__first_name', 'user__last_name']
    date_hierarchy = 'starts_at'
    raw_id_fields = ['user', 'resource']
