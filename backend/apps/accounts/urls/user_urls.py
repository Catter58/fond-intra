"""
User URLs.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.accounts.views import (
    CurrentUserView,
    CurrentUserAvatarView,
    UserListView,
    UserDetailView,
    UserSearchView,
    DashboardStatsView,
    BirthdayListView,
    AdminUserViewSet,
    UserStatusViewSet,
    CompleteOnboardingView,
    ResetOnboardingView,
    DashboardSettingsView,
)
from apps.skills.views import UserSkillsView

# Admin router
admin_router = DefaultRouter()
admin_router.register('', AdminUserViewSet, basename='admin-users')

urlpatterns = [
    # Current user
    path('me/', CurrentUserView.as_view(), name='user-me'),
    path('me/avatar/', CurrentUserAvatarView.as_view(), name='user-me-avatar'),
    path('me/complete-onboarding/', CompleteOnboardingView.as_view(), name='complete-onboarding'),
    path('me/reset-onboarding/', ResetOnboardingView.as_view(), name='reset-onboarding'),
    path('me/dashboard-settings/', DashboardSettingsView.as_view(), name='dashboard-settings'),

    # User list and search
    path('', UserListView.as_view(), name='user-list'),
    path('search/', UserSearchView.as_view(), name='user-search'),
    path('birthdays/', BirthdayListView.as_view(), name='user-birthdays'),
    path('dashboard-stats/', DashboardStatsView.as_view(), name='dashboard-stats'),

    # User detail
    path('<int:pk>/', UserDetailView.as_view(), name='user-detail'),

    # User skills
    path('<int:user_id>/skills/', UserSkillsView.as_view(), name='user-skills'),

    # User statuses
    path('<int:user_id>/statuses/', UserStatusViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='user-statuses'),
    path('<int:user_id>/statuses/current/', UserStatusViewSet.as_view({
        'get': 'current'
    }), name='user-status-current'),
    path('<int:user_id>/statuses/<int:pk>/', UserStatusViewSet.as_view({
        'delete': 'destroy'
    }), name='user-status-delete'),

    # Admin endpoints
    path('admin/', include(admin_router.urls)),
]
