# Технический план: Корпоративный портал "Fond Intra"

## 1. Обзор проекта

### 1.1 Цель
Внутренний корпоративный портал для управления информацией о сотрудниках, организационной структурой, системой достижений и корпоративными новостями.

### 1.2 Масштаб
- До 100 сотрудников
- Веб-приложение с адаптивным дизайном (mobile-first)
- Без интеграций с внешними системами (1C, SAP)

### 1.3 Дизайн-система
- **Компоненты**: shadcn/ui
- **Стилистика**: IBM Carbon Design System (цвета, типографика, spacing, иконки)
- **Адаптивность**: Desktop, Tablet, Mobile

---

## 2. Технологический стек

### 2.1 Backend
| Технология | Версия | Назначение |
|------------|--------|------------|
| Python | 3.12+ | Язык программирования |
| Django | 5.0+ | Web-фреймворк |
| Django REST Framework | 3.15+ | REST API |
| PostgreSQL | 16+ | База данных |
| Redis | 7+ | Кеширование, сессии |
| Celery | 5.3+ | Фоновые задачи (уведомления, email) |
| Pillow | 10+ | Обработка изображений |
| django-filter | 24+ | Фильтрация API |
| drf-spectacular | 0.27+ | OpenAPI документация |

### 2.2 Frontend
| Технология | Версия | Назначение |
|------------|--------|------------|
| React | 18+ | UI библиотека |
| TypeScript | 5.3+ | Типизация |
| Vite | 5+ | Сборщик |
| React Router | 6+ | Маршрутизация |
| TanStack Query | 5+ | Управление серверным состоянием |
| Zustand | 4+ | Клиентское состояние |
| shadcn/ui | latest | UI компоненты |
| Tailwind CSS | 3.4+ | Стилизация |
| React Hook Form | 7+ | Формы |
| Zod | 3+ | Валидация |
| date-fns | 3+ | Работа с датами |
| Lucide React | latest | Иконки |

### 2.3 Инфраструктура
| Технология | Назначение |
|------------|------------|
| Docker | Контейнеризация |
| Docker Compose | Оркестрация для разработки |
| Nginx | Reverse proxy, статика |
| GitHub Actions | CI/CD |

---

## 3. Архитектура

### 3.1 Общая схема

```
┌─────────────────────────────────────────────────────────────────────┐
│                            NGINX                                     │
│                    (reverse proxy, static files)                     │
└─────────────────────┬───────────────────────┬───────────────────────┘
                      │                       │
                      ▼                       ▼
┌─────────────────────────────┐   ┌─────────────────────────────────┐
│     FRONTEND (React SPA)    │   │      BACKEND (Django API)       │
│                             │   │                                 │
│  - Vite dev server (dev)    │   │  - Django REST Framework        │
│  - Static build (prod)      │   │  - JWT Authentication           │
│                             │   │  - File uploads                 │
└─────────────────────────────┘   └───────────────┬─────────────────┘
                                                  │
                      ┌───────────────────────────┼───────────────┐
                      │                           │               │
                      ▼                           ▼               ▼
            ┌─────────────────┐       ┌─────────────┐    ┌─────────────┐
            │   PostgreSQL    │       │    Redis    │    │   Celery    │
            │                 │       │             │    │   Worker    │
            │  - Users        │       │  - Cache    │    │             │
            │  - Achievements │       │  - Sessions │    │  - Emails   │
            │  - News         │       │             │    │  - Notifs   │
            │  - Audit logs   │       │             │    │             │
            └─────────────────┘       └─────────────┘    └─────────────┘
```

### 3.2 Структура Backend (Django Apps)

```
backend/
├── config/                 # Настройки проекта
│   ├── settings/
│   │   ├── base.py
│   │   ├── development.py
│   │   └── production.py
│   ├── urls.py
│   ├── celery.py
│   └── wsgi.py
├── apps/
│   ├── accounts/          # Аутентификация, пользователи
│   │   ├── models.py      # User, UserStatus
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── permissions.py
│   │   └── signals.py
│   ├── organization/      # Структура организации
│   │   ├── models.py      # Department, Position
│   │   ├── serializers.py
│   │   └── views.py
│   ├── skills/            # Навыки и компетенции
│   │   ├── models.py      # Skill, SkillCategory
│   │   ├── serializers.py
│   │   └── views.py
│   ├── achievements/      # Система ачивок
│   │   ├── models.py      # Achievement, AchievementAward
│   │   ├── serializers.py
│   │   └── views.py
│   ├── news/              # Новости
│   │   ├── models.py      # News, Comment, Reaction
│   │   ├── serializers.py
│   │   └── views.py
│   ├── notifications/     # Уведомления
│   │   ├── models.py      # Notification, NotificationSettings
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── tasks.py       # Celery tasks
│   ├── roles/             # RBAC
│   │   ├── models.py      # Role, Permission
│   │   ├── serializers.py
│   │   └── views.py
│   └── audit/             # Аудит
│       ├── models.py      # AuditLog
│       ├── serializers.py
│       ├── views.py
│       └── middleware.py
├── core/                  # Общие утилиты
│   ├── mixins.py
│   ├── pagination.py
│   ├── exceptions.py
│   └── utils.py
├── media/                 # Загруженные файлы
└── manage.py
```

