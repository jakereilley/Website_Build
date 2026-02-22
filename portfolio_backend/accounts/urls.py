"""
Authentication URL configuration.

These endpoints are mounted at /api/auth/ in portfolio/urls.py.

Endpoints:
    POST /api/auth/login/    — Authenticate with username/password, returns JWT tokens
    POST /api/auth/register/ — Create a new user account
    POST /api/auth/refresh/  — Exchange a valid refresh token for a new access token

The login and refresh views come from djangorestframework-simplejwt.
The register view is custom (see accounts/views.py).
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import RegisterView

urlpatterns = [
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('register/', RegisterView.as_view(), name='register'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
