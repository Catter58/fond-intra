"""
API URL configuration for version 1.
"""
from django.urls import path, include

urlpatterns = [
    # Global search
    path('', include('core.urls')),

    # Authentication
    path('auth/', include('apps.accounts.urls.auth_urls')),

    # Users
    path('users/', include('apps.accounts.urls.user_urls')),

    # Organization
    path('organization/', include('apps.organization.urls')),

    # Skills
    path('skills/', include('apps.skills.urls')),
    path('user-skills/', include('apps.skills.endorsement_urls')),  # Separate URL for endorsements

    # Achievements
    path('achievements/', include('apps.achievements.urls')),

    # News
    path('news/', include('apps.news.urls')),

    # Notifications
    path('notifications/', include('apps.notifications.urls')),

    # Kudos
    path('kudos/', include('apps.kudos.urls')),

    # Surveys
    path('surveys/', include('apps.surveys.urls')),

    # Ideas
    path('ideas/', include('apps.ideas.urls')),

    # FAQ
    path('faq/', include('apps.faq.urls')),

    # Classifieds
    path('classifieds/', include('apps.classifieds.urls')),

    # Admin endpoints
    path('admin/', include('apps.roles.urls')),
    path('admin/audit/', include('apps.audit.urls')),
]
