"""
Django settings for prisma project (support server).

Uses the same Redis/Celery pattern as client and detailer: prisma_redis in production,
client_staging_redis in staging (shared across all staging stacks). Override via env.
"""

from pathlib import Path
from datetime import timedelta
from urllib.parse import quote_plus
import os

import dj_database_url
from google.oauth2 import service_account


BASE_DIR = Path(__file__).resolve().parent.parent

# production | staging — not the same as DEBUG (staging can use DEBUG=False for prod-like behavior).
PRISMA_ENV = os.getenv('PRISMA_ENV', 'production').strip().lower()
IS_STAGING = PRISMA_ENV == 'staging'

SECRET_KEY = os.getenv('DJANGO_SECRET_KEY')
DEBUG = os.getenv('DEBUG') == 'True'

_allowed_hosts_env = os.getenv('ALLOWED_HOSTS')
if _allowed_hosts_env:
    ALLOWED_HOSTS = [h.strip() for h in _allowed_hosts_env.split(',') if h.strip()]
else:
    ALLOWED_HOSTS = ['*']

CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://c620-2a02-8084-c80-ea80-3d81-12aa-43f9-717.ngrok-free.app',
    'https://support.prismavalet.com',
]
ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://c620-2a02-8084-c80-ea80-3d81-12aa-43f9-717.ngrok-free.app',
    'https://support.prismavalet.com',
]
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://c620-2a02-8084-c80-ea80-3d81-12aa-43f9-717.ngrok-free.app',
    'https://support.prismavalet.com',
]
CORS_ALLOW_CREDENTIALS = True

USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

INSTALLED_APPS = [
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'channels',
    'channels_redis',
    'django_celery_beat',
    'storages',
    'main',
]

AUTH_USER_MODEL = 'main.User'

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'prisma.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'prisma.wsgi.application'

# DATABASE_URL or POSTGRES_* required (Postgres only).


def _resolve_database_url():
    explicit = os.getenv('DATABASE_URL', '').strip()
    if explicit:
        return explicit
    user = os.getenv('POSTGRES_USER')
    password = os.getenv('POSTGRES_PASSWORD')
    host = os.getenv('POSTGRES_HOST')
    port = os.getenv('POSTGRES_PORT', '5432')
    db = os.getenv('POSTGRES_DB')
    if user and password and host and db:
        return (
            f'postgresql://{quote_plus(user)}:{quote_plus(password)}'
            f'@{host}:{port}/{db}'
        )
    return ''


_database_url = _resolve_database_url()
if not _database_url:
    from django.core.exceptions import ImproperlyConfigured
    raise ImproperlyConfigured(
        'Set DATABASE_URL or POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST, and POSTGRES_DB '
        f'(PRISMA_ENV={PRISMA_ENV!r}).'
    )
DATABASES = {
    'default': dj_database_url.config(
        default=_database_url,
        conn_max_age=int(os.getenv('DATABASE_CONN_MAX_AGE', '600')),
    ),
}

# Staging: local media. Production: Google Cloud Storage.
if IS_STAGING:
    MEDIA_URL = '/media/'
    MEDIA_ROOT = BASE_DIR / 'media'
    STORAGES = {
        'default': {
            'BACKEND': 'django.core.files.storage.FileSystemStorage',
        },
        'staticfiles': {
            'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage',
        },
    }
else:
    GS_BUCKET_NAME = os.getenv('GS_BUCKET_NAME', 'prisma-valet-bucket')
    GS_LOCATION = os.getenv('GS_LOCATION', 'support-app')
    GS_CREDENTIALS_PATH = os.getenv('GS_CREDENTIALS_PATH', '')
    GS_CREDENTIALS = None
    if GS_CREDENTIALS_PATH and Path(GS_CREDENTIALS_PATH).is_file():
        GS_CREDENTIALS = service_account.Credentials.from_service_account_file(
            GS_CREDENTIALS_PATH,
            scopes=['https://www.googleapis.com/auth/cloud-platform'],
        )
    MEDIA_URL = f'https://storage.googleapis.com/{GS_BUCKET_NAME}/'
    MEDIA_ROOT = BASE_DIR / 'media'
    STORAGES = {
        'default': {
            'BACKEND': 'storages.backends.gcloud.GoogleCloudStorage',
        },
        'staticfiles': {
            'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage',
        },
    }

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Europe/London'
USE_I18N = True
USE_TZ = True