### 3.3 Структура Frontend

```
frontend/
├── public/
├── src/
│   ├── api/               # API клиент
│   │   ├── client.ts      # Axios instance
│   │   ├── endpoints/
│   │   │   ├── auth.ts
│   │   │   ├── users.ts
│   │   │   ├── achievements.ts
│   │   │   ├── news.ts
│   │   │   └── ...
│   │   └── types/         # API типы (автогенерация из OpenAPI)
│   ├── components/
│   │   ├── ui/            # shadcn компоненты
│   │   ├── layout/        # Header, Sidebar, Footer
│   │   ├── forms/         # Переиспользуемые формы
│   │   └── features/      # Бизнес-компоненты
│   │       ├── profile/
│   │       ├── achievements/
│   │       ├── news/
│   │       └── ...
│   ├── hooks/             # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useNotifications.ts
│   │   └── ...
│   ├── pages/             # Страницы (routes)
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── profile/
│   │   ├── employees/
│   │   ├── achievements/
│   │   ├── news/
│   │   ├── admin/
│   │   └── ...
│   ├── store/             # Zustand stores
│   │   ├── authStore.ts
│   │   └── uiStore.ts
│   ├── lib/               # Утилиты
│   │   ├── utils.ts
│   │   ├── constants.ts
│   │   └── validators.ts
│   ├── styles/            # Глобальные стили
│   │   ├── globals.css
│   │   └── carbon-theme.css  # Carbon Design tokens
│   ├── App.tsx
│   ├── main.tsx
│   └── router.tsx
├── components.json        # shadcn config
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── package.json
```

---

## 4. Модель данных

### 4.1 Диаграмма связей (ERD)

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    User      │       │  Department  │       │   Position   │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id           │──┐    │ id           │       │ id           │
│ email        │  │    │ name         │◄──────│ name         │
│ password     │  │    │ description  │       │ level        │
│ first_name   │  │    │ parent_id    │───┐   └──────────────┘
│ last_name    │  │    │ head_id      │───┼──►
│ patronymic   │  │    └──────────────┘   │
│ avatar       │  │           ▲           │
│ phone_work   │  │           │           │
│ phone_personal│ └───────────┴───────────┘
│ telegram     │
│ birth_date   │       ┌──────────────┐
│ hire_date    │       │  UserStatus  │
│ department_id│◄──────│              │
│ position_id  │◄──────│ id           │
│ manager_id   │───┐   │ user_id      │
│ is_active    │   │   │ status       │
│ is_archived  │   │   │ start_date   │
└──────────────┘   │   │ end_date     │
       ▲           │   │ comment      │
       │           │   └──────────────┘
       └───────────┘

┌──────────────┐       ┌──────────────────┐
│    Role      │       │    Permission    │
├──────────────┤       ├──────────────────┤
│ id           │◄─────►│ id               │
│ name         │  M:M  │ codename         │
│ description  │       │ name             │
│ is_system    │       │ category         │
└──────────────┘       └──────────────────┘

┌──────────────┐       ┌──────────────────┐
│ Achievement  │       │ AchievementAward │
├──────────────┤       ├──────────────────┤
│ id           │◄──────│ id               │
│ name         │       │ achievement_id   │
│ description  │       │ recipient_id     │──► User
│ icon         │       │ awarded_by_id    │──► User
│ category     │       │ comment          │ (обязательный)
│ is_active    │       │ awarded_at       │
│ created_by_id│       └──────────────────┘
└──────────────┘

┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    News      │       │   Comment    │       │   Reaction   │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id           │◄──────│ id           │       │ id           │
│ title        │       │ news_id      │       │ news_id      │──► News
│ content      │       │ author_id    │──►User│ user_id      │──► User
│ author_id    │──►User│ parent_id    │───┐   │ type         │
│ is_pinned    │       │ content      │   │   └──────────────┘
│ is_published │       │ created_at   │   │   (like/celebrate/
│ created_at   │       └──────────────┘   │    support/insightful)
│ updated_at   │              ▲           │
└──────────────┘              └───────────┘

┌──────────────────┐   ┌────────────────────────┐
│  NewsAttachment  │   │  NotificationSettings  │
├──────────────────┤   ├────────────────────────┤
│ id               │   │ id                     │
│ news_id          │──►│ user_id                │──► User
│ file             │   │ birthdays_enabled      │
│ file_name        │   │ achievements_enabled   │
│ file_type        │   │ news_enabled           │
│ uploaded_at      │   │ email_enabled          │
└──────────────────┘   └────────────────────────┘

