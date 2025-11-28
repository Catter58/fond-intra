"""
URL configuration for core app.
"""
from django.urls import path
from .views import GlobalSearchView, SiteSettingsView, AdminSiteSettingsView, RegistrationView

urlpatterns = [
    path('search/', GlobalSearchView.as_view(), name='global-search'),
    path('settings/', SiteSettingsView.as_view(), name='site-settings'),
    path('register/', RegistrationView.as_view(), name='register'),
]
