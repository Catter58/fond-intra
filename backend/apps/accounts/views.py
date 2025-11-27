"""
Views for accounts app.
"""
from django.db.models import Q
from django.utils import timezone
from rest_framework import status, generics, filters
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet, GenericViewSet
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin, CreateModelMixin, DestroyModelMixin
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django_filters.rest_framework import DjangoFilterBackend

from apps.audit.models import AuditLog
from .models import User, UserStatus, TwoFactorSettings, UserSession
from .serializers import (
    CustomTokenObtainPairSerializer,
    PasswordChangeSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    UserListSerializer,
    UserDetailSerializer,
    UserPrivateDetailSerializer,
    UserProfileUpdateSerializer,
    UserAvatarSerializer,
    UserCreateSerializer,
    UserAdminUpdateSerializer,
    UserStatusSerializer,
    UserStatusCreateSerializer,
    BirthdaySerializer,
    TwoFactorStatusSerializer,
    TwoFactorSetupSerializer,
    TwoFactorVerifySerializer,
    TwoFactorDisableSerializer,
    TwoFactorBackupCodesSerializer,
    TwoFactorAuthenticateSerializer,
    UserSessionSerializer,
)
from .permissions import IsHROrAdmin, CanViewPrivateData
from .filters import UserFilter, AdminUserFilter


# =============================================================================
# Auth Views
# =============================================================================

class LoginView(TokenObtainPairView):
    """Login endpoint that returns JWT tokens."""
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        # First, validate credentials without generating tokens
        email = request.data.get('email')
        password = request.data.get('password')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Let parent handle the error
            return super().post(request, *args, **kwargs)

        # Check if user has 2FA enabled
        try:
            two_factor = user.two_factor_settings
            if two_factor.is_enabled:
                # Validate password first
                if not user.check_password(password):
                    return super().post(request, *args, **kwargs)

                # Return 2FA required response
                return Response({
                    'requires_2fa': True,
                    'user_id': user.id,
                    'message': 'Two-factor authentication required.'
                }, status=status.HTTP_200_OK)
        except TwoFactorSettings.DoesNotExist:
            pass

        # Normal login flow
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            # Log successful login
            AuditLog.log(
                user=user,
                action=AuditLog.Action.LOGIN,
                entity_type='User',
                entity_id=user.id,
                entity_repr=str(user),
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')[:500]
            )

            # Create session record with both refresh (for blacklisting) and access (for detection) JTIs
            try:
                from rest_framework_simplejwt.tokens import RefreshToken as RefreshTokenClass, AccessToken
                refresh_token_str = response.data.get('refresh')
                access_token_str = response.data.get('access')
                if refresh_token_str:
                    refresh_token = RefreshTokenClass(refresh_token_str)
                    access_jti = ''
                    if access_token_str:
                        access_token = AccessToken(access_token_str)
                        access_jti = str(access_token['jti'])
                    UserSession.create_from_request(
                        user=user,
                        token_jti=str(refresh_token['jti']),
                        request=request,
                        access_jti=access_jti
                    )
            except Exception:
                pass  # Don't fail login if session creation fails

        return response

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')


class LogoutView(APIView):
    """Logout endpoint that blacklists the refresh token."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()

            # Log logout
            AuditLog.log(
                user=request.user,
                action=AuditLog.Action.LOGOUT,
                entity_type='User',
                entity_id=request.user.id,
                entity_repr=str(request.user),
                ip_address=getattr(request, 'audit_ip', None),
                user_agent=getattr(request, 'audit_user_agent', '')
            )

            return Response({'detail': 'Successfully logged out.'})
        except Exception:
            return Response(
                {'detail': 'Invalid token.'},
                status=status.HTTP_400_BAD_REQUEST
            )


class PasswordChangeView(APIView):
    """Change password for authenticated user."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)

        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()

        # Log password change
        AuditLog.log(
            user=request.user,
            action=AuditLog.Action.PASSWORD_CHANGE,
            entity_type='User',
            entity_id=request.user.id,
            entity_repr=str(request.user),
            ip_address=getattr(request, 'audit_ip', None),
            user_agent=getattr(request, 'audit_user_agent', '')
        )

        return Response({'detail': 'Password changed successfully.'})