┌──────────────┐       ┌──────────────┐
│ Notification │       │   Skill      │
├──────────────┤       ├──────────────┤
│ id           │       │ id           │
│ user_id      │──►User│ name         │
│ type         │       │ category_id  │──► SkillCategory
│ title        │       └──────────────┘
│ message      │              ▲
│ link         │              │ M:M
│ is_read      │              ▼
│ created_at   │       ┌──────────────┐
└──────────────┘       │  UserSkill   │
                       ├──────────────┤
┌──────────────┐       │ user_id      │──► User
│   AuditLog   │       │ skill_id     │
├──────────────┤       │ level        │ (beginner/intermediate/expert)
│ id           │       └──────────────┘
│ user_id      │──► User
│ action       │
│ entity_type  │
│ entity_id    │
│ old_values   │ (JSON)
│ new_values   │ (JSON)
│ ip_address   │
│ user_agent   │
│ created_at   │
└──────────────┘
```

### 4.2 Детальное описание моделей

#### User (расширение Django AbstractUser)
```python
class User(AbstractUser):
    # Основное
    email = EmailField(unique=True)  # Используется для входа
    first_name = CharField(max_length=50)
    last_name = CharField(max_length=50)
    patronymic = CharField(max_length=50, blank=True)

    # Аватар
    avatar = ImageField(upload_to='avatars/', null=True, blank=True)

    # Контакты
    phone_work = CharField(max_length=20, blank=True)
    phone_personal = CharField(max_length=20, blank=True)  # Приватное поле
    telegram = CharField(max_length=50, blank=True)

    # Даты
    birth_date = DateField(null=True, blank=True)
    hire_date = DateField(null=True, blank=True)

    # Организация
    department = ForeignKey('organization.Department', null=True, on_delete=SET_NULL)
    position = ForeignKey('organization.Position', null=True, on_delete=SET_NULL)
    manager = ForeignKey('self', null=True, blank=True, on_delete=SET_NULL)

    # Статус
    is_active = BooleanField(default=True)
    is_archived = BooleanField(default=False)  # Для уволенных
    archived_at = DateTimeField(null=True, blank=True)

    # Роли
    roles = ManyToManyField('roles.Role', blank=True)

    USERNAME_FIELD = 'email'
```

#### UserStatus (статусы: отпуск, больничный, командировка)
```python
class UserStatus(Model):
    class StatusType(TextChoices):
        VACATION = 'vacation', 'Отпуск'
        SICK_LEAVE = 'sick_leave', 'Больничный'
        BUSINESS_TRIP = 'business_trip', 'Командировка'
        REMOTE = 'remote', 'Удалённая работа'
        MATERNITY = 'maternity', 'Декретный отпуск'

    user = ForeignKey(User, on_delete=CASCADE, related_name='statuses')
    status = CharField(max_length=20, choices=StatusType.choices)
    start_date = DateField()
    end_date = DateField(null=True, blank=True)
    comment = TextField(blank=True)
    created_by = ForeignKey(User, on_delete=SET_NULL, null=True)
```

#### Department
```python
class Department(Model):
    name = CharField(max_length=100)
    description = TextField(blank=True)
    parent = ForeignKey('self', null=True, blank=True, on_delete=CASCADE)
    head = ForeignKey(User, null=True, blank=True, on_delete=SET_NULL)
    order = PositiveIntegerField(default=0)  # Для сортировки

    class Meta:
        ordering = ['order', 'name']
```

#### Achievement и AchievementAward
```python
class Achievement(Model):
    class Category(TextChoices):
        PROFESSIONAL = 'professional', 'Профессиональные'
        CORPORATE = 'corporate', 'Корпоративные'
        SOCIAL = 'social', 'Социальные'
        SPECIAL = 'special', 'Особые'

    name = CharField(max_length=100)
    description = TextField()
    icon = ImageField(upload_to='achievements/')
    category = CharField(max_length=20, choices=Category.choices)
    is_active = BooleanField(default=True)
    created_by = ForeignKey(User, on_delete=SET_NULL, null=True)
    created_at = DateTimeField(auto_now_add=True)


class AchievementAward(Model):
    achievement = ForeignKey(Achievement, on_delete=CASCADE)
    recipient = ForeignKey(User, on_delete=CASCADE, related_name='received_achievements')
    awarded_by = ForeignKey(User, on_delete=SET_NULL, null=True, related_name='given_achievements')
    comment = TextField()  # Обязательное поле
    awarded_at = DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-awarded_at']
```

#### News, Comment, Reaction
```python
class News(Model):
    title = CharField(max_length=200)
    content = TextField()
    author = ForeignKey(User, on_delete=SET_NULL, null=True)
    is_pinned = BooleanField(default=False)
    is_published = BooleanField(default=True)
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_pinned', '-created_at']


class NewsAttachment(Model):
    news = ForeignKey(News, on_delete=CASCADE, related_name='attachments')
    file = FileField(upload_to='news_attachments/')
    file_name = CharField(max_length=255)
    file_type = CharField(max_length=50)  # MIME type
    uploaded_at = DateTimeField(auto_now_add=True)


class Comment(Model):
    news = ForeignKey(News, on_delete=CASCADE, related_name='comments')
    author = ForeignKey(User, on_delete=SET_NULL, null=True)
    parent = ForeignKey('self', null=True, blank=True, on_delete=CASCADE)  # Для вложенности
    content = TextField()
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']


