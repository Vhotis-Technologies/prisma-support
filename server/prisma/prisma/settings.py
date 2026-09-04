"""
Django settings for prisma project (support server).

Uses the same Redis/Celery pattern as client and detailer: prisma_redis in production,
client_staging_redis in staging (shared across all staging stacks). Override via env.
"""

from pathlib import Path
from datetime import timedelta
from urllib.parse import quote_plus, urlparse
import sys
import os
import json
import dj_database_url
from google.oauth2 import service_account

from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent

# production | staging — not the same as DEBUG (staging can use DEBUG=False for prod-like behavior).
PRISMA_ENV = os.getenv('PRISMA_ENV', 'production').strip().lower()
IS_STAGING = PRISMA_ENV == 'staging'

# Docker image build runs collectstatic without secrets/env files — skip GCS for that step.
_IS_COLLECTSTATIC = any(
    arg == 'collectstatic' or arg.endswith('/collectstatic') for arg in sys.argv
)

SECRET_KEY = os.getenv('DJANGO_SECRET_KEY')
DEBUG = os.getenv('DEBUG') == 'True'

_allowed_hosts_env = os.getenv('ALLOWED_HOSTS')
if _allowed_hosts_env:
    ALLOWED_HOSTS = [h.strip() for h in _allowed_hosts_env.split(',') if h.strip()]
else:
    ALLOWED_HOSTS = ['*']
if IS_STAGING and '*' not in ALLOWED_HOSTS:
    for suffix in ('.ngrok-free.app', '.ngrok.io', '.ngrok.app'):
        if suffix not in ALLOWED_HOSTS:
            ALLOWED_HOSTS.append(suffix)

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
    'whitenoise.middleware.WhiteNoiseMiddleware',
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
ASGI_APPLICATION = 'prisma.asgi.application'

# DATABASE_URL or POSTGRES_* required (Postgres only).


def _resolve_database_url():
    """Build Postgres URL from ``DATABASE_URL`` or ``POSTGRES_*`` env vars; empty if unset."""
    explicit = os.getenv('DATABASE_URL', '').strip()
    if explicit:
        return explicit
    user = os.getenv('POSTGRES_USER')
    password = os.getenv('POSTGRES_PASSWORD')
    host = os.getenv('POSTGRES_HOST')
    port = os.getenv('POSTGRES_PORT', '5432')
    db = os.getenv('POSTGRES_DB')
    if user and password and host and db:
        url = (
            f'postgresql://{quote_plus(user)}:{quote_plus(password)}'
            f'@{host}:{port}/{db}'
        )
        sslmode = os.getenv('POSTGRES_SSLMODE', '').strip()
        if sslmode:
            sep = '&' if '?' in url else '?'
            url = f'{url}{sep}sslmode={quote_plus(sslmode)}'
        return url
    return ''


_database_url = _resolve_database_url()
if not _database_url:
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


# Media storage. collectstatic only needs staticfiles — never load GCS secrets during image build.

def _load_gcs_credentials(raw: str):
    """Accept a JSON blob or a path to a service-account file (resolve relative to BASE_DIR)."""
    value = raw.strip()
    if value.startswith('{'):
        return service_account.Credentials.from_service_account_info(
            json.loads(value),
            scopes=['https://www.googleapis.com/auth/cloud-platform'],
        )
    path = Path(value)
    if not path.is_file():
        path = BASE_DIR / value
    if not path.is_file():
        raise ImproperlyConfigured(f'GCS credentials file not found: {value}')
    return service_account.Credentials.from_service_account_file(
        str(path),
        scopes=['https://www.googleapis.com/auth/cloud-platform'],
    )



_STATICFILES_STORAGE = {
    'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage',
}

if _IS_COLLECTSTATIC:
    STORAGES = {
        'default': {
            'BACKEND': 'django.core.files.storage.FileSystemStorage',
        },
        'staticfiles': _STATICFILES_STORAGE,
    }
