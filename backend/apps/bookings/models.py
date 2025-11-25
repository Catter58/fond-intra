from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone


class ResourceType(models.Model):
    """Тип ресурса (Переговорная, Оборудование и т.д.)"""

    name = models.CharField('Название', max_length=100)
    slug = models.SlugField('Слаг', unique=True)
    icon = models.CharField('Иконка', max_length=50, blank=True)
    description = models.TextField('Описание', blank=True)
    is_active = models.BooleanField('Активен', default=True)
    order = models.PositiveIntegerField('Порядок', default=0)

    class Meta:
        verbose_name = 'Тип ресурса'
        verbose_name_plural = 'Типы ресурсов'
        ordering = ['order', 'name']

    def __str__(self):
        return self.name


class Resource(models.Model):
    """Ресурс для бронирования"""

    type = models.ForeignKey(
        ResourceType,
        on_delete=models.CASCADE,
        related_name='resources',
        verbose_name='Тип'
    )
    name = models.CharField('Название', max_length=200)
    description = models.TextField('Описание', blank=True)
    location = models.CharField('Расположение', max_length=200, blank=True)  # этаж, здание
    capacity = models.PositiveIntegerField('Вместимость', null=True, blank=True)  # для переговорок
    amenities = models.JSONField('Удобства', default=list, blank=True)  # проектор, ВКС, доска
    image = models.ImageField(
        'Изображение',
        upload_to='resources/',
        null=True,
        blank=True
    )
    is_active = models.BooleanField('Активен', default=True)
    work_hours_start = models.TimeField('Начало работы', default='09:00')
    work_hours_end = models.TimeField('Конец работы', default='21:00')
    min_booking_duration = models.PositiveIntegerField(
        'Мин. длительность (мин)',
        default=30
    )
    max_booking_duration = models.PositiveIntegerField(
        'Макс. длительность (мин)',
        default=480  # 8 часов
    )
    created_at = models.DateTimeField('Создан', auto_now_add=True)

    class Meta:
        verbose_name = 'Ресурс'
        verbose_name_plural = 'Ресурсы'
        ordering = ['type', 'name']

    def __str__(self):
        return f"{self.name} ({self.type.name})"


class Booking(models.Model):
    """Бронирование ресурса"""

    class Status(models.TextChoices):
        CONFIRMED = 'confirmed', 'Подтверждено'
        CANCELLED = 'cancelled', 'Отменено'

    resource = models.ForeignKey(
        Resource,
        on_delete=models.CASCADE,
        related_name='bookings',
        verbose_name='Ресурс'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bookings',
        verbose_name='Пользователь'
    )
    title = models.CharField('Название', max_length=200)
    description = models.TextField('Описание', blank=True)
    starts_at = models.DateTimeField('Начало')
    ends_at = models.DateTimeField('Окончание')
    status = models.CharField(
        'Статус',
        max_length=20,
        choices=Status.choices,
        default=Status.CONFIRMED
    )
    is_recurring = models.BooleanField('Повторяющееся', default=False)
    recurrence_rule = models.JSONField(
        'Правило повторения',
        null=True,
        blank=True
    )  # {type: 'weekly', days: [1,3,5], until: '2025-12-31'}
    parent_booking = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='recurring_bookings',
        verbose_name='Родительское бронирование'
    )
    created_at = models.DateTimeField('Создано', auto_now_add=True)
    updated_at = models.DateTimeField('Обновлено', auto_now=True)

    class Meta:
        verbose_name = 'Бронирование'
        verbose_name_plural = 'Бронирования'
        ordering = ['starts_at']

    def __str__(self):
        return f"{self.title} - {self.resource.name} ({self.starts_at.strftime('%d.%m.%Y %H:%M')})"

    def clean(self):
        """Валидация бронирования"""
        errors = {}

        # Проверка времени
        if self.starts_at >= self.ends_at:
            errors['ends_at'] = 'Время окончания должно быть позже времени начала'

        # Проверка рабочих часов
        if self.resource_id:
            resource = self.resource
            start_time = self.starts_at.time()
            end_time = self.ends_at.time()

            if start_time < resource.work_hours_start or end_time > resource.work_hours_end:
                errors['starts_at'] = f'Бронирование должно быть в рабочие часы: {resource.work_hours_start}-{resource.work_hours_end}'

            # Проверка длительности
            duration = (self.ends_at - self.starts_at).total_seconds() / 60
            if duration < resource.min_booking_duration:
                errors['ends_at'] = f'Минимальная длительность: {resource.min_booking_duration} мин.'
            if duration > resource.max_booking_duration:
                errors['ends_at'] = f'Максимальная длительность: {resource.max_booking_duration} мин.'

            # Проверка пересечений
            if not self.pk:  # Только для новых
                overlapping = Booking.objects.filter(
                    resource=self.resource,
                    status=Booking.Status.CONFIRMED,
                    starts_at__lt=self.ends_at,
                    ends_at__gt=self.starts_at
                )
                if overlapping.exists():
                    errors['starts_at'] = 'Это время уже занято'

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        # Skip validation when only updating status (e.g., cancellation)
        update_fields = kwargs.get('update_fields')
        if not update_fields or 'starts_at' in update_fields or 'ends_at' in update_fields or 'resource_id' in update_fields:
            self.full_clean()
        super().save(*args, **kwargs)

    @property
    def duration_minutes(self):
        """Длительность в минутах"""
        return int((self.ends_at - self.starts_at).total_seconds() / 60)

    @property
    def is_past(self):
        """Прошло ли бронирование"""
        return self.ends_at < timezone.now()

    @property
    def is_active(self):
        """Активно ли бронирование (идёт прямо сейчас)"""
        now = timezone.now()
        return self.starts_at <= now <= self.ends_at and self.status == self.Status.CONFIRMED
