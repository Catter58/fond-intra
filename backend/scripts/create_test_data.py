#!/usr/bin/env python
"""
Script to create test data for the FondSmena Intranet Portal.

Usage:
    cd backend
    source venv/bin/activate
    export DJANGO_SETTINGS_MODULE=config.settings.development
    export DATABASE_URL="postgres://fond_intra:devpassword@localhost:5432/fond_intra"
    python scripts/create_test_data.py

Or via Django shell:
    python manage.py shell < scripts/create_test_data.py
"""

import os
import sys
import django

# Setup Django if running as standalone script
if __name__ == "__main__":
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
    django.setup()

from django.utils import timezone
from datetime import timedelta
from apps.accounts.models import User
from apps.organization.models import Department, Position
from apps.achievements.models import Achievement, AchievementAward
from apps.news.models import News
from apps.bookings.models import ResourceType, Resource

def create_test_data():
    """Create all test data."""
    print("Creating test data...")

    # Create superuser first
    superuser, created = User.objects.get_or_create(
        email='admin@test.com',
        defaults={
            'first_name': 'Администратор',
            'last_name': 'Системы',
            'is_superuser': True,
            'is_staff': True,
            'is_active': True,
        }
    )
    if created:
        superuser.set_password('admin123')
        superuser.save()
        print("  Superuser: admin@test.com (created)")
    else:
        print("  Superuser: admin@test.com (exists)")

    # Create positions
    positions = {}
    position_names = ['Директор', 'Менеджер', 'Разработчик', 'Аналитик', 'Специалист']
    for i, name in enumerate(position_names):
        pos, _ = Position.objects.get_or_create(name=name, defaults={'level': i + 1})
        positions[name] = pos
    print(f"  Positions: {len(positions)}")

    # Create departments
    departments = {}
    dept_data = [
        ('IT отдел', 'Разработка и поддержка IT-систем'),
        ('HR отдел', 'Управление персоналом'),
        ('Маркетинг', 'Маркетинг и PR'),
        ('Администрация', 'Административное управление'),
    ]
    for name, desc in dept_data:
        dept, _ = Department.objects.get_or_create(
            name=name,
            defaults={'description': desc}
        )
        departments[name] = dept
    print(f"  Departments: {len(departments)}")

    # Create users
    users_data = [
        ('ivan.petrov@test.com', 'Иван', 'Петров', 'IT отдел', 'Директор'),
        ('maria.sidorova@test.com', 'Мария', 'Сидорова', 'HR отдел', 'Менеджер'),
        ('alexey.kozlov@test.com', 'Алексей', 'Козлов', 'IT отдел', 'Разработчик'),
        ('elena.novikova@test.com', 'Елена', 'Новикова', 'Маркетинг', 'Менеджер'),
        ('dmitry.volkov@test.com', 'Дмитрий', 'Волков', 'Администрация', 'Специалист'),
        ('anna.smirnova@test.com', 'Анна', 'Смирнова', 'Маркетинг', 'Специалист'),
        ('sergey.morozov@test.com', 'Сергей', 'Морозов', 'IT отдел', 'Разработчик'),
    ]

    created_users = []
    for email, first, last, dept_name, pos_name in users_data:
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'first_name': first,
                'last_name': last,
                'department': departments[dept_name],
                'position': positions[pos_name],
                'is_active': True,
            }
        )
        if created:
            user.set_password('test123')
            user.save()
        created_users.append(user)
    print(f"  Users: {len(created_users)}")

    # Get admin user
    admin = User.objects.filter(is_superuser=True).first()
    if not admin:
        admin = created_users[0] if created_users else None

    # Create achievements
    achievements_data = [
        ('Первопроходец', 'За первый вход в систему', '🚀', 'special'),
        ('Командный игрок', 'За активное участие в жизни команды', '🤝', 'corporate'),
        ('Профессионал', 'За высокие результаты работы', '⭐', 'professional'),
    ]

    achievements = []
    for name, desc, icon, category in achievements_data:
        ach, _ = Achievement.objects.get_or_create(
            name=name,
            defaults={
                'description': desc,
                'icon': icon,
                'category': category,
                'is_active': True,
            }
        )
        achievements.append(ach)
    print(f"  Achievements: {len(achievements)}")

    # Award achievements to some users
    if admin and achievements and created_users:
        for user in created_users[:3]:
            AchievementAward.objects.get_or_create(
                achievement=achievements[0],
                recipient=user,
                defaults={'awarded_by': admin, 'comment': 'Добро пожаловать!'}
            )

    # Create news
    if admin:
        news_data = [
            ('Добро пожаловать на портал!', 'Мы рады приветствовать вас на нашем корпоративном портале.'),
            ('Обновление системы', 'В системе появились новые функции: бронирование ресурсов и OKR.'),
        ]
        for title, content in news_data:
            News.objects.get_or_create(
                title=title,
                defaults={
                    'content': content,
                    'author': admin,
                    'status': 'published',
                }
            )
        print(f"  News: {len(news_data)}")

    # Create OKR data
    try:
        from apps.okr.models import OKRPeriod, Objective

        period, _ = OKRPeriod.objects.get_or_create(
            name='Q1 2025',
            defaults={
                'starts_at': timezone.now().date(),
                'ends_at': (timezone.now() + timedelta(days=90)).date(),
                'is_active': True,
            }
        )

        if admin:
            Objective.objects.get_or_create(
                title='Запуск корпоративного портала',
                period=period,
                defaults={
                    'description': 'Внедрить корпоративный портал для всех сотрудников',
                    'owner': admin,
                    'level': 'company',
                    'status': 'active',
                }
            )
        print("  OKR Period: 1, Objectives: 1")
    except ImportError:
        print("  OKR module not available, skipping...")

    # Create booking resources
    try:
        resource_types_data = [
            ('Переговорная', 'meeting-room', 'Комнаты для совещаний'),
            ('Оборудование', 'equipment', 'Техника и оборудование'),
            ('Рабочее место', 'workspace', 'Рабочие места'),
        ]

        resource_types = []
        for name, slug, desc in resource_types_data:
            rt, _ = ResourceType.objects.get_or_create(
                slug=slug,
                defaults={'name': name, 'description': desc}
            )
            resource_types.append(rt)

        resources_data = [
            ('Переговорная "Альфа"', resource_types[0], 'Этаж 2', 10),
            ('Проектор Epson', resource_types[1], 'IT отдел', 1),
            ('Коворкинг зона', resource_types[2], 'Этаж 1', 20),
        ]

        for name, rtype, location, capacity in resources_data:
            Resource.objects.get_or_create(
                name=name,
                defaults={
                    'type': rtype,
                    'location': location,
                    'capacity': capacity,
                    'is_active': True,
                }
            )
        print(f"  Resource Types: {len(resource_types)}, Resources: {len(resources_data)}")
    except ImportError:
        print("  Bookings module not available, skipping...")

    # Print summary
    print("\n" + "=" * 50)
    print("✅ Test data created successfully!")
    print("=" * 50)
    print(f"\nUsers: {User.objects.count()}")
    print(f"Departments: {Department.objects.count()}")
    print(f"Achievements: {Achievement.objects.count()}")
    print(f"News: {News.objects.count()}")

    print("\n🔑 Test user credentials:")
    print("\n   Superuser (full admin access):")
    print("   - admin@test.com / admin123")
    print("\n   Regular users (password: test123):")
    for email, first, last, dept, pos in users_data:
        print(f"   - {email} ({first} {last}, {pos})")


if __name__ == "__main__":
    create_test_data()
