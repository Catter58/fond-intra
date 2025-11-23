"""
Notifications URLs.
"""
from django.urls import path

from apps.notifications.views import (
    NotificationListView,
    UnreadCountView,
    MarkAsReadView,
    MarkAllAsReadView,
    NotificationSettingsView,
)

urlpatterns = [
    path('', NotificationListView.as_view(), name='notifications-list'),
    path('unread-count/', UnreadCountView.as_view(), name='notifications-unread-count'),
    path('<int:pk>/read/', MarkAsReadView.as_view(), name='notification-read'),
    path('read-all/', MarkAllAsReadView.as_view(), name='notifications-read-all'),
    path('settings/', NotificationSettingsView.as_view(), name='notification-settings'),
]
