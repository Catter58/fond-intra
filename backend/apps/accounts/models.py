"""
User and UserStatus models.
"""
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _

from core.utils import avatar_upload_path


class UserManager(BaseUserManager):
    """Custom user manager where email is the unique identifier."""

    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular user with the given email and password."""
        if not email:
            raise ValueError(_('The Email must be set'))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a SuperUser with the given email and password."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))
        return self.create_user(email, password, **extra_fields)

    def get_active(self):
        """Return only active, non-archived users."""
        return self.filter(is_active=True, is_archived=False)


class User(AbstractUser):
    """
    Custom User model with email as the unique identifier.
    """
    username = None  # Remove username field
    email = models.EmailField(_('email address'), unique=True)

    # Personal info
    first_name = models.CharField(_('first name'), max_length=50)
    last_name = models.CharField(_('last name'), max_length=50)
    patronymic = models.CharField(_('patronymic'), max_length=50, blank=True)

    # Avatar
    avatar = models.ImageField(
        _('avatar'),
        upload_to=avatar_upload_path,
        null=True,
        blank=True
    )

    # Contact info
    phone_work = models.CharField(_('work phone'), max_length=20, blank=True)
    phone_personal = models.CharField(_('personal phone'), max_length=20, blank=True)
    telegram = models.CharField(_('telegram'), max_length=50, blank=True)

    # Dates
    birth_date = models.DateField(_('birth date'), null=True, blank=True)
    hire_date = models.DateField(_('hire date'), null=True, blank=True)

    # Organization
    department = models.ForeignKey(
        'organization.Department',
        verbose_name=_('department'),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='employees'
    )
    position = models.ForeignKey(
        'organization.Position',
        verbose_name=_('position'),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='employees'
    )
    manager = models.ForeignKey(
        'self',
        verbose_name=_('manager'),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='subordinates'
    )

    # Status
    is_archived = models.BooleanField(_('archived'), default=False)
    archived_at = models.DateTimeField(_('archived at'), null=True, blank=True)

    # Roles (RBAC)
    roles = models.ManyToManyField(
        'roles.Role',
        verbose_name=_('roles'),
        blank=True,
        related_name='users'
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    objects = UserManager()

    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return self.get_full_name() or self.email

    def get_full_name(self):
        """Return the full name (last name, first name, patronymic)."""
        parts = [self.last_name, self.first_name]
        if self.patronymic:
            parts.append(self.patronymic)
        return ' '.join(parts)

    def get_short_name(self):
        """Return the short name (first name + last initial)."""
        return f"{self.first_name} {self.last_name[0]}." if self.last_name else self.first_name

    def has_permission(self, permission_codename):
        """Check if user has a specific permission through their roles."""
        if self.is_superuser:
            return True
        return self.roles.filter(
            permissions__codename=permission_codename
        ).exists()

    def has_any_permission(self, permission_codenames):
        """Check if user has any of the specified permissions."""
        if self.is_superuser:
            return True
        return self.roles.filter(
            permissions__codename__in=permission_codenames
        ).exists()

    @property
    def current_status(self):
        """Get current active status (vacation, sick leave, etc.)."""
        from django.utils import timezone
        today = timezone.now().date()
        return self.statuses.filter(
            start_date__lte=today
        ).filter(
            models.Q(end_date__gte=today) | models.Q(end_date__isnull=True)
        ).first()

    @property
    def role(self):
        """Get the primary role (admin role if exists, otherwise first role)."""
        # First try to get an admin role
        admin_role = self.roles.filter(is_admin=True).first()
        if admin_role:
            return admin_role
        # Otherwise return the first role
        return self.roles.first()


class UserStatus(models.Model):
    """
    User status model for tracking vacation, sick leave, etc.
    """
    class StatusType(models.TextChoices):
        VACATION = 'vacation', _('Vacation')
        SICK_LEAVE = 'sick_leave', _('Sick Leave')
        BUSINESS_TRIP = 'business_trip', _('Business Trip')
        REMOTE = 'remote', _('Remote Work')
        MATERNITY = 'maternity', _('Maternity Leave')

    user = models.ForeignKey(
        User,
        verbose_name=_('user'),
        on_delete=models.CASCADE,
        related_name='statuses'
    )
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=StatusType.choices
    )
    start_date = models.DateField(_('start date'))
    end_date = models.DateField(_('end date'), null=True, blank=True)
    comment = models.TextField(_('comment'), blank=True)
    created_by = models.ForeignKey(
        User,
        verbose_name=_('created by'),
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_statuses'
    )
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)

    class Meta:
        verbose_name = _('user status')
        verbose_name_plural = _('user statuses')
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.user} - {self.get_status_display()}"


class TwoFactorSettings(models.Model):
    """
    Two-Factor Authentication settings for users.
    Uses TOTP (Time-based One-Time Password) via pyotp.
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='two_factor_settings',
        verbose_name=_('user')
    )
    is_enabled = models.BooleanField(_('2FA enabled'), default=False)
    secret = models.CharField(
        _('TOTP secret'),
        max_length=32,
        blank=True,
        help_text=_('Base32 encoded secret key')
    )
    backup_codes = models.JSONField(
        _('backup codes'),
        default=list,
        blank=True,
        help_text=_('Hashed backup codes')
    )
    enabled_at = models.DateTimeField(_('enabled at'), null=True, blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('two-factor settings')
        verbose_name_plural = _('two-factor settings')

    def __str__(self):
        status = 'enabled' if self.is_enabled else 'disabled'
        return f"2FA for {self.user.email} ({status})"

    def generate_secret(self):
        """Generate a new TOTP secret."""
        import pyotp
        self.secret = pyotp.random_base32()
        return self.secret

    def get_totp_uri(self, issuer='FondSmena'):
        """Generate provisioning URI for QR code."""
        import pyotp
        if not self.secret:
            return None
        totp = pyotp.TOTP(self.secret)
        return totp.provisioning_uri(
            name=self.user.email,
            issuer_name=issuer
        )

    def verify_token(self, token):
        """Verify a TOTP token."""
        import pyotp
        if not self.secret:
            return False
        totp = pyotp.TOTP(self.secret)
        return totp.verify(token, valid_window=1)

    def generate_backup_codes(self, count=10):
        """Generate new backup codes."""
        import secrets
        import hashlib

        codes = []
        hashed_codes = []

        for _ in range(count):
            # Generate 8-character alphanumeric code
            code = secrets.token_hex(4).upper()
            codes.append(code)
            # Store hashed version
            hashed = hashlib.sha256(code.encode()).hexdigest()
            hashed_codes.append(hashed)

        self.backup_codes = hashed_codes
        return codes  # Return plain codes to show user once

    def verify_backup_code(self, code):
        """Verify and consume a backup code."""
        import hashlib

        hashed = hashlib.sha256(code.upper().encode()).hexdigest()
        if hashed in self.backup_codes:
            self.backup_codes.remove(hashed)
            self.save(update_fields=['backup_codes', 'updated_at'])
            return True
        return False

    @property
    def backup_codes_count(self):
        """Return number of remaining backup codes."""
        return len(self.backup_codes)


class UserSession(models.Model):
    """
    User session tracking for security management.
    Tracks active sessions with device info.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sessions',
        verbose_name=_('user')
    )
    token_jti = models.CharField(
        _('refresh token JTI'),
        max_length=255,
        unique=True,
        help_text=_('Refresh JWT token identifier for blacklisting')
    )
    access_jti = models.CharField(
        _('access token JTI'),
        max_length=255,
        blank=True,
        help_text=_('Access JWT token identifier for session detection')
    )
    device_type = models.CharField(_('device type'), max_length=50, blank=True)
    device_name = models.CharField(_('device name'), max_length=100, blank=True)
    browser = models.CharField(_('browser'), max_length=100, blank=True)
    os = models.CharField(_('operating system'), max_length=100, blank=True)
    ip_address = models.GenericIPAddressField(_('IP address'), null=True, blank=True)
    location = models.CharField(_('location'), max_length=100, blank=True)
    user_agent = models.TextField(_('user agent'), blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    last_activity = models.DateTimeField(_('last activity'), auto_now=True)
    is_active = models.BooleanField(_('is active'), default=True)

    class Meta:
        verbose_name = _('user session')
        verbose_name_plural = _('user sessions')
        ordering = ['-last_activity']

    def __str__(self):
        return f"{self.user.email} - {self.device_type or 'Unknown'} ({self.ip_address})"

    @classmethod
    def create_from_request(cls, user, token_jti, request, access_jti=''):
        """Create a session from HTTP request.

        Args:
            user: User instance
            token_jti: Refresh token JTI (for blacklisting)
            request: HTTP request
            access_jti: Access token JTI (for session detection)
        """
        from user_agents import parse

        user_agent_string = request.META.get('HTTP_USER_AGENT', '')
        user_agent = parse(user_agent_string)

        # Get IP address
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0].strip()
        else:
            ip_address = request.META.get('REMOTE_ADDR')

        # Determine device type
        if user_agent.is_mobile:
            device_type = 'mobile'
        elif user_agent.is_tablet:
            device_type = 'tablet'
        elif user_agent.is_pc:
            device_type = 'desktop'
        else:
            device_type = 'other'

        return cls.objects.create(
            user=user,
            token_jti=token_jti,
            access_jti=access_jti,
            device_type=device_type,
            device_name=user_agent.device.family or '',
            browser=f"{user_agent.browser.family} {user_agent.browser.version_string}".strip(),
            os=f"{user_agent.os.family} {user_agent.os.version_string}".strip(),
            ip_address=ip_address,
            user_agent=user_agent_string
        )

    def terminate(self):
        """Terminate this session by blacklisting the token."""
        from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

        try:
            # Find and blacklist the token
            outstanding_token = OutstandingToken.objects.get(jti=self.token_jti)
            BlacklistedToken.objects.get_or_create(token=outstanding_token)
        except OutstandingToken.DoesNotExist:
            pass

        self.is_active = False
        self.save(update_fields=['is_active'])
