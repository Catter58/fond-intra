#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.accounts.models import User
from apps.skills.models import Skill, UserSkill, SkillCategory

# Создаем категории
prog_cat, _ = SkillCategory.objects.get_or_create(
    name="Программирование",
    defaults={'description': 'Языки программирования и фреймворки', 'order': 1}
)
soft_cat, _ = SkillCategory.objects.get_or_create(
    name="Soft Skills",
    defaults={'description': 'Гибкие навыки', 'order': 2}
)

print(f"Категории: {SkillCategory.objects.count()}")

# Создаем навыки
skills_data = [
    ("Python", prog_cat, "Язык программирования Python"),
    ("JavaScript", prog_cat, "Язык программирования JavaScript"),
    ("TypeScript", prog_cat, "Язык программирования TypeScript"),
    ("React", prog_cat, "Библиотека React"),
    ("Django", prog_cat, "Фреймворк Django"),
    ("Коммуникация", soft_cat, "Навыки коммуникации"),
    ("Лидерство", soft_cat, "Лидерские качества"),
]

for name, category, description in skills_data:
    skill, created = Skill.objects.get_or_create(
        name=name,
        category=category,
        defaults={'description': description}
    )
    if created:
        print(f"Создан навык: {name}")

print(f"Всего навыков: {Skill.objects.count()}")

# Получаем активных пользователей
users = list(User.objects.filter(is_active=True)[:3])
print(f"\nПользователи ({len(users)}):")
for user in users:
    print(f"  {user.id}: {user.first_name} {user.last_name}")

# Добавляем навыки пользователям
skills = list(Skill.objects.all()[:5])
levels = ['beginner', 'intermediate', 'advanced', 'expert']

for i, user in enumerate(users):
    print(f"\nДобавляю навыки для {user.first_name} {user.last_name}:")
    for j in range(3):  # По 3 навыка каждому
        if i + j < len(skills):
            skill = skills[(i + j) % len(skills)]
            user_skill, created = UserSkill.objects.get_or_create(
                user=user,
                skill=skill,
                defaults={'level': levels[j % len(levels)]}
            )
            if created:
                print(f"  + {skill.name} ({levels[j % len(levels)]})")
            else:
                print(f"  = {skill.name} (уже есть)")

print(f"\n✅ Итого UserSkills: {UserSkill.objects.count()}")
print("\n📝 Теперь можно тестировать:")
print("   1. Перейдите на /employees")
print("   2. Откройте профиль любого сотрудника с навыками")
print("   3. Нажмите на иконку рядом с навыком для подтверждения")
