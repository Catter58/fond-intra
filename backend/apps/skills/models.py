"""
Skills models: SkillCategory, Skill, UserSkill.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _


class SkillCategory(models.Model):
    """
    Category for grouping skills (e.g., Programming, Languages, Soft Skills).
    """
    name = models.CharField(_('name'), max_length=100)
    description = models.TextField(_('description'), blank=True)
    order = models.PositiveIntegerField(_('order'), default=0)

    class Meta:
        verbose_name = _('skill category')
        verbose_name_plural = _('skill categories')
        ordering = ['order', 'name']

    def __str__(self):
        return self.name


class Skill(models.Model):
    """
    Skill that users can add to their profile.
    """
    name = models.CharField(_('name'), max_length=100)
    category = models.ForeignKey(
        SkillCategory,
        verbose_name=_('category'),
        on_delete=models.CASCADE,
        related_name='skills'
    )
    description = models.TextField(_('description'), blank=True)

    class Meta:
        verbose_name = _('skill')
        verbose_name_plural = _('skills')
        ordering = ['category', 'name']
        unique_together = ['name', 'category']

    def __str__(self):
        return f"{self.name} ({self.category.name})"


class UserSkill(models.Model):
    """
    Link between User and Skill with proficiency level.
    """
    class Level(models.TextChoices):
        BEGINNER = 'beginner', _('Beginner')
        INTERMEDIATE = 'intermediate', _('Intermediate')
        ADVANCED = 'advanced', _('Advanced')
        EXPERT = 'expert', _('Expert')

    user = models.ForeignKey(
        'accounts.User',
        verbose_name=_('user'),
        on_delete=models.CASCADE,
        related_name='user_skills'
    )
    skill = models.ForeignKey(
        Skill,
        verbose_name=_('skill'),
        on_delete=models.CASCADE,
        related_name='user_skills'
    )
    level = models.CharField(
        _('level'),
        max_length=20,
        choices=Level.choices,
        default=Level.INTERMEDIATE
    )
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)

    class Meta:
        verbose_name = _('user skill')
        verbose_name_plural = _('user skills')
        unique_together = ['user', 'skill']

    def __str__(self):
        return f"{self.user} - {self.skill} ({self.get_level_display()})"
