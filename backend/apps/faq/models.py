"""
FAQ models.
"""
from django.db import models
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _


class FAQCategory(models.Model):
    """FAQ category for grouping questions."""

    name = models.CharField(_('Название'), max_length=100)
    slug = models.SlugField(_('Slug'), max_length=100, unique=True, blank=True)
    description = models.TextField(_('Описание'), blank=True)
    icon = models.CharField(_('Иконка'), max_length=50, blank=True, help_text='Carbon icon name')
    order = models.PositiveIntegerField(_('Порядок'), default=0)
    is_active = models.BooleanField(_('Активна'), default=True)
    created_at = models.DateTimeField(_('Создано'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Обновлено'), auto_now=True)

    class Meta:
        verbose_name = _('Категория FAQ')
        verbose_name_plural = _('Категории FAQ')
        ordering = ['order', 'name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name, allow_unicode=True)
        super().save(*args, **kwargs)


class FAQItem(models.Model):
    """FAQ question and answer."""

    category = models.ForeignKey(
        FAQCategory,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name=_('Категория')
    )
    question = models.CharField(_('Вопрос'), max_length=500)
    answer = models.TextField(_('Ответ'))
    order = models.PositiveIntegerField(_('Порядок'), default=0)
    is_published = models.BooleanField(_('Опубликован'), default=True)
    views_count = models.PositiveIntegerField(_('Просмотры'), default=0)
    created_at = models.DateTimeField(_('Создано'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Обновлено'), auto_now=True)

    class Meta:
        verbose_name = _('FAQ')
        verbose_name_plural = _('FAQ')
        ordering = ['category__order', 'order', 'question']

    def __str__(self):
        return self.question

    def increment_views(self):
        """Increment views counter."""
        self.views_count += 1
        self.save(update_fields=['views_count'])
