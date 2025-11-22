"""
Test settings for CI/CD and local testing.
"""
from .base import *  # noqa: F401, F403

# Debug disabled for testing
DEBUG = False

# Use in-memory SQLite for faster tests (or PostgreSQL from env)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('POSTGRES_DB', 'test_db'),
        'USER': os.environ.get('POSTGRES_USER', 'test'),
        'PASSWORD': os.environ.get('POSTGRES_PASSWORD', 'test'),
        'HOST': os.environ.get('POSTGRES_HOST', 'localhost'),
        'PORT': os.environ.get('POSTGRES_PORT', '5432'),
    }
}

# Use database URL if provided
import dj_database_url

DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL:
    DATABASES['default'] = dj_database_url.parse(DATABASE_URL)

# Faster password hashing for tests
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# Disable migrations for faster tests
class DisableMigrations:
    def __contains__(self, item):
        return True

    def __getitem__(self, item):
        return None


# MIGRATION_MODULES = DisableMigrations()

# Use sync task execution for testing
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# Use console email backend for testing
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Disable logging during tests
LOGGING = {
    'version': 1,
    'disable_existing_loggers': True,
    'handlers': {
        'null': {
            'class': 'logging.NullHandler',
        },
    },
    'root': {
        'handlers': ['null'],
        'level': 'CRITICAL',
    },
}

# Static files
STATIC_ROOT = BASE_DIR / 'test_staticfiles'

# Media files
MEDIA_ROOT = BASE_DIR / 'test_media'

# Allowed hosts for testing
ALLOWED_HOSTS = ['*']

# CORS for testing
CORS_ALLOW_ALL_ORIGINS = True