class Reaction(Model):
    class ReactionType(TextChoices):
        LIKE = 'like', 'Нравится'
        CELEBRATE = 'celebrate', 'Поздравляю'
        SUPPORT = 'support', 'Поддерживаю'
        INSIGHTFUL = 'insightful', 'Интересно'

    news = ForeignKey(News, on_delete=CASCADE, related_name='reactions')
    user = ForeignKey(User, on_delete=CASCADE)
    type = CharField(max_length=20, choices=ReactionType.choices)
    created_at = DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['news', 'user']  # Один пользователь - одна реакция
```

#### Role и Permission (RBAC)
```python
class Permission(Model):
    codename = CharField(max_length=100, unique=True)
    name = CharField(max_length=200)
    category = CharField(max_length=50)  # users, achievements, news, admin

    class Meta:
        ordering = ['category', 'codename']


class Role(Model):
    name = CharField(max_length=100, unique=True)
    description = TextField(blank=True)
    permissions = ManyToManyField(Permission, blank=True)
    is_system = BooleanField(default=False)  # Системные роли нельзя удалить
    created_at = DateTimeField(auto_now_add=True)
```

#### Notification и NotificationSettings
```python
class Notification(Model):
    class NotificationType(TextChoices):
        BIRTHDAY = 'birthday', 'День рождения'
        ACHIEVEMENT = 'achievement', 'Ачивка'
        NEWS = 'news', 'Новость'
        COMMENT = 'comment', 'Комментарий'
        SYSTEM = 'system', 'Системное'

    user = ForeignKey(User, on_delete=CASCADE, related_name='notifications')
    type = CharField(max_length=20, choices=NotificationType.choices)
    title = CharField(max_length=200)
    message = TextField()
    link = CharField(max_length=500, blank=True)  # URL для перехода
    is_read = BooleanField(default=False)
    created_at = DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


class NotificationSettings(Model):
    user = OneToOneField(User, on_delete=CASCADE, related_name='notification_settings')
    birthdays_enabled = BooleanField(default=True)
    achievements_enabled = BooleanField(default=True)
    news_enabled = BooleanField(default=True)
    comments_enabled = BooleanField(default=True)
    email_enabled = BooleanField(default=False)
```

#### AuditLog
```python
class AuditLog(Model):
    class Action(TextChoices):
        CREATE = 'create', 'Создание'
        UPDATE = 'update', 'Изменение'
        DELETE = 'delete', 'Удаление'
        LOGIN = 'login', 'Вход'
        LOGOUT = 'logout', 'Выход'
        ARCHIVE = 'archive', 'Архивация'

    user = ForeignKey(User, on_delete=SET_NULL, null=True)
    action = CharField(max_length=20, choices=Action.choices)
    entity_type = CharField(max_length=100)  # 'User', 'News', etc.
    entity_id = PositiveIntegerField(null=True)
    old_values = JSONField(null=True, blank=True)
    new_values = JSONField(null=True, blank=True)
    ip_address = GenericIPAddressField(null=True)
    user_agent = TextField(blank=True)
    created_at = DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            Index(fields=['entity_type', 'entity_id']),
            Index(fields=['user', 'created_at']),
        ]
