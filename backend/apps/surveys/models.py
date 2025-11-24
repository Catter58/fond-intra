"""
Models for surveys app.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError


class Survey(models.Model):
    """Survey/poll model."""

    class Status(models.TextChoices):
        DRAFT = 'draft', _('Черновик')
        ACTIVE = 'active', _('Активный')
        CLOSED = 'closed', _('Завершён')

    class TargetType(models.TextChoices):
        ALL = 'all', _('Все сотрудники')
        DEPARTMENT = 'department', _('По отделам')
        ROLE = 'role', _('По ролям')

    title = models.CharField(_('Название'), max_length=255)
    description = models.TextField(_('Описание'), blank=True)
    author = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='created_surveys',
        verbose_name=_('Автор')
    )
    is_anonymous = models.BooleanField(_('Анонимный'), default=False)
    is_required = models.BooleanField(_('Обязательный'), default=False)
    status = models.CharField(
        _('Статус'),
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT
    )
    starts_at = models.DateTimeField(_('Начало'), null=True, blank=True)
    ends_at = models.DateTimeField(_('Окончание'), null=True, blank=True)
    target_type = models.CharField(
        _('Тип аудитории'),
        max_length=20,
        choices=TargetType.choices,
        default=TargetType.ALL
    )
    target_departments = models.ManyToManyField(
        'organization.Department',
        blank=True,
        related_name='targeted_surveys',
        verbose_name=_('Целевые отделы')
    )
    target_roles = models.ManyToManyField(
        'roles.Role',
        blank=True,
        related_name='targeted_surveys',
        verbose_name=_('Целевые роли')
    )
    created_at = models.DateTimeField(_('Создано'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Обновлено'), auto_now=True)

    class Meta:
        verbose_name = _('Опрос')
        verbose_name_plural = _('Опросы')
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def clean(self):
        if self.ends_at and self.starts_at and self.ends_at < self.starts_at:
            raise ValidationError(_('Дата окончания не может быть раньше даты начала'))

    def is_user_in_target(self, user):
        """Check if user is in the target audience."""
        if self.target_type == self.TargetType.ALL:
            return True
        if self.target_type == self.TargetType.DEPARTMENT:
            return self.target_departments.filter(id=user.department_id).exists()
        if self.target_type == self.TargetType.ROLE:
            user_roles = user.roles.all()
            return self.target_roles.filter(id__in=user_roles).exists()
        return False

    def has_user_responded(self, user):
        """Check if user has already responded to this survey."""
        return self.responses.filter(user=user).exists()


class Question(models.Model):
    """Survey question model."""

    class QuestionType(models.TextChoices):
        SINGLE_CHOICE = 'single_choice', _('Один вариант')
        MULTIPLE_CHOICE = 'multiple_choice', _('Несколько вариантов')
        SCALE = 'scale', _('Шкала')
        TEXT = 'text', _('Текст')
        NPS = 'nps', _('NPS (0-10)')

    survey = models.ForeignKey(
        Survey,
        on_delete=models.CASCADE,
        related_name='questions',
        verbose_name=_('Опрос')
    )
    text = models.TextField(_('Текст вопроса'))
    type = models.CharField(
        _('Тип вопроса'),
        max_length=20,
        choices=QuestionType.choices,
        default=QuestionType.SINGLE_CHOICE
    )
    is_required = models.BooleanField(_('Обязательный'), default=True)
    order = models.PositiveIntegerField(_('Порядок'), default=0)
    # For scale questions
    scale_min = models.PositiveSmallIntegerField(_('Мин. значение'), default=1)
    scale_max = models.PositiveSmallIntegerField(_('Макс. значение'), default=5)
    scale_min_label = models.CharField(_('Подпись мин.'), max_length=100, blank=True)
    scale_max_label = models.CharField(_('Подпись макс.'), max_length=100, blank=True)

    class Meta:
        verbose_name = _('Вопрос')
        verbose_name_plural = _('Вопросы')
        ordering = ['order']

    def __str__(self):
        return f"{self.survey.title}: {self.text[:50]}"


class QuestionOption(models.Model):
    """Option for single/multiple choice questions."""

    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='options',
        verbose_name=_('Вопрос')
    )
    text = models.CharField(_('Текст варианта'), max_length=255)
    order = models.PositiveIntegerField(_('Порядок'), default=0)

    class Meta:
        verbose_name = _('Вариант ответа')
        verbose_name_plural = _('Варианты ответа')
        ordering = ['order']

    def __str__(self):
        return self.text


class Response(models.Model):
    """User's response to a survey."""

    survey = models.ForeignKey(
        Survey,
        on_delete=models.CASCADE,
        related_name='responses',
        verbose_name=_('Опрос')
    )
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='survey_responses',
        verbose_name=_('Пользователь')
    )
    created_at = models.DateTimeField(_('Создано'), auto_now_add=True)

    class Meta:
        verbose_name = _('Ответ на опрос')
        verbose_name_plural = _('Ответы на опросы')
        unique_together = ['survey', 'user']

    def __str__(self):
        user_str = self.user.get_full_name() if self.user else 'Аноним'
        return f"{self.survey.title} - {user_str}"


class Answer(models.Model):
    """Answer to a specific question."""

    response = models.ForeignKey(
        Response,
        on_delete=models.CASCADE,
        related_name='answers',
        verbose_name=_('Ответ')
    )
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='answers',
        verbose_name=_('Вопрос')
    )
    selected_options = models.ManyToManyField(
        QuestionOption,
        blank=True,
        related_name='answers',
        verbose_name=_('Выбранные варианты')
    )
    text_value = models.TextField(_('Текстовый ответ'), blank=True)
    scale_value = models.PositiveSmallIntegerField(_('Числовой ответ'), null=True, blank=True)

    class Meta:
        verbose_name = _('Ответ на вопрос')
        verbose_name_plural = _('Ответы на вопросы')
        unique_together = ['response', 'question']

    def __str__(self):
        return f"Ответ на: {self.question.text[:30]}"
