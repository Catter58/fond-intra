"""
Management command to create initial seed data for demo/testing.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date, timedelta
import random

User = get_user_model()


class Command(BaseCommand):
    help = 'Create seed data for demo/testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding',
        )

    def handle(self, *args, **options):
        from apps.organization.models import Department, Position
        from apps.achievements.models import Achievement, AchievementAward
        from apps.news.models import News
        from apps.roles.models import Role

        if options['clear']:
            self.stdout.write('Clearing existing data...')
            User.objects.filter(is_superuser=False).delete()
            Department.objects.all().delete()
            Position.objects.all().delete()
            Achievement.objects.all().delete()
            News.objects.all().delete()

        # Create admin user
        self.stdout.write('Creating admin user...')
        admin, created = User.objects.get_or_create(
            email='admin@company.local',
            defaults={
                'first_name': 'Администратор',
                'last_name': 'Системы',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            admin.set_password('admin123')
            admin.save()
            self.stdout.write(self.style.SUCCESS('Admin user created: admin@company.local / admin123'))
        else:
            self.stdout.write('Admin user already exists')

        # Create positions
        self.stdout.write('Creating positions...')
        positions_data = [
            ('Генеральный директор', 1),
            ('Директор по развитию', 2),
            ('Руководитель отдела', 3),
            ('Ведущий специалист', 4),
            ('Старший специалист', 5),
            ('Специалист', 6),
            ('Младший специалист', 7),
            ('Стажёр', 8),
        ]
        positions = {}
        for name, level in positions_data:
            pos, _ = Position.objects.get_or_create(
                name=name, defaults={'level': level}
            )
            positions[name] = pos

        # Create departments
        self.stdout.write('Creating departments...')
        main_dept, _ = Department.objects.get_or_create(
            name='Руководство',
            defaults={'description': 'Высшее руководство компании', 'order': 1}
        )

        depts_data = [
            ('Отдел разработки', 'Разработка программного обеспечения', 2),
            ('Отдел тестирования', 'Контроль качества', 3),
            ('Отдел маркетинга', 'Продвижение и реклама', 4),
            ('Отдел продаж', 'Работа с клиентами', 5),
            ('HR отдел', 'Управление персоналом', 6),
            ('Финансовый отдел', 'Бухгалтерия и финансы', 7),
        ]
        departments = {'Руководство': main_dept}
        for name, desc, order in depts_data:
            dept, _ = Department.objects.get_or_create(
                name=name,
                defaults={'description': desc, 'order': order, 'parent': main_dept}
            )
            departments[name] = dept

        # Create achievements
        self.stdout.write('Creating achievement types...')
        achievements_data = [
            ('Первые шаги', 'За успешное прохождение испытательного срока', '🎯', 'professional'),
            ('Наставник', 'За обучение и поддержку новых сотрудников', '🎓', 'social'),
            ('Инноватор', 'За внедрение новых идей и решений', '💡', 'professional'),
            ('Командный игрок', 'За отличную работу в команде', '🤝', 'social'),
            ('Перфекционист', 'За высочайшее качество работы', '⭐', 'professional'),
            ('Герой месяца', 'За выдающиеся результаты месяца', '🏆', 'corporate'),
            ('Марафонец', 'За 5 лет работы в компании', '🏅', 'corporate'),
            ('Душа компании', 'За создание позитивной атмосферы', '❤️', 'social'),
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

        # Create demo users
        self.stdout.write('Creating demo users...')
        demo_users_data = [
            ('ceo@company.local', 'Иван', 'Петров', 'Сергеевич', 'Руководство', 'Генеральный директор'),
            ('dev.lead@company.local', 'Алексей', 'Смирнов', 'Андреевич', 'Отдел разработки', 'Руководитель отдела'),
            ('developer1@company.local', 'Мария', 'Иванова', 'Петровна', 'Отдел разработки', 'Ведущий специалист'),
            ('developer2@company.local', 'Дмитрий', 'Козлов', 'Игоревич', 'Отдел разработки', 'Специалист'),
            ('qa.lead@company.local', 'Елена', 'Новикова', 'Александровна', 'Отдел тестирования', 'Руководитель отдела'),
            ('tester1@company.local', 'Андрей', 'Морозов', 'Владимирович', 'Отдел тестирования', 'Специалист'),
            ('marketing@company.local', 'Ольга', 'Соколова', 'Николаевна', 'Отдел маркетинга', 'Руководитель отдела'),
            ('hr@company.local', 'Наталья', 'Волкова', 'Сергеевна', 'HR отдел', 'Руководитель отдела'),
            ('sales@company.local', 'Сергей', 'Лебедев', 'Михайлович', 'Отдел продаж', 'Ведущий специалист'),
            ('finance@company.local', 'Татьяна', 'Федорова', 'Ивановна', 'Финансовый отдел', 'Руководитель отдела'),
        ]

        users = [admin]
        for email, first, last, patron, dept_name, pos_name in demo_users_data:
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': first,
                    'last_name': last,
                    'patronymic': patron,
                    'department': departments.get(dept_name),
                    'position': positions.get(pos_name),
                    'hire_date': date.today() - timedelta(days=random.randint(30, 1000)),
                    'birth_date': date(1985 + random.randint(0, 15), random.randint(1, 12), random.randint(1, 28)),
                }
            )
            if created:
                user.set_password('password123')
                user.save()
            users.append(user)

        # Assign HR role to hr user
        hr_user = User.objects.filter(email='hr@company.local').first()
        if hr_user:
            hr_role = Role.objects.filter(name='HR').first()
            if hr_role:
                hr_user.role = hr_role
                hr_user.save()

        # Create some achievement awards
        self.stdout.write('Creating achievement awards...')
        for _ in range(15):
            giver = random.choice(users)
            recipient = random.choice([u for u in users if u != giver])
            ach = random.choice(achievements)
            AchievementAward.objects.get_or_create(
                achievement=ach,
                recipient=recipient,
                awarded_by=giver,
                defaults={
                    'comment': f'Отличная работа! {recipient.first_name} заслуживает эту награду за усердие и профессионализм.',
                }
            )

        # Create some news
        self.stdout.write('Creating news...')
        news_data = [
            ('Добро пожаловать на корпоративный портал!',
             'Мы рады представить вам новый корпоративный портал Fond Intra. Здесь вы сможете:\n\n'
             '- Просматривать информацию о коллегах\n'
             '- Отслеживать дни рождения\n'
             '- Награждать коллег достижениями\n'
             '- Читать корпоративные новости\n\n'
             'Приятного использования!',
             True),
            ('Обновление системы достижений',
             'Мы обновили систему достижений! Теперь вы можете награждать своих коллег за их заслуги. '
             'Каждое достижение сопровождается обязательным комментарием, чтобы получатель знал, за что его отметили.',
             False),
            ('Планы на следующий квартал',
             'В следующем квартале нас ждут интересные проекты. Следите за обновлениями в этом разделе.',
             False),
        ]
        for title, content, pinned in news_data:
            News.objects.get_or_create(
                title=title,
                defaults={
                    'content': content,
                    'author': admin,
                    'is_pinned': pinned,
                    'is_published': True,
                }
            )

        self.stdout.write(self.style.SUCCESS('Seed data created successfully!'))
        self.stdout.write('')
        self.stdout.write('Demo accounts:')
        self.stdout.write('  Admin: admin@company.local / admin123')
        self.stdout.write('  Users: [email] / password123')
