"""
Authentication URLs.
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from apps.accounts.views import (
    LoginView,
    LogoutView,
    PasswordChangeView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    TwoFactorStatusView,
    TwoFactorSetupView,
    TwoFactorVerifyView,
    TwoFactorDisableView,
    TwoFactorBackupCodesView,
    TwoFactorAuthenticateView,
    UserSessionListView,
    UserSessionTerminateView,
    UserSessionTerminateAllView,
)

urlpatterns = [
    path('login/', LoginView.as_view(), name='auth-login'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='auth-token-refresh'),
    path('password/change/', PasswordChangeView.as_view(), name='auth-password-change'),
    path('password/reset/', PasswordResetRequestView.as_view(), name='auth-password-reset'),
    path('password/reset/confirm/', PasswordResetConfirmView.as_view(), name='auth-password-reset-confirm'),

    # Two-Factor Authentication
    path('2fa/status/', TwoFactorStatusView.as_view(), name='auth-2fa-status'),
    path('2fa/setup/', TwoFactorSetupView.as_view(), name='auth-2fa-setup'),
    path('2fa/verify/', TwoFactorVerifyView.as_view(), name='auth-2fa-verify'),
    path('2fa/disable/', TwoFactorDisableView.as_view(), name='auth-2fa-disable'),
    path('2fa/backup-codes/', TwoFactorBackupCodesView.as_view(), name='auth-2fa-backup-codes'),
    path('2fa/authenticate/', TwoFactorAuthenticateView.as_view(), name='auth-2fa-authenticate'),

    # User Sessions
    path('sessions/', UserSessionListView.as_view(), name='auth-sessions'),
    path('sessions/<int:session_id>/terminate/', UserSessionTerminateView.as_view(), name='auth-session-terminate'),
    path('sessions/terminate-all/', UserSessionTerminateAllView.as_view(), name='auth-sessions-terminate-all'),
]
