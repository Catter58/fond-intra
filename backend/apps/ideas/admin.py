"""
Admin configuration for ideas app.
"""
from django.contrib import admin
from .models import Idea, IdeaVote, IdeaComment


class IdeaCommentInline(admin.TabularInline):
    model = IdeaComment
    extra = 0
    readonly_fields = ['author', 'created_at']


@admin.register(Idea)
class IdeaAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'category', 'status', 'votes_score', 'created_at']
    list_filter = ['status', 'category', 'created_at']
    search_fields = ['title', 'description']
    inlines = [IdeaCommentInline]
    readonly_fields = ['created_at', 'updated_at']


@admin.register(IdeaVote)
class IdeaVoteAdmin(admin.ModelAdmin):
    list_display = ['idea', 'user', 'is_upvote', 'created_at']
    list_filter = ['is_upvote', 'created_at']


@admin.register(IdeaComment)
class IdeaCommentAdmin(admin.ModelAdmin):
    list_display = ['idea', 'author', 'text', 'created_at']
    list_filter = ['created_at']
    search_fields = ['text']
