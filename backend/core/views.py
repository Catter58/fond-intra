"""
Global search view for unified search across all entities.
"""
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.accounts.models import User
from apps.news.models import News
from apps.organization.models import Department
from apps.achievements.models import Achievement
from apps.skills.models import Skill


def extract_plain_text_from_editorjs(content):
    """Extract plain text from Editor.js JSON content."""
    if not content or not isinstance(content, dict):
        return ''

    blocks = content.get('blocks', [])
    text_parts = []

    for block in blocks:
        if block.get('type') == 'paragraph':
            text_parts.append(block.get('data', {}).get('text', ''))
        elif block.get('type') == 'header':
            text_parts.append(block.get('data', {}).get('text', ''))
        elif block.get('type') == 'list':
            items = block.get('data', {}).get('items', [])
            text_parts.extend(items)
        elif block.get('type') == 'quote':
            text_parts.append(block.get('data', {}).get('text', ''))

    return ' '.join(text_parts)


class GlobalSearchView(APIView):
    """
    Global search across Users, News, Departments, Achievements, and Skills.

    Query params:
        q: search query (min 2 chars)
        type: filter by type (users, news, departments, achievements, skills)
        limit: results per category (default 5, max 20)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        search_type = request.query_params.get('type', None)

        try:
            limit = min(int(request.query_params.get('limit', 5)), 20)
        except ValueError:
            limit = 5

        if len(query) < 2:
            return Response({
                'query': query,
                'results': {},
                'total': 0
            })

        results = {}
        total = 0

        # Search Users
        if not search_type or search_type == 'users':
            users = User.objects.filter(
                is_active=True,
                is_archived=False
            ).filter(
                Q(first_name__icontains=query) |
                Q(last_name__icontains=query) |
                Q(patronymic__icontains=query) |
                Q(email__icontains=query) |
                Q(department__name__icontains=query) |
                Q(position__name__icontains=query)
            ).select_related('department', 'position').distinct()[:limit]

            results['users'] = [{
                'id': u.id,
                'type': 'user',
                'title': u.get_full_name(),
                'subtitle': u.position.name if u.position else None,
                'description': u.department.name if u.department else None,
                'avatar': u.avatar.url if u.avatar else None,
                'url': f'/employees/{u.id}'
            } for u in users]
            total += len(results['users'])

        # Search News
        if not search_type or search_type == 'news':
            news = News.objects.filter(
                is_published=True
            ).filter(
                Q(title__icontains=query) |
                Q(content__icontains=query)
            ).select_related('author')[:limit]

            news_results = []
            for n in news:
                plain_text = extract_plain_text_from_editorjs(n.content)
                description = plain_text[:150] + '...' if len(plain_text) > 150 else plain_text
                news_results.append({
                    'id': n.id,
                    'type': 'news',
                    'title': n.title,
                    'subtitle': n.author.get_full_name() if n.author else None,
                    'description': description,
                    'avatar': None,
                    'url': f'/news/{n.id}'
                })
            results['news'] = news_results
            total += len(results['news'])

        # Search Departments
        if not search_type or search_type == 'departments':
            departments = Department.objects.filter(
                Q(name__icontains=query) |
                Q(description__icontains=query)
            )[:limit]

            results['departments'] = [{
                'id': d.id,
                'type': 'department',
                'title': d.name,
                'subtitle': f'{d.employees_count} сотрудников' if hasattr(d, 'employees_count') else None,
                'description': d.description[:100] if d.description else None,
                'avatar': None,
                'url': f'/organization?department={d.id}'
            } for d in departments]
            total += len(results['departments'])

        # Search Achievements
        if not search_type or search_type == 'achievements':
            achievements = Achievement.objects.filter(
                Q(name__icontains=query) |
                Q(description__icontains=query)
            )[:limit]

            results['achievements'] = [{
                'id': a.id,
                'type': 'achievement',
                'title': a.name,
                'subtitle': a.category_display if hasattr(a, 'category_display') else None,
                'description': a.description[:100] if a.description else None,
                'avatar': None,  # Could use icon
                'url': f'/achievements?type={a.id}'
            } for a in achievements]
            total += len(results['achievements'])

        # Search Skills
        if not search_type or search_type == 'skills':
            skills = Skill.objects.filter(
                Q(name__icontains=query) |
                Q(description__icontains=query)
            )[:limit]

            results['skills'] = [{
                'id': s.id,
                'type': 'skill',
                'title': s.name,
                'subtitle': s.category.name if s.category else None,
                'description': s.description[:100] if s.description else None,
                'avatar': None,
                'url': f'/skills?skill={s.id}'
            } for s in skills]
            total += len(results['skills'])

        return Response({
            'query': query,
            'results': results,
            'total': total
        })
