# FondSmena Intranet

Корпоративный интранет-портал для компании FondSmena.

## Технологический стек

### Backend
- **Django 5.0** + Django REST Framework
- **PostgreSQL** - основная база данных
- **Redis** - кэширование и брокер сообщений
- **Celery** - асинхронные задачи
- **JWT** - аутентификация (Simple JWT)

### Frontend
- **React 18** + TypeScript
- **Vite** - сборка и dev-сервер
- **TanStack Query** - управление серверным состоянием
- **Zustand** - клиентское состояние
- **Tailwind CSS** + shadcn/ui - стилизация
- **React Router** - маршрутизация

## Реализованные модули

### Аутентификация
- JWT-токены (access + refresh)
- Автообновление токенов
- Смена пароля

### Профиль пользователя
- Просмотр и редактирование профиля
- Загрузка/удаление аватара
- Личная информация (телефон, telegram, дата рождения, bio)

### Сотрудники
- Список сотрудников с поиском и фильтрацией
- Карточка сотрудника
- Фильтрация по отделу/должности

### Организационная структура
- Иерархическое дерево отделов
- Раскрывающиеся списки сотрудников отделов
- Отображение руководителей

### Новости
- Лента новостей с пагинацией
- Детальный просмотр новости
- Комментарии к новостям
- Реакции (лайки и др.)

### Достижения
- Типы достижений (категории)
- Выдача достижений сотрудникам
- Лента достижений
- Статистика по достижениям

### Уведомления
- Всплывающие уведомления
- Центр уведомлений
- Настройки уведомлений
- Счетчик непрочитанных

### Дашборд
- Статистика (сотрудники, достижения, новости)
- Ближайшие дни рождения
- Последние новости
- Последние достижения

## Установка и запуск

### Требования
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+
- Redis

### Backend

```bash
cd backend

# Создание виртуального окружения
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или venv\Scripts\activate  # Windows

# Установка зависимостей
pip install -r requirements.txt

# Переменные окружения
export DATABASE_URL="postgres://user:password@localhost:5432/fond_intra"
export REDIS_URL="redis://localhost:6379/0"
export SECRET_KEY="your-secret-key"
export DEBUG=True

# Миграции
python manage.py migrate

# Создание суперпользователя
python manage.py createsuperuser

# Запуск сервера
python manage.py runserver
```

### Frontend

```bash
cd frontend

# Установка зависимостей
npm install

# Запуск dev-сервера
npm run dev

# Сборка для production
npm run build
```

## Структура проекта

```
fond-intra/
├── backend/
│   ├── apps/
│   │   ├── accounts/      # Пользователи, аутентификация
│   │   ├── achievements/  # Достижения
│   │   ├── audit/         # Аудит действий
│   │   ├── news/          # Новости, комментарии
│   │   ├── notifications/ # Уведомления
│   │   ├── organization/  # Отделы, должности
│   │   ├── roles/         # Роли и права
│   │   └── skills/        # Навыки
│   ├── config/            # Настройки Django
│   └── core/              # Общие утилиты
├── frontend/
│   └── src/
│       ├── api/           # API клиент и endpoints
│       ├── components/    # React компоненты
│       ├── pages/         # Страницы приложения
│       ├── store/         # Zustand store
│       └── types/         # TypeScript типы
└── docker/                # Docker конфигурация
```

## API Документация

После запуска backend доступна по адресам:
- Swagger UI: http://localhost:8000/api/docs/
- ReDoc: http://localhost:8000/api/redoc/

## Лицензия

Proprietary - FondSmena
