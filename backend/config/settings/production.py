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

# HTTPS settings - configurable via environment
SECURE_SSL_REDIRECT = os.environ.get('SECURE_SSL_REDIRECT', 'false').lower() in ('true', '1', 'yes')  # noqa: F405
SESSION_COOKIE_SECURE = os.environ.get('SESSION_COOKIE_SECURE', 'false').lower() in ('true', '1', 'yes')  # noqa: F405
CSRF_COOKIE_SECURE = os.environ.get('CSRF_COOKIE_SECURE', 'false').lower() in ('true', '1', 'yes')  # noqa: F405

# Trusted origins for CSRF
_frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost')  # noqa: F405
CSRF_TRUSTED_ORIGINS = [_frontend_url]

# Add allowed hosts as trusted origins
for host in ALLOWED_HOSTS:  # noqa: F405
    if host and host != '*':
        CSRF_TRUSTED_ORIGINS.append(f'http://{host}')
        CSRF_TRUSTED_ORIGINS.append(f'https://{host}')

# For wildcard ALLOWED_HOSTS, disable CSRF origin check (use with caution in production)
# This is needed when accessing via IP address without a domain
if '*' in ALLOWED_HOSTS:  # noqa: F405
    CSRF_TRUSTED_ORIGINS = []
    # Allow all origins for CSRF when ALLOWED_HOSTS is wildcard
    CSRF_COOKIE_SECURE = False
    CSRF_USE_SESSIONS = False

# Only JSON renderer in production
REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] = [  # noqa: F405
    'rest_framework.renderers.JSONRenderer',
]

# Static files
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.ManifestStaticFilesStorage'

# Logging - console only in Docker container
LOGGING['root']['handlers'] = ['console']  # noqa: F405