_DEFAULT_REDIS_HOST = 'client_staging_redis' if IS_STAGING else 'prisma_redis'
REDIS_HOST = os.getenv('REDIS_HOST', _DEFAULT_REDIS_HOST)
REDIS_PORT = int(os.getenv('REDIS_PORT', '6379'))

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [
                f'redis://{REDIS_HOST}:{REDIS_PORT}',
            ],
        },
    },
}

CELERY_BROKER_URL = os.getenv(
    'CELERY_BROKER_URL',
    f'redis://{REDIS_HOST}:{REDIS_PORT}/0',
)
CELERY_RESULT_BACKEND = os.getenv(
    'CELERY_RESULT_BACKEND',
    f'redis://{REDIS_HOST}:{REDIS_PORT}/1',
)
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE
CELERY_DEFAULT_QUEUE = 'support_queue'
CELERY_TASK_DEFAULT_QUEUE = 'support_queue'

ASGI_APPLICATION = 'prisma.asgi.application'

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# DRF — browsable API only when staging and DEBUG (same as client/detailer).
_rest_renderers = ['rest_framework.renderers.JSONRenderer']
if IS_STAGING and DEBUG:
    _rest_renderers.append('rest_framework.renderers.BrowsableAPIRenderer')
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_RENDERER_CLASSES': tuple(_rest_renderers),
    'DEFAULT_PARSER_CLASSES': (
        'rest_framework.parsers.MultiPartParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.JSONParser',
    ),
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=5),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=120),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": False,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "VERIFYING_KEY": "",
    "AUDIENCE": None,
    "ISSUER": None,
    "JSON_ENCODER": None,
    "JWK_URL": None,
    "LEEWAY": 0,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_HEADER_NAME": "HTTP_AUTHORIZATION",
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
    "USER_AUTHENTICATION_RULE": "rest_framework_simplejwt.authentication.default_user_authentication_rule",
    "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
    "TOKEN_TYPE_CLAIM": "token_type",
    "TOKEN_USER_CLASS": "rest_framework_simplejwt.models.TokenUser",
    "JTI_CLAIM": "jti",
    "SLIDING_TOKEN_REFRESH_EXP_CLAIM": "refresh_exp",
    "SLIDING_TOKEN_LIFETIME": timedelta(minutes=60),
    "SLIDING_TOKEN_REFRESH_LIFETIME": timedelta(days=1),
    "TOKEN_OBTAIN_SERIALIZER": "rest_framework_simplejwt.serializers.TokenObtainPairSerializer",
    "TOKEN_REFRESH_SERIALIZER": "rest_framework_simplejwt.serializers.TokenRefreshSerializer",
    "TOKEN_VERIFY_SERIALIZER": "rest_framework_simplejwt.serializers.TokenVerifySerializer",
    "TOKEN_BLACKLIST_SERIALIZER": "rest_framework_simplejwt.serializers.TokenBlacklistSerializer",
    "SLIDING_TOKEN_OBTAIN_SERIALIZER": "rest_framework_simplejwt.serializers.TokenObtainSlidingSerializer",
    "SLIDING_TOKEN_REFRESH_SERIALIZER": "rest_framework_simplejwt.serializers.TokenRefreshSlidingSerializer",
}

if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
else:
    _cors = os.getenv('CORS_ALLOWED_ORIGINS', '')
    CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors.split(',') if o.strip()]


SUPPORT_API_URL = os.getenv('SUPPORT_API_URL', 'https://c620-2a02-8084-c80-ea80-3d81-12aa-43f9-717.ngrok-free.app/support')
# Optional fallback for password-reset email links if SUPPORT_API_URL is unset in an environment.
BASE_URL = os.getenv('BASE_URL', '').strip()
DETAILER_API_URL = os.getenv('DETAILER_API_URL', 'https://c620-2a02-8084-c80-ea80-3d81-12aa-43f9-717.ngrok-free.app/detailer')
_default_client_api = 'https://c620-2a02-8084-c80-ea80-3d81-12aa-43f9-717.ngrok-free.app/client'
CLIENT_API_URL = os.getenv('CLIENT_API_URL', _default_client_api or 'https://c620-2a02-8084-c80-ea80-3d81-12aa-43f9-717.ngrok-free.app/client').strip()

# Must match client SUPPORT_INTERNAL_API_KEY for proxy calls to client support dashboard.
SUPPORT_INTERNAL_API_KEY = (os.getenv('SUPPORT_INTERNAL_API_KEY') or '').strip()
