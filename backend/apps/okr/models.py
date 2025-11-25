from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class OKRPeriod(models.Model):
    """Период OKR (квартал или год)"""

    class PeriodType(models.TextChoices):
        QUARTER = 'quarter', 'Квартал'
        YEAR = 'year', 'Год'

    name = models.CharField('Название', max_length=50)  # Q1 2025, 2025
    type = models.CharField(
        'Тип периода',
        max_length=10,
        choices=PeriodType.choices,
        default=PeriodType.QUARTER
    )
    starts_at = models.DateField('Дата начала')
    ends_at = models.DateField('Дата окончания')
    is_active = models.BooleanField('Активный', default=True)
    created_at = models.DateTimeField('Создан', auto_now_add=True)

    class Meta:
        verbose_name = 'Период OKR'
        verbose_name_plural = 'Периоды OKR'
        ordering = ['-starts_at']

    def __str__(self):
        return self.name


class Objective(models.Model):
    """Цель (Objective)"""

    class Level(models.TextChoices):
        COMPANY = 'company', 'Компания'
        DEPARTMENT = 'department', 'Отдел'
        PERSONAL = 'personal', 'Личная'

    class Status(models.TextChoices):
        DRAFT = 'draft', 'Черновик'
        ACTIVE = 'active', 'Активна'
        COMPLETED = 'completed', 'Завершена'
        CANCELLED = 'cancelled', 'Отменена'

    period = models.ForeignKey(
        OKRPeriod,
        on_delete=models.CASCADE,
        related_name='objectives',
        verbose_name='Период'
    )
    title = models.CharField('Название', max_length=255)
    description = models.TextField('Описание', blank=True)
    level = models.CharField(
        'Уровень',
        max_length=20,
        choices=Level.choices,
        default=Level.PERSONAL
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='objectives',
        verbose_name='Владелец'
    )
    department = models.ForeignKey(
        'organization.Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='objectives',
        verbose_name='Отдел'
    )
    parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='children',
        verbose_name='Родительская цель'
    )
    status = models.CharField(
        'Статус',
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT
    )
    created_at = models.DateTimeField('Создана', auto_now_add=True)
    updated_at = models.DateTimeField('Обновлена', auto_now=True)

    class Meta:
        verbose_name = 'Цель'
        verbose_name_plural = 'Цели'
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    @property
    def progress(self):
        """Вычисление прогресса на основе Key Results"""
        key_results = self.key_results.all()
        if not key_results:
            return 0
        total_progress = sum(kr.progress for kr in key_results)
        return round(total_progress / len(key_results))


class KeyResult(models.Model):
    """Ключевой результат (Key Result)"""

    class ResultType(models.TextChoices):
        QUANTITATIVE = 'quantitative', 'Количественный'
        QUALITATIVE = 'qualitative', 'Качественный'

    objective = models.ForeignKey(
        Objective,
        on_delete=models.CASCADE,
        related_name='key_results',
        verbose_name='Цель'
    )
    title = models.CharField('Название', max_length=255)
    type = models.CharField(
        'Тип',
        max_length=20,
        choices=ResultType.choices,
        default=ResultType.QUANTITATIVE
    )
    target_value = models.DecimalField(
        'Целевое значение',
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    current_value = models.DecimalField(
        'Текущее значение',
        max_digits=10,
        decimal_places=2,
        default=0
    )
    start_value = models.DecimalField(
        'Начальное значение',
        max_digits=10,
        decimal_places=2,
        default=0
    )
    unit = models.CharField(
        'Единица измерения',
        max_length=50,
        blank=True,
        default=''
    )  # %, штуки, рубли
    progress = models.IntegerField(
        'Прогресс %',
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    order = models.PositiveIntegerField('Порядок', default=0)
    created_at = models.DateTimeField('Создан', auto_now_add=True)
    updated_at = models.DateTimeField('Обновлён', auto_now=True)

    class Meta:
        verbose_name = 'Ключевой результат'
        verbose_name_plural = 'Ключевые результаты'
        ordering = ['order', 'created_at']

    def __str__(self):
        return self.title

    def calculate_progress(self):
        """Вычислить прогресс для количественных KR"""
        if self.type == self.ResultType.QUANTITATIVE and self.target_value:
            if self.target_value == self.start_value:
                return 100 if self.current_value >= self.target_value else 0
            progress = ((self.current_value - self.start_value) /
                       (self.target_value - self.start_value)) * 100
            return max(0, min(100, int(progress)))
        return self.progress

    def save(self, *args, **kwargs):
        # Автоматически вычисляем прогресс для количественных KR
        if self.type == self.ResultType.QUANTITATIVE and self.target_value:
            self.progress = self.calculate_progress()
        super().save(*args, **kwargs)


class CheckIn(models.Model):
    """Check-in (обновление прогресса)"""

    key_result = models.ForeignKey(
        KeyResult,
        on_delete=models.CASCADE,
        related_name='check_ins',
        verbose_name='Ключевой результат'
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='okr_check_ins',
        verbose_name='Автор'
    )
    previous_value = models.DecimalField(
        'Предыдущее значение',
        max_digits=10,
        decimal_places=2
    )
    new_value = models.DecimalField(
        'Новое значение',
        max_digits=10,
        decimal_places=2
    )
    previous_progress = models.IntegerField('Предыдущий прогресс %', default=0)
    new_progress = models.IntegerField('Новый прогресс %', default=0)
    comment = models.TextField('Комментарий', blank=True)
    created_at = models.DateTimeField('Создан', auto_now_add=True)

    class Meta:
        verbose_name = 'Check-in'
        verbose_name_plural = 'Check-ins'
        ordering = ['-created_at']

    def __str__(self):
        return f"Check-in for {self.key_result.title} by {self.author}"