```

---

## 5. API Endpoints

### 5.1 Аутентификация (`/api/v1/auth/`)

| Method | Endpoint | Описание | Доступ |
|--------|----------|----------|--------|
| POST | `/login/` | Вход (email + password) → JWT tokens | Public |
| POST | `/logout/` | Выход (invalidate refresh token) | Auth |
| POST | `/token/refresh/` | Обновление access token | Auth |
| POST | `/password/change/` | Смена пароля | Auth |
| POST | `/password/reset/` | Запрос сброса пароля | Public |
| POST | `/password/reset/confirm/` | Подтверждение сброса | Public |
| GET | `/sessions/` | Список активных сессий | Auth |
| DELETE | `/sessions/{id}/` | Завершить сессию | Auth |

### 5.2 Пользователи (`/api/v1/users/`)

| Method | Endpoint | Описание | Доступ |
|--------|----------|----------|--------|
| GET | `/me/` | Текущий пользователь (полный профиль) | Auth |
| PATCH | `/me/` | Обновление своего профиля | Auth |
| POST | `/me/avatar/` | Загрузка аватара | Auth |
| DELETE | `/me/avatar/` | Удаление аватара | Auth |
| GET | `/` | Список сотрудников (с поиском) | Auth |
| GET | `/{id}/` | Профиль сотрудника | Auth |
| GET | `/birthdays/` | Дни рождения (фильтр по периоду) | Auth |
| GET | `/search/?q=` | Поиск по ФИО | Auth |

### 5.3 Администрирование пользователей (`/api/v1/admin/users/`)

| Method | Endpoint | Описание | Доступ |
|--------|----------|----------|--------|
| POST | `/` | Создание сотрудника | HR+ |
| PUT | `/{id}/` | Полное редактирование | HR+ |
| POST | `/{id}/archive/` | Архивация (увольнение) | HR+ |
| POST | `/{id}/restore/` | Восстановление из архива | HR+ |
| POST | `/{id}/reset-password/` | Сброс пароля сотруднику | HR+ |
| GET | `/archived/` | Список архивированных | HR+ |

### 5.4 Статусы пользователей (`/api/v1/users/{user_id}/statuses/`)

| Method | Endpoint | Описание | Доступ |
|--------|----------|----------|--------|
| GET | `/` | История статусов сотрудника | Auth |
| GET | `/current/` | Текущий статус | Auth |
| POST | `/` | Установить статус | HR+/Manager |
| DELETE | `/{id}/` | Удалить статус | HR+ |

### 5.5 Организация (`/api/v1/organization/`)

| Method | Endpoint | Описание | Доступ |
|--------|----------|----------|--------|
| GET | `/departments/` | Список отделов | Auth |
| POST | `/departments/` | Создать отдел | Admin |
| PUT | `/departments/{id}/` | Редактировать отдел | Admin |
| DELETE | `/departments/{id}/` | Удалить отдел | Admin |
| GET | `/positions/` | Список должностей | Auth |
| POST | `/positions/` | Создать должность | Admin |
| PUT | `/positions/{id}/` | Редактировать должность | Admin |
| DELETE | `/positions/{id}/` | Удалить должность | Admin |
| GET | `/tree/` | Организационное дерево | Auth |

### 5.6 Навыки (`/api/v1/skills/`)

| Method | Endpoint | Описание | Доступ |
|--------|----------|----------|--------|
| GET | `/categories/` | Категории навыков | Auth |
| GET | `/` | Список всех навыков | Auth |
| POST | `/` | Создать навык | Admin |
| GET | `/me/` | Мои навыки | Auth |
| POST | `/me/` | Добавить себе навык | Auth |
| DELETE | `/me/{skill_id}/` | Удалить свой навык | Auth |

### 5.7 Ачивки (`/api/v1/achievements/`)

| Method | Endpoint | Описание | Доступ |
|--------|----------|----------|--------|
| GET | `/types/` | Типы ачивок (каталог) | Auth |
| POST | `/types/` | Создать тип ачивки | AchievementAdmin |
| PUT | `/types/{id}/` | Редактировать тип | AchievementAdmin |
| DELETE | `/types/{id}/` | Деактивировать тип | AchievementAdmin |
| GET | `/feed/` | Лента выданных ачивок | Auth |
| POST | `/award/` | Выдать ачивку | Auth |
| GET | `/user/{user_id}/` | Ачивки пользователя | Auth |
| GET | `/my/` | Мои ачивки | Auth |
| GET | `/stats/` | Статистика по ачивкам | Auth |

### 5.8 Новости (`/api/v1/news/`)

| Method | Endpoint | Описание | Доступ |
|--------|----------|----------|--------|
| GET | `/` | Список новостей (пагинация) | Auth |
| POST | `/` | Создать новость | Auth |
| GET | `/{id}/` | Детали новости | Auth |
| PUT | `/{id}/` | Редактировать (автор/admin) | Author/Admin |
| DELETE | `/{id}/` | Удалить (автор/admin) | Author/Admin |
| POST | `/{id}/attachments/` | Добавить вложение | Author |
| DELETE | `/{id}/attachments/{att_id}/` | Удалить вложение | Author |
| POST | `/{id}/pin/` | Закрепить новость | ContentManager+ |
| POST | `/{id}/unpin/` | Открепить новость | ContentManager+ |

### 5.9 Комментарии (`/api/v1/news/{news_id}/comments/`)

| Method | Endpoint | Описание | Доступ |
|--------|----------|----------|--------|
| GET | `/` | Комментарии к новости | Auth |
| POST | `/` | Добавить комментарий | Auth |
| PUT | `/{id}/` | Редактировать (автор) | Author |
| DELETE | `/{id}/` | Удалить (автор/admin) | Author/Admin |

### 5.10 Реакции (`/api/v1/news/{news_id}/reactions/`)

| Method | Endpoint | Описание | Доступ |
|--------|----------|----------|--------|
| GET | `/` | Реакции к новости | Auth |
| POST | `/` | Поставить/изменить реакцию | Auth |
| DELETE | `/` | Убрать свою реакцию | Auth |

### 5.11 Уведомления (`/api/v1/notifications/`)

| Method | Endpoint | Описание | Доступ |
|--------|----------|----------|--------|
| GET | `/` | Мои уведомления | Auth |
| GET | `/unread-count/` | Количество непрочитанных | Auth |
| POST | `/{id}/read/` | Отметить как прочитанное | Auth |
| POST | `/read-all/` | Отметить все прочитанными | Auth |
| GET | `/settings/` | Настройки уведомлений | Auth |
| PUT | `/settings/` | Обновить настройки | Auth |

### 5.12 Роли (`/api/v1/admin/roles/`)

| Method | Endpoint | Описание | Доступ |
|--------|----------|----------|--------|
| GET | `/permissions/` | Все доступные права | Admin |
| GET | `/` | Список ролей | Admin |
| POST | `/` | Создать роль | Admin |
| PUT | `/{id}/` | Редактировать роль | Admin |
| DELETE | `/{id}/` | Удалить роль (не системную) | Admin |
| POST | `/{id}/assign/{user_id}/` | Назначить роль | Admin |
| POST | `/{id}/revoke/{user_id}/` | Снять роль | Admin |

### 5.13 Аудит (`/api/v1/admin/audit/`)

| Method | Endpoint | Описание | Доступ |
|--------|----------|----------|--------|
| GET | `/` | Журнал аудита (фильтры) | Admin |
| GET | `/entity/{type}/{id}/` | История сущности | Admin |
| GET | `/user/{user_id}/` | Действия пользователя | Admin |
| GET | `/export/` | Экспорт в CSV | Admin |

---

## 6. Права доступа (Permissions)

### 6.1 Категории прав

```python
PERMISSIONS = {
    # Пользователи
    'users.view_all': 'Просмотр всех профилей',
    'users.view_private': 'Просмотр приватных данных',
    'users.edit_own': 'Редактирование своего профиля',
    'users.edit_all': 'Редактирование любых профилей',
    'users.create': 'Создание пользователей',
    'users.archive': 'Архивация пользователей',
    'users.manage_statuses': 'Управление статусами',

    # Организация
    'organization.view': 'Просмотр структуры',
    'organization.manage': 'Управление структурой',

    # Ачивки
    'achievements.view': 'Просмотр ачивок',
    'achievements.award': 'Выдача ачивок',
    'achievements.manage': 'Управление типами ачивок',

    # Новости
    'news.view': 'Просмотр новостей',
    'news.create': 'Создание новостей',
    'news.edit_own': 'Редактирование своих новостей',
    'news.edit_all': 'Редактирование любых новостей',
    'news.delete_own': 'Удаление своих новостей',
    'news.delete_all': 'Удаление любых новостей',
    'news.pin': 'Закрепление новостей',

    # Комментарии
    'comments.create': 'Создание комментариев',
    'comments.edit_own': 'Редактирование своих комментариев',
    'comments.delete_all': 'Удаление любых комментариев',

    # Роли
    'roles.view': 'Просмотр ролей',
    'roles.manage': 'Управление ролями',

    # Аудит
    'audit.view': 'Просмотр аудита',
    'audit.export': 'Экспорт аудита',
}
```

### 6.2 Предустановленные роли

| Роль | Права |
|------|-------|
| **Employee** | `users.view_all`, `users.edit_own`, `organization.view`, `achievements.view`, `achievements.award`, `news.*_own`, `comments.create`, `comments.edit_own` |
| **HR** | Employee + `users.view_private`, `users.edit_all`, `users.create`, `users.archive`, `users.manage_statuses` |
| **Content Manager** | Employee + `news.edit_all`, `news.delete_all`, `news.pin`, `comments.delete_all` |
| **Achievement Admin** | Employee + `achievements.manage` |
| **Admin** | Все права |

---

## 7. Безопасность

### 7.1 Аутентификация
- JWT токены (access: 15 мин, refresh: 7 дней)
- Хранение refresh token в HttpOnly cookie
- Access token в памяти (не localStorage)
- Ротация refresh токенов при обновлении

### 7.2 Защита API
- Rate limiting: 100 запросов/минуту на пользователя
- CORS: только домен фронтенда
- CSRF защита для cookie-based auth
- Input validation на уровне serializers

### 7.3 Защита данных
- Хеширование паролей: Argon2
- Приватные поля (phone_personal) — только для владельца и HR
- Загружаемые файлы: проверка MIME, лимит размера (5MB аватар, 10MB вложения)
- SQL injection: ORM + параметризованные запросы

### 7.4 Аудит
- Логирование всех изменений критичных данных
- Сохранение IP и User-Agent
- Хранение истории входов

---

## 8. Carbon Design адаптация

### 8.1 Цветовая палитра (CSS Variables)

```css
:root {
  /* Gray scale (Carbon Gray 100) */
  --color-gray-10: #f4f4f4;
  --color-gray-20: #e0e0e0;
  --color-gray-30: #c6c6c6;
  --color-gray-40: #a8a8a8;
  --color-gray-50: #8d8d8d;
  --color-gray-60: #6f6f6f;
  --color-gray-70: #525252;
  --color-gray-80: #393939;
  --color-gray-90: #262626;
  --color-gray-100: #161616;

  /* Primary (Blue) */
  --color-blue-60: #0f62fe;
  --color-blue-70: #0043ce;

  /* Support colors */
  --color-green-50: #24a148;
  --color-red-60: #da1e28;
  --color-yellow-30: #f1c21b;
  --color-purple-60: #8a3ffc;

  /* Semantic */
  --color-background: #ffffff;
  --color-background-secondary: var(--color-gray-10);
  --color-text-primary: var(--color-gray-100);
  --color-text-secondary: var(--color-gray-70);
  --color-border: var(--color-gray-30);
  --color-interactive: var(--color-blue-60);
}
```

### 8.2 Типографика

```css
:root {
  --font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-family-mono: 'IBM Plex Mono', monospace;

  /* Type scale */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px - Body compact */
  --text-base: 1rem;     /* 16px - Body */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px - Heading 03 */
  --text-2xl: 1.5rem;    /* 24px - Heading 02 */
  --text-3xl: 1.75rem;   /* 28px - Heading 01 */
  --text-4xl: 2rem;      /* 32px - Display */

  /* Line height */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
}
```

### 8.3 Spacing (8px grid)

```css
:root {
  --spacing-1: 0.125rem;  /* 2px */
  --spacing-2: 0.25rem;   /* 4px */
  --spacing-3: 0.5rem;    /* 8px */
  --spacing-4: 0.75rem;   /* 12px */
  --spacing-5: 1rem;      /* 16px */
  --spacing-6: 1.5rem;    /* 24px */
  --spacing-7: 2rem;      /* 32px */
  --spacing-8: 2.5rem;    /* 40px */
  --spacing-9: 3rem;      /* 48px */
}
```

### 8.4 Компоненты shadcn → Carbon mapping

| shadcn | Carbon стиль |
|--------|--------------|
| Button | 48px height, no border-radius (0px или 2px max) |
| Input | 48px height, 1px border, focus: 2px blue border |
| Card | 0px border-radius, subtle shadow |
| Table | Zebra striping, compact rows |
| Dialog | Slide from right, 0px radius |
| Toast | Top-right, minimal styling |

---

## 9. Инфраструктура

### 9.1 Docker Compose (разработка)

```yaml
version: '3.9'

