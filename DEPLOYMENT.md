# Руководство по развёртыванию Fond Intra

## Содержание

1. [Требования](#требования)
2. [Быстрый старт (разработка)](#быстрый-старт-разработка)
3. [Production развёртывание](#production-развёртывание)
4. [Конфигурация](#конфигурация)
5. [SSL сертификаты](#ssl-сертификаты)
6. [Мониторинг и логи](#мониторинг-и-логи)
7. [Резервное копирование](#резервное-копирование)
8. [Обновление](#обновление)
9. [Устранение неполадок](#устранение-неполадок)

---

## Требования

### Системные требования

| Компонент | Минимум | Рекомендуется |
|-----------|---------|---------------|
| CPU | 2 cores | 4 cores |
| RAM | 4 GB | 8 GB |
| Диск | 20 GB SSD | 50 GB SSD |
| ОС | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |

### Программные требования

- Docker 24.0+
- Docker Compose 2.20+
- Git

### Установка Docker (Ubuntu)

```bash
# Обновление пакетов
sudo apt update && sudo apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com | sudo sh

# Добавление пользователя в группу docker
sudo usermod -aG docker $USER

# Установка Docker Compose
sudo apt install docker-compose-plugin -y

# Проверка
docker --version
docker compose version
```

---

## Быстрый старт (разработка)

### 1. Клонирование репозитория

```bash
git clone https://github.com/your-org/fond-intra.git
cd fond-intra
```

### 2. Настройка окружения

```bash
cp .env.example .env
# Отредактируйте .env файл
nano .env
```

### 3. Запуск в режиме разработки

```bash
# Запуск backend (PostgreSQL, Redis, Django)
cd backend
docker compose up -d

# Запуск frontend (Vite dev server)
cd ../frontend
npm install
npm run dev
```

### 4. Создание начальных данных

```bash
# В директории backend
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py seed_data
```

### 5. Доступ к приложению

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api/v1/
- Django Admin: http://localhost:8000/admin/
- API Docs: http://localhost:8000/api/schema/swagger-ui/

**Demo аккаунты:**
- Admin: `admin@company.local` / `admin123`
- Пользователи: `*@company.local` / `password123`

---

## Production развёртывание

### 1. Подготовка сервера

```bash
# Создание директории
sudo mkdir -p /opt/fond-intra
cd /opt/fond-intra

# Клонирование репозитория
git clone https://github.com/your-org/fond-intra.git .
```

### 2. Настройка окружения

```bash
# Создание .env файла
cat > .env << 'EOF'
# PostgreSQL
POSTGRES_DB=fond_intra
POSTGRES_USER=fond_intra
POSTGRES_PASSWORD=YOUR_SECURE_DB_PASSWORD

# Django
SECRET_KEY=YOUR_LONG_RANDOM_SECRET_KEY
DEBUG=False
ALLOWED_HOSTS=portal.company.com,www.portal.company.com

# Email
EMAIL_HOST=smtp.company.com
EMAIL_PORT=587
EMAIL_HOST_USER=portal@company.com
EMAIL_HOST_PASSWORD=YOUR_EMAIL_PASSWORD
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=portal@company.com
EOF

chmod 600 .env
```

### 3. SSL сертификаты

```bash
# Создание самоподписанного сертификата (для тестирования)
cd nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout key.pem \
  -out cert.pem \
  -subj "/C=RU/ST=Moscow/L=Moscow/O=Company/CN=portal.company.com"

# Для production используйте Let's Encrypt (см. раздел SSL)
```

### 4. Сборка frontend

```bash
cd frontend
npm ci
npm run build
cd ..
```

### 5. Запуск production стека

```bash
docker compose -f docker-compose.prod.yml up -d
```

### 6. Инициализация базы данных

```bash
# Применение миграций
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate

# Сбор статических файлов
docker compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput

# Создание суперпользователя
docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser

# (Опционально) Загрузка демо-данных
docker compose -f docker-compose.prod.yml exec backend python manage.py seed_data
```

### 7. Проверка

```bash
# Статус контейнеров
docker compose -f docker-compose.prod.yml ps

# Логи
docker compose -f docker-compose.prod.yml logs -f
```

---

## Конфигурация

### Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `POSTGRES_DB` | Имя базы данных | `fond_intra` |
| `POSTGRES_USER` | Пользователь БД | `fond_intra` |
| `POSTGRES_PASSWORD` | Пароль БД | (обязательно) |
| `SECRET_KEY` | Django secret key | (обязательно) |
| `DEBUG` | Режим отладки | `False` |
| `ALLOWED_HOSTS` | Разрешённые хосты | `localhost` |
| `EMAIL_HOST` | SMTP сервер | `localhost` |
| `EMAIL_PORT` | SMTP порт | `587` |
| `JWT_ACCESS_TOKEN_LIFETIME` | Время жизни access token (мин) | `15` |
| `JWT_REFRESH_TOKEN_LIFETIME` | Время жизни refresh token (мин) | `10080` |

### Генерация SECRET_KEY

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
```

---

## SSL сертификаты

### Let's Encrypt (рекомендуется)

```bash
# Установка certbot
sudo apt install certbot -y

# Получение сертификата
sudo certbot certonly --webroot -w /var/www/certbot \
  -d portal.company.com \
  -d www.portal.company.com

# Обновление nginx конфига
# В nginx/conf.d/default.conf измените:
ssl_certificate /etc/letsencrypt/live/portal.company.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/portal.company.com/privkey.pem;

# Автоматическое обновление (добавьте в crontab)
0 12 * * * /usr/bin/certbot renew --quiet && docker compose -f /opt/fond-intra/docker-compose.prod.yml restart nginx
```

---

## Мониторинг и логи

### Просмотр логов

```bash
# Все сервисы
docker compose -f docker-compose.prod.yml logs -f

# Конкретный сервис
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f nginx
docker compose -f docker-compose.prod.yml logs -f celery
```

### Мониторинг ресурсов

```bash
# Использование ресурсов
docker stats

# Состояние контейнеров
docker compose -f docker-compose.prod.yml ps
```

### Health checks

```bash
# Backend
curl -s http://localhost:8000/api/v1/health/

# Database
docker compose -f docker-compose.prod.yml exec db pg_isready

# Redis
docker compose -f docker-compose.prod.yml exec redis redis-cli ping
```

---

## Резервное копирование

### Backup базы данных

```bash
#!/bin/bash
# backup-db.sh

BACKUP_DIR=/opt/backups/fond-intra
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

docker compose -f /opt/fond-intra/docker-compose.prod.yml exec -T db \
  pg_dump -U fond_intra fond_intra | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Удаление старых бэкапов (старше 30 дней)
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +30 -delete
```

### Backup медиа-файлов

```bash
#!/bin/bash
# backup-media.sh

BACKUP_DIR=/opt/backups/fond-intra
DATE=$(date +%Y%m%d_%H%M%S)

tar -czf $BACKUP_DIR/media_$DATE.tar.gz \
  -C /var/lib/docker/volumes/fond-intra_media_data/_data .
```

### Автоматизация (crontab)

```bash
# Ежедневный бэкап в 3:00
0 3 * * * /opt/fond-intra/scripts/backup-db.sh
0 4 * * * /opt/fond-intra/scripts/backup-media.sh
```

### Восстановление

```bash
# Восстановление БД
gunzip -c backup.sql.gz | docker compose -f docker-compose.prod.yml exec -T db \
  psql -U fond_intra fond_intra
```

---

## Обновление

### Стандартное обновление

```bash
cd /opt/fond-intra

# Остановка сервисов
docker compose -f docker-compose.prod.yml down

# Получение обновлений
git pull origin main

# Обновление frontend
cd frontend
npm ci
npm run build
cd ..

# Пересборка и запуск
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# Миграции
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate
docker compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
```

### Обновление без простоя (blue-green)

Для критичных систем рекомендуется настроить blue-green deployment с использованием нескольких серверов и load balancer.

---

## Устранение неполадок

### Контейнер не запускается

```bash
# Проверка логов
docker compose -f docker-compose.prod.yml logs backend

# Проверка конфигурации
docker compose -f docker-compose.prod.yml config
```

### Ошибки подключения к БД

```bash
# Проверка состояния PostgreSQL
docker compose -f docker-compose.prod.yml exec db pg_isready

# Проверка переменных окружения
docker compose -f docker-compose.prod.yml exec backend env | grep DATABASE
```

### Ошибки миграций

```bash
# Сброс миграций (ОСТОРОЖНО!)
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate --fake

# Создание миграций заново
docker compose -f docker-compose.prod.yml exec backend python manage.py makemigrations
```

### Очистка Docker

```bash
# Удаление неиспользуемых образов
docker image prune -a

# Полная очистка (ОСТОРОЖНО!)
docker system prune -a --volumes
```

### Контакты поддержки

При возникновении проблем обращайтесь:
- Email: support@company.com
- Slack: #fond-intra-support
