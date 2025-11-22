"""
API URL configuration for version 1.
"""
from django.urls import path, include

urlpatterns = [
    # Authentication
    path('auth/', include('apps.accounts.urls.auth_urls')),

    # Users
    path('users/', include('apps.accounts.urls.user_urls')),

    # Organization
    path('organization/', include('apps.organization.urls')),

    # Skills
    path('skills/', include('apps.skills.urls')),

    # Achievements
    path('achievements/', include('apps.achievements.urls')),

    # News
    path('news/', include('apps.news.urls')),

    # Notifications
    path('notifications/', include('apps.notifications.urls')),

    # Admin endpoints
    path('admin/', include('apps.roles.urls')),
    path('admin/audit/', include('apps.audit.urls')),
]