elif IS_STAGING:
    _raw_staging_creds = (
        os.getenv('GS_CREDENTIALS_STAGING_JSON')
        or os.getenv('GS_CREDENTIALS_PATH_STAGING')
        or ''
    ).strip()
    if not _raw_staging_creds:
        raise ImproperlyConfigured(
            'Set GS_CREDENTIALS_STAGING_JSON (JSON blob) or GS_CREDENTIALS_PATH_STAGING (file path).'
        )
    GS_CREDENTIALS_STAGING = _load_gcs_credentials(_raw_staging_creds)
    GS_BUCKET_NAME_STAGING = os.getenv('GS_BUCKET_NAME_STAGING', 'prisma_staging_bucket')
    GS_LOCATION_STAGING = os.getenv('GS_LOCATION_STAGING', 'detailer-app')
    STORAGES = {
        'default': {
            'BACKEND': 'storages.backends.gcloud.GoogleCloudStorage',
            'OPTIONS': {
                'bucket_name': GS_BUCKET_NAME_STAGING,
                'location': GS_LOCATION_STAGING,
                'credentials': GS_CREDENTIALS_STAGING,
                'default_acl': None,
            },
        },
        'staticfiles': _STATICFILES_STORAGE,
    }
else:
    _raw_prod_creds = (os.getenv('GS_CREDENTIALS_PATH') or '').strip()
    if not _raw_prod_creds:
        raise ImproperlyConfigured(
            'Set GS_CREDENTIALS_PATH to a JSON blob or path to the service-account file.'
        )
    GS_CREDENTIALS = _load_gcs_credentials(_raw_prod_creds)
    GS_CREDENTIALS_PATH = _raw_prod_creds
    GS_BUCKET_NAME = os.getenv('GS_BUCKET_NAME', 'prisma-valet-bucket')
    GS_LOCATION = os.getenv('GS_LOCATION', 'detailer-app')
    MEDIA_URL = f'https://storage.googleapis.com/{GS_BUCKET_NAME}/{GS_LOCATION}/'
    MEDIA_ROOT = BASE_DIR / 'media'
    STORAGES = {
        'default': {
            'BACKEND': 'storages.backends.gcloud.GoogleCloudStorage',
            'OPTIONS': {
                'bucket_name': GS_BUCKET_NAME,
                'location': GS_LOCATION,
                'credentials': GS_CREDENTIALS,
                'default_acl': None,
            },
        },
        'staticfiles': _STATICFILES_STORAGE,
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
_redis_cache_db = int(os.getenv('REDIS_CACHE_DB', '2'))
_redis_channel_db = int(os.getenv('REDIS_CHANNEL_DB', '9'))

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': os.getenv(
            'REDIS_URL',
            f'redis://{REDIS_HOST}:{REDIS_PORT}/{_redis_cache_db}',
        ),
    },
}
RATELIMIT_USE_CACHE = 'default'

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [
                {
                    "address": f"redis://{REDIS_HOST}:{REDIS_PORT}/{_redis_channel_db}",
                    # Avoid idle socket read timeouts that drop websocket consumers.
                    "socket_timeout": None,
                    "socket_connect_timeout": 10,
                    "retry_on_timeout": True,
                },
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

# Static files configuration
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]

# Whitenoise configuration
WHITENOISE_USE_FINDERS = DEBUG

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


def _origin_only(value: str) -> str:
    parsed = urlparse(value.strip())
    if parsed.scheme and parsed.netloc:
        return f"{parsed.scheme}://{parsed.netloc}"
    return value.strip().rstrip("/")


def _split_origins(raw: str | None, fallback: list[str]) -> list[str]:
    sources = raw.split(",") if raw and raw.strip() else fallback
    seen: set[str] = set()
    out: list[str] = []
    for origin in sources:
        value = _origin_only(origin) if isinstance(origin, str) else ""
        if value and value not in seen:
            seen.add(value)
            out.append(value)
    return out


def _append_unique(dest: list[str], values: list[str]) -> None:
    for value in values:
        if value and value not in dest:
            dest.append(value)


