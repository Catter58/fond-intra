"""
Classifieds models.
"""
from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _
from datetime import timedelta


class ClassifiedCategory(models.Model):
    """Category for classifieds."""

    name = models.CharField(_('Название'), max_length=100)
    slug = models.SlugField(_('Slug'), max_length=100, unique=True, blank=True)
    icon = models.CharField(_('Иконка'), max_length=50, blank=True, help_text='Carbon icon name')
    order = models.PositiveIntegerField(_('Порядок'), default=0)
    is_active = models.BooleanField(_('Активна'), default=True)

    class Meta:
        verbose_name = _('Категория объявлений')
        verbose_name_plural = _('Категории объявлений')
        ordering = ['order', 'name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name, allow_unicode=True)
        super().save(*args, **kwargs)


class Classified(models.Model):
    """Classified ad."""

    class Status(models.TextChoices):
        ACTIVE = 'active', _('Активно')
        CLOSED = 'closed', _('Закрыто')
        EXPIRED = 'expired', _('Истекло')

    title = models.CharField(_('Заголовок'), max_length=200)
    description = models.TextField(_('Описание'))
    category = models.ForeignKey(
        ClassifiedCategory,
        on_delete=models.PROTECT,
        related_name='classifieds',
        verbose_name=_('Категория')
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='classifieds',
        verbose_name=_('Автор')
    )
    contact_info = models.CharField(
        _('Контактная информация'),
        max_length=200,
        blank=True,
        help_text='Если отличается от данных профиля'
    )
    price = models.DecimalField(
        _('Цена'),
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True
    )
    status = models.CharField(
        _('Статус'),
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE
    )
    views_count = models.PositiveIntegerField(_('Просмотры'), default=0)
    expires_at = models.DateTimeField(_('Истекает'), null=True, blank=True)
    created_at = models.DateTimeField(_('Создано'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Обновлено'), auto_now=True)

    class Meta:
        verbose_name = _('Объявление')
        verbose_name_plural = _('Объявления')
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.pk and not self.expires_at:
            # Set expiration 30 days from now for new classifieds
            self.expires_at = timezone.now() + timedelta(days=30)
        super().save(*args, **kwargs)

    def increment_views(self):
        """Increment views counter."""
        self.views_count += 1
        self.save(update_fields=['views_count'])

    def close(self):
        """Close the classified."""
        self.status = self.Status.CLOSED
        self.save(update_fields=['status', 'updated_at'])

    def extend(self, days=30):
        """Extend expiration date."""
        if self.expires_at and self.expires_at < timezone.now():
            self.expires_at = timezone.now() + timedelta(days=days)
        else:
            self.expires_at = self.expires_at + timedelta(days=days)
        self.status = self.Status.ACTIVE
        self.save(update_fields=['expires_at', 'status', 'updated_at'])


class ClassifiedImage(models.Model):
    """Image for classified ad."""

    classified = models.ForeignKey(
        Classified,
        on_delete=models.CASCADE,
        related_name='images',
        verbose_name=_('Объявление')
    )
    image = models.ImageField(_('Изображение'), upload_to='classifieds/')
    order = models.PositiveIntegerField(_('Порядок'), default=0)
    uploaded_at = models.DateTimeField(_('Загружено'), auto_now_add=True)

    class Meta:
        verbose_name = _('Изображение')
        verbose_name_plural = _('Изображения')
        ordering = ['order']

    def __str__(self):
        return f'Image {self.id} for {self.classified.title}'
