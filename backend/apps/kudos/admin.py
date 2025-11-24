from django.contrib import admin
from .models import Kudos


@admin.register(Kudos)
class KudosAdmin(admin.ModelAdmin):
    list_display = ['sender', 'recipient', 'category', 'is_public', 'created_at']
    list_filter = ['category', 'is_public', 'created_at']
    search_fields = ['sender__email', 'recipient__email', 'message']
    raw_id_fields = ['sender', 'recipient']
    date_hierarchy = 'created_at'
