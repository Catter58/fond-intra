"""
Development settings for fond_intra project.
"""
import dj_database_url
from .base import *  # noqa

DEBUG = True

# Database - PostgreSQL via DATABASE_URL or fallback to local
DATABASES = {
    'default': dj_database_url.config(
        default='postgres://fond_intra:devpassword@localhost:5432/fond_intra',
        conn_max_age=600,
    )
}

# Allow all hosts in development
ALLOWED_HOSTS = ['*']

# CORS - allow all in development
CORS_ALLOW_ALL_ORIGINS = True

# Add browsable API renderer for development
REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] = [  # noqa: F405
    'rest_framework.renderers.JSONRenderer',
    'rest_framework.renderers.BrowsableAPIRenderer',
]

# Email - use console backend in development
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Disable password validation in development for easier testing
AUTH_PASSWORD_VALIDATORS = []

# Debug toolbar (optional)
try:
    import debug_toolbar  # noqa
    INSTALLED_APPS += ['debug_toolbar']  # noqa: F405
    MIDDLEWARE.insert(0, 'debug_toolbar.middleware.DebugToolbarMiddleware')  # noqa: F405
    INTERNAL_IPS = ['127.0.0.1', 'localhost']
except ImportError:
    pass