class PasswordResetRequestView(APIView):
    """Request password reset email."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # TODO: Send password reset email via Celery task
        # For security, always return success even if email doesn't exist

        return Response({
            'detail': 'If an account exists with this email, a reset link has been sent.'
        })


class PasswordResetConfirmView(APIView):
    """Confirm password reset with token."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # TODO: Verify token and reset password

        return Response({'detail': 'Password has been reset successfully.'})


# =============================================================================
# User Views
# =============================================================================

class CurrentUserView(APIView):
    """Get and update current authenticated user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserPrivateDetailSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserProfileUpdateSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Log profile update
        AuditLog.log(
            user=request.user,
            action=AuditLog.Action.UPDATE,
            entity_type='User',
            entity_id=request.user.id,
            entity_repr=str(request.user),
            new_values=serializer.validated_data,
            ip_address=getattr(request, 'audit_ip', None),
            user_agent=getattr(request, 'audit_user_agent', '')
        )

        return Response(UserPrivateDetailSerializer(request.user).data)


class CurrentUserAvatarView(APIView):
    """Upload and delete current user avatar."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = UserAvatarSerializer(
            request.user,
            data=request.data
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        # Return relative URL - frontend Vite proxy will handle it
        return Response({'avatar': request.user.avatar.url})

    def delete(self, request):
        if request.user.avatar:
            request.user.avatar.delete()
            request.user.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserListView(generics.ListAPIView):
    """List all active users with search and filtering."""
    serializer_class = UserListSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name', 'patronymic', 'email']
    filterset_class = UserFilter
    ordering_fields = ['last_name', 'first_name', 'hire_date']
    ordering = ['last_name', 'first_name']

    def get_queryset(self):
        return User.objects.filter(
            is_active=True,
            is_archived=False
        ).select_related('department', 'position').prefetch_related('user_skills')


class UserDetailView(generics.RetrieveAPIView):
    """Get user profile by ID."""
    permission_classes = [IsAuthenticated]
    queryset = User.objects.filter(is_active=True, is_archived=False)

    def get_serializer_class(self):
        user = self.get_object()
        request_user = self.request.user

        # Show private data for self, HR, or Admin
        if (user.id == request_user.id or
            request_user.has_permission('users.view_private')):
            return UserPrivateDetailSerializer
        return UserDetailSerializer


class UserSearchView(generics.ListAPIView):
    """Quick search users by name, email, department, or position."""
    serializer_class = UserListSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # Search returns limited results, no pagination needed

    def get_queryset(self):
        query = self.request.query_params.get('q', '')
        if len(query) < 2:
            return User.objects.none()

        return User.objects.filter(
            is_active=True,
            is_archived=False
        ).filter(
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query) |
            Q(patronymic__icontains=query) |
            Q(email__icontains=query) |
            Q(department__name__icontains=query) |
            Q(position__name__icontains=query)
        ).select_related('department', 'position').distinct()[:20]


