"""
Django Filter classes for accounts app.
"""
import django_filters
from django.db.models import Q
from .models import User


class UserFilter(django_filters.FilterSet):
    """Extended filter for users list."""

    # Basic filters
    department = django_filters.NumberFilter(field_name='department_id')
    position = django_filters.NumberFilter(field_name='position_id')

    # Date range filters
    hired_after = django_filters.DateFilter(field_name='hire_date', lookup_expr='gte')
    hired_before = django_filters.DateFilter(field_name='hire_date', lookup_expr='lte')

    # Skill filter - users with specific skill
    skill = django_filters.NumberFilter(method='filter_by_skill')

    # Skill level filter - used with skill filter
    skill_level = django_filters.CharFilter(method='filter_by_skill_level')

    # Status filter - users with specific current status
    status = django_filters.CharFilter(method='filter_by_status')

    # Role filter
    role = django_filters.NumberFilter(field_name='role_id')

    class Meta:
        model = User
        fields = ['department', 'position', 'hired_after', 'hired_before', 'skill', 'status', 'role']

    def filter_by_skill(self, queryset, name, value):
        """Filter users who have a specific skill."""
        return queryset.filter(user_skills__skill_id=value)

    def filter_by_skill_level(self, queryset, name, value):
        """Filter users by skill level (requires skill filter to be set)."""
        skill_id = self.data.get('skill')
        if skill_id and value:
            return queryset.filter(
                user_skills__skill_id=skill_id,
                user_skills__level=value
            )
        return queryset

    def filter_by_status(self, queryset, name, value):
        """Filter users by their current status type."""
        from django.utils import timezone
        today = timezone.now().date()

        return queryset.filter(
            statuses__status=value,
            statuses__start_date__lte=today
        ).filter(
            Q(statuses__end_date__gte=today) | Q(statuses__end_date__isnull=True)
        ).distinct()


class AdminUserFilter(django_filters.FilterSet):
    """Filter for admin users list with archive support."""

    department = django_filters.NumberFilter(field_name='department_id')
    is_active = django_filters.BooleanFilter()
    is_archived = django_filters.BooleanFilter()

    # Date range filters
    hired_after = django_filters.DateFilter(field_name='hire_date', lookup_expr='gte')
    hired_before = django_filters.DateFilter(field_name='hire_date', lookup_expr='lte')

    # Role filter
    role = django_filters.NumberFilter(field_name='role_id')

    class Meta:
        model = User
        fields = ['department', 'is_active', 'is_archived', 'hired_after', 'hired_before', 'role']
