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
