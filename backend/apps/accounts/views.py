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
from .models import User, UserStatus
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
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            # Log successful login
            user = User.objects.get(email=request.data.get('email'))
            AuditLog.log(
                user=user,
                action=AuditLog.Action.LOGIN,
                entity_type='User',
                entity_id=user.id,
                entity_repr=str(user),
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')[:500]
            )

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
    """Quick search users by name."""
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
            Q(patronymic__icontains=query)
        ).select_related('department', 'position')[:20]


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