services:
  db:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: fond_intra
      POSTGRES_USER: fond_intra
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    volumes:
      - ./backend:/app
      - media_data:/app/media
    ports:
      - "8000:8000"
    depends_on:
      - db
      - redis
    environment:
      - DATABASE_URL=postgres://fond_intra:${DB_PASSWORD}@db:5432/fond_intra
      - REDIS_URL=redis://redis:6379/0
      - DEBUG=True

  celery:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    command: celery -A config worker -l info
    volumes:
      - ./backend:/app
    depends_on:
      - db
      - redis

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    volumes:
      - ./frontend:/app
      - /app/node_modules
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://localhost:8000/api/v1

volumes:
  postgres_data:
  media_data:
```

### 9.2 Переменные окружения

```bash
# .env.example

# Database
DATABASE_URL=postgres://user:password@localhost:5432/fond_intra
DB_PASSWORD=secure_password

# Redis
REDIS_URL=redis://localhost:6379/0

# Django
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=portal.company.com

# JWT
JWT_ACCESS_TOKEN_LIFETIME=15  # minutes
JWT_REFRESH_TOKEN_LIFETIME=10080  # minutes (7 days)

# Email (для уведомлений)
EMAIL_HOST=smtp.company.com
EMAIL_PORT=587
EMAIL_HOST_USER=portal@company.com
EMAIL_HOST_PASSWORD=email_password
EMAIL_USE_TLS=True