_STAGING_NGROK_CSRF_ORIGINS = [
    "https://*.ngrok-free.app",
    "https://*.ngrok.io",
    "https://*.ngrok.app",
]
_STAGING_NGROK_CORS_REGEXES = [
    r"^https://[\w-]+\.ngrok-free\.app$",
    r"^https://[\w-]+\.ngrok\.io$",
    r"^https://[\w-]+\.ngrok\.app$",
]


def _strip_url(*values: str | None) -> str:
    for value in values:
        stripped = (value or "").strip().rstrip("/")
        if stripped:
            return stripped
    return ""


def _public_project_url(env_value: str | None) -> str:
    """Prefer an explicit public origin URL; ignore Docker hostnames. No path suffixes."""
    from urllib.parse import urlparse

    raw = (env_value or "").strip() or None
    if raw:
        host = (urlparse(raw).hostname or "")
        if host.endswith("_staging_server"):
            raw = None
    if raw:
        return raw.rstrip("/")
    return ""


_DEFAULT_SUPPORT = "https://staging.support.prismavalet.com" if IS_STAGING else "https://support.prismavalet.com"
_DEFAULT_DESK = "https://staging.desk.prismavalet.com" if IS_STAGING else "https://desk.prismavalet.com"
_DEFAULT_CLIENT = "https://staging.client.prismavalet.com" if IS_STAGING else "https://client.prismavalet.com"
_DEFAULT_CREW = "https://staging.crew.prismavalet.com" if IS_STAGING else "https://crew.prismavalet.com"

BASE_URL = _strip_url(
    os.getenv("BASE_URL"),
    os.getenv("SUPPORT_API_URL"),
    os.getenv("SUPPORT_APP_URL"),
) or _DEFAULT_SUPPORT
SUPPORT_API_URL = BASE_URL
SUPPORT_WEB_BASE_URL = _strip_url(
    os.getenv("SUPPORT_WEB_URL"),
    os.getenv("SUPPORT_WEB_BASE_URL"),
) or _DEFAULT_DESK
CLIENT_API_URL = _public_project_url(
    os.getenv("CLIENT_API_URL") or os.getenv("CLIENT_APP_URL"),
) or _DEFAULT_CLIENT
DETAILER_API_URL = _public_project_url(
    os.getenv("DETAILER_API_URL") or os.getenv("DETAILER_APP_URL"),
) or _DEFAULT_CREW

CORS_ALLOWED_ORIGINS = _split_origins(
    os.getenv("CORS_ALLOWED_ORIGINS"),
    [
        _origin_only(BASE_URL),
        _origin_only(SUPPORT_WEB_BASE_URL),
        _origin_only(CLIENT_API_URL),
        _origin_only(DETAILER_API_URL),
        "https://prismavalet.com",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:8082",
        "http://127.0.0.1:8082",
        "http://localhost:8382",
        "http://127.0.0.1:8382",
    ],
)
if SUPPORT_WEB_BASE_URL:
    _web_origin = _origin_only(SUPPORT_WEB_BASE_URL)
    if _web_origin and _web_origin not in CORS_ALLOWED_ORIGINS:
        CORS_ALLOWED_ORIGINS.append(_web_origin)
CSRF_TRUSTED_ORIGINS = _split_origins(
    os.getenv("CSRF_TRUSTED_ORIGINS"),
    CORS_ALLOWED_ORIGINS,
)
_append_unique(
    CSRF_TRUSTED_ORIGINS,
    [
        _origin_only(BASE_URL),
        _origin_only(CLIENT_API_URL),
        _origin_only(DETAILER_API_URL),
        _origin_only(SUPPORT_WEB_BASE_URL) if SUPPORT_WEB_BASE_URL else "",
    ],
)
if IS_STAGING:
    _append_unique(CSRF_TRUSTED_ORIGINS, _STAGING_NGROK_CSRF_ORIGINS)
    CORS_ALLOWED_ORIGIN_REGEXES = list(_STAGING_NGROK_CORS_REGEXES)

# Must match client SUPPORT_INTERNAL_API_KEY for proxy calls to client support dashboard.
SUPPORT_INTERNAL_API_KEY = (os.getenv("SUPPORT_INTERNAL_API_KEY") or "").strip()
