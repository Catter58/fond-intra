"""
Serializers for accounts app.
"""
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from apps.organization.serializers import DepartmentSerializer, PositionSerializer
from .models import User, UserStatus, TwoFactorSettings, UserSession


class RelativeImageField(serializers.ImageField):
    """ImageField that always returns relative URL (for frontend proxy)."""

    def to_representation(self, value):
        if not value:
            return None
        # Always return relative URL regardless of request context
        return value.url


# =============================================================================
# Auth Serializers
# =============================================================================

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom token serializer that includes user data."""

    def validate(self, attrs):
        data = super().validate(attrs)

        # Add user info to response (relative URLs work with frontend proxy)
        data['user'] = UserBasicSerializer(self.user).data

        return data


class LoginSerializer(serializers.Serializer):
    """Serializer for login endpoint."""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        user = authenticate(
            request=self.context.get('request'),
            email=email,
            password=password
        )

        if not user:
            raise serializers.ValidationError(
                _('Invalid email or password.'),
                code='authorization'
            )

        if not user.is_active:
            raise serializers.ValidationError(
                _('User account is disabled.'),
                code='authorization'
            )

        if user.is_archived:
            raise serializers.ValidationError(
                _('User account has been archived.'),
                code='authorization'
            )

        attrs['user'] = user
        return attrs


class PasswordChangeSerializer(serializers.Serializer):
    """Serializer for password change."""
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    new_password_confirm = serializers.CharField(write_only=True)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError(_('Current password is incorrect.'))
        return value

    def validate_new_password(self, value):
        validate_password(value)
        return value

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password_confirm': _('Passwords do not match.')
            })
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for password reset request."""
    email = serializers.EmailField()

    def validate_email(self, value):
        # Don't reveal if email exists or not for security
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for password reset confirmation."""
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)
    new_password_confirm = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        validate_password(value)
        return value

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password_confirm': _('Passwords do not match.')
            })
        return attrs


# =============================================================================
# User Serializers
# =============================================================================

class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user serializer for nested representations."""
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    avatar = RelativeImageField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'patronymic',
                  'full_name', 'avatar', 'is_superuser']


class UserListSerializer(serializers.ModelSerializer):
    """Serializer for user list view."""
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    avatar = RelativeImageField(read_only=True)
    department = DepartmentSerializer(read_only=True)
    position = PositionSerializer(read_only=True)
    current_status = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'patronymic',
                  'full_name', 'avatar', 'department', 'position', 'current_status',
                  'hire_date']

    def get_current_status(self, obj):
        status = obj.current_status
        if status:
            return {
                'status': status.status,
                'status_display': status.get_status_display()
            }
        return None


class UserDetailSerializer(serializers.ModelSerializer):
    """Detailed user serializer for profile view."""
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    avatar = RelativeImageField(read_only=True)
    department = DepartmentSerializer(read_only=True)
    position = PositionSerializer(read_only=True)
    manager = UserBasicSerializer(read_only=True)
    current_status = serializers.SerializerMethodField()
    achievements_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'patronymic',
                  'full_name', 'avatar', 'phone_work', 'telegram',
                  'birth_date', 'hire_date', 'department', 'position',
                  'manager', 'current_status', 'achievements_count',
                  'date_joined']

    def get_current_status(self, obj):
        status = obj.current_status
        if status:
            return UserStatusSerializer(status).data
        return None

    def get_achievements_count(self, obj):
        return obj.received_achievements.count()


class UserPrivateDetailSerializer(UserDetailSerializer):
    """User serializer with private fields (for self or HR)."""

    class Meta(UserDetailSerializer.Meta):
        fields = UserDetailSerializer.Meta.fields + ['phone_personal', 'is_archived', 'archived_at']


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating own profile."""

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'patronymic', 'phone_work',
                  'phone_personal', 'telegram', 'birth_date']


class UserAvatarSerializer(serializers.ModelSerializer):
    """Serializer for avatar upload."""

    class Meta:
        model = User
        fields = ['avatar']

    def validate_avatar(self, value):
        from django.conf import settings

        if value.size > settings.MAX_AVATAR_SIZE:
            raise serializers.ValidationError(
                _('Avatar file size must be less than 5MB.')
            )

        if value.content_type not in settings.ALLOWED_AVATAR_TYPES:
            raise serializers.ValidationError(
                _('Invalid file type. Allowed: JPEG, PNG, WebP.')
            )

        return value


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new users (HR only)."""
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'patronymic',
                  'phone_work', 'phone_personal', 'telegram',
                  'birth_date', 'hire_date', 'department', 'position',
                  'manager', 'password']

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User.objects.create(**validated_data)

        if password:
            user.set_password(password)
        else:
            # Generate random password - user will need to reset
            user.set_unusable_password()

        user.save()
        return user


class UserAdminUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating users (HR/Admin)."""

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'patronymic',
                  'phone_work', 'phone_personal', 'telegram',
                  'birth_date', 'hire_date', 'department', 'position',
                  'manager', 'is_active']


# =============================================================================
# UserStatus Serializers
# =============================================================================

class UserStatusSerializer(serializers.ModelSerializer):
    """Serializer for user status."""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = UserStatus
        fields = ['id', 'status', 'status_display', 'start_date', 'end_date',
                  'comment', 'created_by', 'created_by_name', 'created_at']
        read_only_fields = ['created_by', 'created_at']


class UserStatusCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating user status."""

    class Meta:
        model = UserStatus
        fields = ['status', 'start_date', 'end_date', 'comment']

    def validate(self, attrs):
        if attrs.get('end_date') and attrs['end_date'] < attrs['start_date']:
            raise serializers.ValidationError({
                'end_date': _('End date must be after start date.')
            })
        return attrs


# =============================================================================
# Birthday Serializers
# =============================================================================

class BirthdaySerializer(serializers.ModelSerializer):
    """Serializer for birthday calendar."""
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    avatar = RelativeImageField(read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'full_name', 'avatar', 'birth_date', 'department_name']


# =============================================================================
# Two-Factor Authentication Serializers
# =============================================================================

class TwoFactorStatusSerializer(serializers.ModelSerializer):
    """Serializer for 2FA status."""
    backup_codes_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = TwoFactorSettings
        fields = ['is_enabled', 'enabled_at', 'backup_codes_count']


class TwoFactorSetupSerializer(serializers.Serializer):
    """Serializer for initiating 2FA setup."""
    secret = serializers.CharField(read_only=True)
    qr_code = serializers.CharField(read_only=True)
    provisioning_uri = serializers.CharField(read_only=True)


class TwoFactorVerifySerializer(serializers.Serializer):
    """Serializer for verifying and enabling 2FA."""
    token = serializers.CharField(max_length=6, min_length=6)

    def validate_token(self, value):
        if not value.isdigit():
            raise serializers.ValidationError(_('Token must contain only digits.'))
        return value


class TwoFactorDisableSerializer(serializers.Serializer):
    """Serializer for disabling 2FA."""
    password = serializers.CharField(write_only=True)

    def validate_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError(_('Incorrect password.'))
        return value


class TwoFactorBackupCodesSerializer(serializers.Serializer):
    """Serializer for generating backup codes."""
    backup_codes = serializers.ListField(
        child=serializers.CharField(),
        read_only=True
    )


class TwoFactorAuthenticateSerializer(serializers.Serializer):
    """Serializer for authenticating with 2FA token."""
    token = serializers.CharField(max_length=8)
    is_backup_code = serializers.BooleanField(default=False)

    def validate_token(self, value):
        is_backup = self.initial_data.get('is_backup_code', False)
        if not is_backup and not value.isdigit():
            raise serializers.ValidationError(_('Token must contain only digits.'))
        return value


# =============================================================================
# User Session Serializers
# =============================================================================

class UserSessionSerializer(serializers.ModelSerializer):
    """Serializer for user session info."""
    is_current = serializers.SerializerMethodField()

    class Meta:
        model = UserSession
        fields = [
            'id', 'device_type', 'device_name', 'browser', 'os',
            'ip_address', 'location', 'created_at', 'last_activity',
            'is_active', 'is_current'
        ]

    def get_is_current(self, obj):
        request = self.context.get('request')
        if not request:
            return False
        current_jti = getattr(request, 'current_token_jti', None)
        # Compare with access_jti (from access token in request header)
        return obj.access_jti == current_jti
