"""
Django settings for the portfolio project.

This is the central configuration file for the Django backend. It controls
database connections, installed apps, middleware, authentication, CORS,
and REST framework behavior.

Environment Variables:
    DJANGO_SECRET_KEY   - Secret key for cryptographic signing (required in production)
    DJANGO_DEBUG        - Enable/disable debug mode ('True'/'False')
    DJANGO_ALLOWED_HOSTS - Comma-separated list of allowed hostnames
    DB_NAME             - PostgreSQL database name (default: 'portfolio_db')
    DB_USER             - PostgreSQL user (default: 'Wayfarer')
    DB_PASSWORD         - PostgreSQL password (default: '' for local trust auth)
    DB_HOST             - PostgreSQL host (default: 'localhost')
    DB_PORT             - PostgreSQL port (default: '5432')
"""

import os
from datetime import timedelta
from pathlib import Path

# Base directory of the Django project (portfolio_backend/)
BASE_DIR = Path(__file__).resolve().parent.parent

# --- Security ---
# In production, set DJANGO_SECRET_KEY to a unique, unpredictable value
SECRET_KEY = os.environ.get(
    'DJANGO_SECRET_KEY',
    'django-insecure-s1pfq^%4g@b0yv%9=cfhr*3&h&90)pyti2vxm+6&u$y8_ca3fo',
)

DEBUG = os.environ.get('DJANGO_DEBUG', 'True').lower() == 'true'

ALLOWED_HOSTS = os.environ.get('DJANGO_ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# --- Installed Apps ---
# Apps are loaded in order. Third-party apps (rest_framework, corsheaders)
# go after Django builtins, and local apps (api, accounts) go last.
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party
    'rest_framework',       # Django REST Framework — provides API ViewSets, serializers, etc.
    'corsheaders',          # django-cors-headers — handles CORS headers for cross-origin requests
    # Local
    'api',                  # Main API app — models, views, serializers for portfolio content
    'accounts',             # Authentication app — user registration and JWT token endpoints
]

# --- Middleware ---
# CorsMiddleware must come before CommonMiddleware to inject CORS headers
# before Django processes the response.
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'portfolio.urls'

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

WSGI_APPLICATION = 'portfolio.wsgi.application'

# --- Database ---
# Uses PostgreSQL via the psycopg adapter. The local dev setup uses
# trust authentication (no password) with a user matching the Linux username.
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'portfolio_db'),
        'USER': os.environ.get('DB_USER', 'Wayfarer'),
        'PASSWORD': os.environ.get('DB_PASSWORD', ''),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}

# --- Password Validation ---
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# --- Internationalization ---
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# --- Static & Media Files ---
STATIC_URL = 'static/'

# Media files (user uploads: project images, resumes) are stored under media/
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --- CORS ---
# In development, the Vite frontend runs on port 5173. The Vite dev server
# also has a proxy configured (/api -> localhost:8000), so CORS is mainly
# needed if the frontend makes requests directly to port 8000.
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
]

# --- Django REST Framework ---
# All API endpoints use JWT authentication by default. Pagination is set
# to 12 items per page for project/blog listings.
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 12,
}

# --- JWT (Simple JWT) ---
# Access tokens expire after 30 minutes, requiring a refresh.
# Refresh tokens last 7 days before the user must log in again.
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}