class DashboardStatsView(APIView):
    """Get dashboard statistics."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.news.models import News
        from apps.achievements.models import AchievementAward

        users_count = User.objects.filter(is_active=True, is_archived=False).count()
        achievements_count = AchievementAward.objects.count()
        news_count = News.objects.filter(is_published=True).count()

        return Response({
            'users_count': users_count,
            'achievements_count': achievements_count,
            'news_count': news_count,
        })


class BirthdayListView(generics.ListAPIView):
    """List upcoming birthdays."""
    serializer_class = BirthdaySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        today = timezone.now().date()
        # Get users with birthdays in next 30 days
        users = User.objects.filter(
            is_active=True,
            is_archived=False,
            birth_date__isnull=False
        ).select_related('department')

        # Filter by upcoming birthdays (considering year wrap)
        upcoming = []
        for user in users:
            this_year_birthday = user.birth_date.replace(year=today.year)
            if this_year_birthday < today:
                this_year_birthday = this_year_birthday.replace(year=today.year + 1)

            days_until = (this_year_birthday - today).days
            if days_until <= 30:
                user.days_until_birthday = days_until
                upcoming.append(user)

        return sorted(upcoming, key=lambda u: u.days_until_birthday)


# =============================================================================
# Admin User Views
# =============================================================================

class AdminUserViewSet(ModelViewSet):
    """Admin CRUD for users (HR only)."""
    permission_classes = [IsAuthenticated, IsHROrAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name', 'email']
    filterset_class = AdminUserFilter
    ordering_fields = ['last_name', 'first_name', 'hire_date', 'created_at']
    ordering = ['last_name', 'first_name']

    def get_queryset(self):
        return User.objects.all().select_related('department', 'position')

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        if self.action in ['update', 'partial_update']:
            return UserAdminUpdateSerializer
        return UserPrivateDetailSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        AuditLog.log(
            user=self.request.user,
            action=AuditLog.Action.CREATE,
            entity_type='User',
            entity_id=user.id,
            entity_repr=str(user),
            new_values=serializer.validated_data,
            ip_address=getattr(self.request, 'audit_ip', None),
            user_agent=getattr(self.request, 'audit_user_agent', '')
        )

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Archive (deactivate) a user."""
        user = self.get_object()
        user.is_archived = True
        user.is_active = False
        user.archived_at = timezone.now()
        user.save()

        AuditLog.log(
            user=request.user,
            action=AuditLog.Action.ARCHIVE,
            entity_type='User',
            entity_id=user.id,
            entity_repr=str(user),
            ip_address=getattr(request, 'audit_ip', None),
            user_agent=getattr(request, 'audit_user_agent', '')
        )

        return Response({'detail': 'User archived successfully.'})

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """Restore an archived user."""
        user = self.get_object()
        user.is_archived = False
        user.is_active = True
        user.archived_at = None
        user.save()

        AuditLog.log(
            user=request.user,
            action=AuditLog.Action.RESTORE,
            entity_type='User',
            entity_id=user.id,
            entity_repr=str(user),
            ip_address=getattr(request, 'audit_ip', None),
            user_agent=getattr(request, 'audit_user_agent', '')
        )

        return Response({'detail': 'User restored successfully.'})

    @action(detail=True, methods=['post'], url_path='reset-password')
    def reset_password(self, request, pk=None):
        """Reset user password (sends email)."""
        user = self.get_object()
        # TODO: Send password reset email
        return Response({'detail': 'Password reset email sent.'})

    @action(detail=False, methods=['get'])
    def archived(self, request):
        """List archived users."""
        users = User.objects.filter(is_archived=True)
        serializer = UserListSerializer(users, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='bulk-archive')
    def bulk_archive(self, request):
        """Archive multiple users at once."""
        user_ids = request.data.get('ids', [])
        if not user_ids:
            return Response(
                {'detail': 'No user IDs provided.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        users = User.objects.filter(id__in=user_ids, is_archived=False)
        count = users.count()

        for user in users:
            user.is_archived = True
            user.is_active = False
            user.archived_at = timezone.now()
            user.save()

            AuditLog.log(
                user=request.user,
                action=AuditLog.Action.ARCHIVE,
                entity_type='User',
                entity_id=user.id,
                entity_repr=str(user),
                ip_address=getattr(request, 'audit_ip', None),
                user_agent=getattr(request, 'audit_user_agent', '')
            )

        return Response({'detail': f'{count} users archived successfully.', 'count': count})

    @action(detail=False, methods=['post'], url_path='bulk-restore')
    def bulk_restore(self, request):
        """Restore multiple users at once."""
        user_ids = request.data.get('ids', [])
        if not user_ids:
            return Response(
                {'detail': 'No user IDs provided.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        users = User.objects.filter(id__in=user_ids, is_archived=True)
        count = users.count()

        for user in users:
            user.is_archived = False
            user.is_active = True
            user.archived_at = None
            user.save()

            AuditLog.log(
                user=request.user,
                action=AuditLog.Action.RESTORE,
                entity_type='User',
                entity_id=user.id,
                entity_repr=str(user),
                ip_address=getattr(request, 'audit_ip', None),
                user_agent=getattr(request, 'audit_user_agent', '')
            )

        return Response({'detail': f'{count} users restored successfully.', 'count': count})


# =============================================================================
# UserStatus Views
# =============================================================================

class UserStatusViewSet(ListModelMixin, CreateModelMixin, DestroyModelMixin, GenericViewSet):
    """Manage user statuses."""
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user_id = self.kwargs.get('user_id')
        return UserStatus.objects.filter(user_id=user_id)

    def get_serializer_class(self):
        if self.action == 'create':
            return UserStatusCreateSerializer
        return UserStatusSerializer

    def perform_create(self, serializer):
        user_id = self.kwargs.get('user_id')
        serializer.save(
            user_id=user_id,
            created_by=self.request.user
        )

    @action(detail=False, methods=['get'])
    def current(self, request, user_id=None):
        """Get current status for user."""
        user = User.objects.get(pk=user_id)
        status = user.current_status
        if status:
            return Response(UserStatusSerializer(status).data)
        return Response(None)


# =============================================================================
# Two-Factor Authentication Views
# =============================================================================

class TwoFactorStatusView(APIView):
    """Get 2FA status for current user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            settings = request.user.two_factor_settings
            return Response(TwoFactorStatusSerializer(settings).data)
        except TwoFactorSettings.DoesNotExist:
            return Response({
                'is_enabled': False,
                'enabled_at': None,
                'backup_codes_count': 0
            })


class TwoFactorSetupView(APIView):
    """Initiate 2FA setup - generate secret and QR code."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        import io
        import base64
        import qrcode

        # Get or create 2FA settings
        settings, created = TwoFactorSettings.objects.get_or_create(
            user=request.user
        )

        # If already enabled, require disabling first
        if settings.is_enabled:
            return Response(
                {'detail': 'Two-factor authentication is already enabled. Disable it first.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Generate new secret
        secret = settings.generate_secret()
        settings.save()

        # Generate provisioning URI
        provisioning_uri = settings.get_totp_uri()

        # Generate QR code as base64
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(provisioning_uri)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")

        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        qr_base64 = base64.b64encode(buffer.getvalue()).decode()

        return Response({
            'secret': secret,
            'qr_code': f'data:image/png;base64,{qr_base64}',
            'provisioning_uri': provisioning_uri
        })


class TwoFactorVerifyView(APIView):
    """Verify TOTP token and enable 2FA."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = TwoFactorVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            settings = request.user.two_factor_settings
        except TwoFactorSettings.DoesNotExist:
            return Response(
                {'detail': 'Please initiate 2FA setup first.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if settings.is_enabled:
            return Response(
                {'detail': 'Two-factor authentication is already enabled.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify the token
        token = serializer.validated_data['token']
        if not settings.verify_token(token):
            return Response(
                {'detail': 'Invalid verification code.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Enable 2FA
        settings.is_enabled = True
        settings.enabled_at = timezone.now()
        settings.save()

        # Generate backup codes
        backup_codes = settings.generate_backup_codes()
        settings.save()

        # Log 2FA enablement
        AuditLog.log(
            user=request.user,
            action=AuditLog.Action.UPDATE,
            entity_type='TwoFactorSettings',
            entity_id=settings.id,
            entity_repr=f'2FA for {request.user.email}',
            new_values={'is_enabled': True},
            ip_address=getattr(request, 'audit_ip', None),
            user_agent=getattr(request, 'audit_user_agent', '')
        )

        return Response({
            'detail': 'Two-factor authentication has been enabled.',
            'backup_codes': backup_codes
        })


class TwoFactorDisableView(APIView):
    """Disable 2FA for current user."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = TwoFactorDisableSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)

        try:
            settings = request.user.two_factor_settings
        except TwoFactorSettings.DoesNotExist:
            return Response(
                {'detail': 'Two-factor authentication is not set up.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not settings.is_enabled:
            return Response(
                {'detail': 'Two-factor authentication is not enabled.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Disable 2FA
        settings.is_enabled = False
        settings.enabled_at = None
        settings.secret = ''
        settings.backup_codes = []
        settings.save()

        # Log 2FA disablement
        AuditLog.log(
            user=request.user,
            action=AuditLog.Action.UPDATE,
            entity_type='TwoFactorSettings',
            entity_id=settings.id,
            entity_repr=f'2FA for {request.user.email}',
            new_values={'is_enabled': False},
            ip_address=getattr(request, 'audit_ip', None),
            user_agent=getattr(request, 'audit_user_agent', '')
        )

        return Response({'detail': 'Two-factor authentication has been disabled.'})


class TwoFactorBackupCodesView(APIView):
    """Generate new backup codes."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            settings = request.user.two_factor_settings
        except TwoFactorSettings.DoesNotExist:
            return Response(
                {'detail': 'Two-factor authentication is not set up.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not settings.is_enabled:
            return Response(
                {'detail': 'Two-factor authentication is not enabled.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Generate new backup codes
        backup_codes = settings.generate_backup_codes()
        settings.save()

        return Response({'backup_codes': backup_codes})


class TwoFactorAuthenticateView(APIView):
    """Authenticate with 2FA token (used during login)."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = TwoFactorAuthenticateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Get pending 2FA user ID from session/temp storage
        pending_user_id = request.data.get('user_id')
        if not pending_user_id:
            return Response(
                {'detail': 'No pending 2FA authentication.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(pk=pending_user_id)
            settings = user.two_factor_settings
        except (User.DoesNotExist, TwoFactorSettings.DoesNotExist):
            return Response(
                {'detail': 'Invalid request.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        token = serializer.validated_data['token']
        is_backup = serializer.validated_data.get('is_backup_code', False)

        # Verify token
        if is_backup:
            if not settings.verify_backup_code(token):
                return Response(
                    {'detail': 'Invalid backup code.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            if not settings.verify_token(token):
                return Response(
                    {'detail': 'Invalid verification code.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        # Create session record with both refresh and access JTIs
        try:
            UserSession.create_from_request(
                user=user,
                token_jti=str(refresh['jti']),  # Refresh token JTI for blacklisting
                request=request,
                access_jti=str(refresh.access_token['jti'])  # Access token JTI for detection
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to create session: {e}")

        # Log successful 2FA login
        AuditLog.log(
            user=user,
            action=AuditLog.Action.LOGIN,
            entity_type='User',
            entity_id=user.id,
            entity_repr=str(user),
            new_values={'two_factor_auth': True},
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:500]
        )

        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'full_name': user.get_full_name(),
                'avatar': user.avatar.url if user.avatar else None,
                'is_superuser': user.is_superuser
            }
        })

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')


# =============================================================================
# User Session Views
# =============================================================================

class UserSessionListView(APIView):
    """List user's active sessions."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sessions = UserSession.objects.filter(
            user=request.user,
            is_active=True
        ).order_by('-last_activity')

        # Get current token JTI
        from rest_framework_simplejwt.authentication import JWTAuthentication
        jwt_auth = JWTAuthentication()
        try:
            validated_token = jwt_auth.get_validated_token(
                jwt_auth.get_raw_token(jwt_auth.get_header(request))
            )
            request.current_token_jti = validated_token['jti']
        except Exception:
            request.current_token_jti = None

        serializer = UserSessionSerializer(
            sessions,
            many=True,
            context={'request': request}
        )
        return Response(serializer.data)


class UserSessionTerminateView(APIView):
    """Terminate a specific session."""
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        try:
            session = UserSession.objects.get(
                id=session_id,
                user=request.user,
                is_active=True
            )
        except UserSession.DoesNotExist:
            return Response(
                {'detail': 'Session not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if this is the current session by comparing access_jti
        from rest_framework_simplejwt.authentication import JWTAuthentication
        jwt_auth = JWTAuthentication()
        is_current_session = False
        try:
            validated_token = jwt_auth.get_validated_token(
                jwt_auth.get_raw_token(jwt_auth.get_header(request))
            )
            current_access_jti = validated_token['jti']
            is_current_session = session.access_jti == current_access_jti
        except Exception:
            pass

        session.terminate()

        # Log session termination
        AuditLog.log(
            user=request.user,
            action=AuditLog.Action.LOGOUT,
            entity_type='UserSession',
            entity_id=session.id,
            entity_repr=f'Session {session.device_type} ({session.ip_address})',
            ip_address=getattr(request, 'audit_ip', None),
            user_agent=getattr(request, 'audit_user_agent', '')
        )

        return Response({
            'detail': 'Сессия завершена.',
            'logged_out': is_current_session
        })


class UserSessionTerminateAllView(APIView):
    """Terminate all sessions except current."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Get current access token JTI
        from rest_framework_simplejwt.authentication import JWTAuthentication
        jwt_auth = JWTAuthentication()
        current_access_jti = None
        try:
            validated_token = jwt_auth.get_validated_token(
                jwt_auth.get_raw_token(jwt_auth.get_header(request))
            )
            current_access_jti = validated_token['jti']
        except Exception:
            pass

        # Get all active sessions except current (compare by access_jti)
        sessions = UserSession.objects.filter(
            user=request.user,
            is_active=True
        )

        if current_access_jti:
            sessions = sessions.exclude(access_jti=current_access_jti)

        terminated_count = 0
        for session in sessions:
            session.terminate()
            terminated_count += 1

        # Log bulk session termination
        AuditLog.log(
            user=request.user,
            action=AuditLog.Action.LOGOUT,
            entity_type='UserSession',
            entity_id=0,
            entity_repr=f'Terminated {terminated_count} sessions',
            ip_address=getattr(request, 'audit_ip', None),
            user_agent=getattr(request, 'audit_user_agent', '')
        )

        return Response({
            'detail': f'{terminated_count} session(s) have been terminated.'
        })


class CompleteOnboardingView(APIView):
    """Mark onboarding as completed for the current user."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        user.has_completed_onboarding = True
        user.save(update_fields=['has_completed_onboarding'])
        return Response({'has_completed_onboarding': True})


class ResetOnboardingView(APIView):
    """Reset onboarding status (for testing or re-touring)."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        user.has_completed_onboarding = False
        user.save(update_fields=['has_completed_onboarding'])
        return Response({'has_completed_onboarding': False})


class DashboardSettingsView(APIView):
    """Get and update dashboard widget settings."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            'dashboard_settings': request.user.dashboard_settings or {}
        })

    def patch(self, request):
        user = request.user
        settings = request.data.get('dashboard_settings', {})

        # Validate settings structure
        if not isinstance(settings, dict):
            return Response(
                {'detail': 'dashboard_settings must be an object'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Merge with existing settings
        user.dashboard_settings = {
            **(user.dashboard_settings or {}),
            **settings
        }
        user.save(update_fields=['dashboard_settings'])

        return Response({
            'dashboard_settings': user.dashboard_settings
        })