# File uploads
MAX_AVATAR_SIZE=5242880  # 5MB
MAX_ATTACHMENT_SIZE=10485760  # 10MB
ALLOWED_AVATAR_TYPES=image/jpeg,image/png,image/webp
```

---

## 10. Чек-лист реализации

### Фаза 1: Инфраструктура и базовый Backend
- [x] **1.1** Инициализация Git репозитория
- [x] **1.2** Настройка Docker Compose (PostgreSQL, Redis)
- [x] **1.3** Создание Django проекта со структурой apps
- [x] **1.4** Настройка settings (base/dev/prod)
- [x] **1.5** Подключение PostgreSQL
- [x] **1.6** Настройка Django REST Framework
- [x] **1.7** Настройка JWT аутентификации (simplejwt)
- [x] **1.8** Настройка CORS
- [x] **1.9** Настройка Celery + Redis

### Фаза 2: Модели данных
- [x] **2.1** Модель User (кастомная, расширение AbstractUser)
- [x] **2.2** Модель UserStatus
- [x] **2.3** Модели Department, Position
- [x] **2.4** Модели Skill, SkillCategory, UserSkill
- [x] **2.5** Модели Achievement, AchievementAward
- [x] **2.6** Модели News, NewsAttachment, Comment, Reaction
- [x] **2.7** Модели Notification, NotificationSettings
- [x] **2.8** Модели Role, Permission
- [x] **2.9** Модель AuditLog
- [x] **2.10** Создание миграций и начальных данных (fixtures)

### Фаза 3: API Backend
- [x] **3.1** Auth endpoints (login, logout, refresh, password)
- [x] **3.2** Users API (CRUD, me, search, birthdays)
- [x] **3.3** UserStatus API
- [x] **3.4** Organization API (departments, positions, tree)
- [x] **3.5** Skills API
- [x] **3.6** Achievements API (types, awards, feed)
- [x] **3.7** News API (CRUD, attachments)
- [x] **3.8** Comments API
- [x] **3.9** Reactions API
- [x] **3.10** Notifications API
- [x] **3.11** Roles API (RBAC)
- [x] **3.12** Audit API
- [x] **3.13** Permissions middleware
- [x] **3.14** Audit middleware
- [x] **3.15** File upload handling (avatars, attachments)
- [x] **3.16** API documentation (drf-spectacular)

### Фаза 4: Frontend Setup
- [x] **4.1** Инициализация Vite + React + TypeScript
- [x] **4.2** Настройка Tailwind CSS
- [x] **4.3** Установка и настройка shadcn/ui
- [x] **4.4** Настройка Carbon Design tokens (CSS variables)
- [x] **4.5** Кастомизация shadcn компонентов под Carbon
- [x] **4.6** Настройка React Router
- [x] **4.7** Настройка TanStack Query
- [x] **4.8** Настройка Zustand (auth store)
- [x] **4.9** API клиент (Axios instance)
- [x] **4.10** TypeScript типы (ручные)

### Фаза 5: Frontend - Layout и Auth
- [x] **5.1** Layout компоненты (Header, Sidebar, Footer)
- [x] **5.2** Страница логина
- [x] **5.3** Логика аутентификации (JWT handling)
- [x] **5.4** Protected routes
- [x] **5.5** Страница смены пароля
- [x] **5.6** Страница восстановления пароля

### Фаза 6: Frontend - Профиль и сотрудники
- [x] **6.1** Страница своего профиля
- [x] **6.2** Форма редактирования профиля
- [x] **6.3** Загрузка аватара
- [x] **6.4** Список сотрудников с поиском
- [x] **6.5** Карточка профиля коллеги
- [x] **6.6** Календарь дней рождений (на dashboard)
- [x] **6.7** Организационное дерево (визуализация)

### Фаза 7: Frontend - Ачивки
- [x] **7.1** Каталог ачивок
- [x] **7.2** Форма выдачи ачивки
- [x] **7.3** Лента ачивок (feed)
- [x] **7.4** Ачивки на профиле пользователя
- [x] **7.5** Статистика ачивок

### Фаза 8: Frontend - Новости
- [x] **8.1** Лента новостей
- [x] **8.2** Страница отдельной новости
- [x] **8.3** Форма создания/редактирования новости
- [x] **8.4** Загрузка вложений
- [x] **8.5** Комментарии (базовые)
- [x] **8.6** Реакции

### Фаза 9: Frontend - Уведомления
- [x] **9.1** Dropdown уведомлений в header
- [x] **9.2** Страница всех уведомлений
- [x] **9.3** Настройки уведомлений
- [x] **9.4** Polling для real-time (30s interval)

### Фаза 10: Frontend - Админка
- [x] **10.1** Dashboard админки
- [x] **10.2** Управление сотрудниками (CRUD)
- [x] **10.3** Архивация/восстановление сотрудников
- [x] **10.4** Управление отделами
- [x] **10.5** Управление должностями
- [x] **10.6** Конфигуратор ролей
- [x] **10.7** Управление типами ачивок
- [x] **10.8** Журнал аудита

### Фаза 11: Celery Tasks
- [x] **11.1** Task: уведомление о дне рождения
- [x] **11.2** Task: уведомление о новой ачивке
- [x] **11.3** Task: уведомление о новости/комментарии
- [x] **11.4** Task: email уведомления
- [x] **11.5** Periodic task: birthday check (ежедневно)

### Фаза 12: Тестирование
- [x] **12.1** Unit тесты моделей
- [x] **12.2** Unit тесты serializers
- [x] **12.3** Integration тесты API endpoints
- [x] **12.4** Тесты permissions
- [x] **12.5** Frontend: тесты компонентов (Vitest)
- [ ] **12.6** E2E тесты (Playwright) — критические пути

### Фаза 13: Финализация
- [x] **13.1** Адаптивность (mobile testing)
- [x] **13.2** Performance оптимизация (lazy loading, caching)
- [x] **13.3** SEO и accessibility
- [x] **13.4** Production Docker конфигурация
- [x] **13.5** CI/CD pipeline
- [x] **13.6** Документация развёртывания
- [x] **13.7** Создание начального admin пользователя
- [x] **13.8** Seed данные для демо

---

## 11. Приоритеты реализации

### MVP (Minimum Viable Product)
1. Auth (login/logout)
2. Профиль пользователя (просмотр/редактирование)
3. Список сотрудников с поиском
4. Организационная структура (базовая)
5. Базовая админка (CRUD пользователей)
6. Роли (предустановленные)

### Версия 1.0
- Всё из MVP
- Система ачивок
- Новости с комментариями и реакциями
- Календарь дней рождений
- Уведомления
- Аудит
- Конфигуратор ролей

### Версия 1.1+
- Email уведомления
- Расширенная аналитика
- Экспорт данных
- Интеграции (по запросу)
