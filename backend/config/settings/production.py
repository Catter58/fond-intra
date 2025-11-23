"""
Production settings for fond_intra project.
"""
import dj_database_url
from .base import *  # noqa

DEBUG = False

# Database - PostgreSQL
DATABASES = {
    'default': dj_database_url.config(
        conn_max_age=600,
        conn_health_checks=True,
    )
}

# Security settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# HTTPS settings
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Trusted origins for CSRF
CSRF_TRUSTED_ORIGINS = [
    os.environ.get('FRONTEND_URL', 'https://portal.example.com'),  # noqa: F405
]

# Only JSON renderer in production
REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] = [  # noqa: F405
    'rest_framework.renderers.JSONRenderer',
]

# Static files
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.ManifestStaticFilesStorage'

# Logging - more verbose in production
LOGGING['handlers']['file'] = {  # noqa: F405
    'class': 'logging.FileHandler',
    'filename': '/var/log/fond_intra/django.log',
    'formatter': 'verbose',
}
LOGGING['root']['handlers'] = ['console', 'file']  # noqa: F405
