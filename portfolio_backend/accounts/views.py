"""
Authentication views for user registration.

This module provides the registration endpoint. Login and token refresh
are handled by djangorestframework-simplejwt's built-in views
(configured in accounts/urls.py).

Authentication Flow:
    1. User registers via POST /api/auth/register/ (this view)
    2. User logs in via POST /api/auth/login/ → receives access + refresh JWT tokens
    3. Frontend stores tokens in localStorage and attaches them to API requests
    4. When the access token expires (30 min), the frontend calls
       POST /api/auth/refresh/ with the refresh token to get a new access token
    5. When the refresh token expires (7 days), the user must log in again
"""

from django.contrib.auth.models import User
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class RegisterSerializer(serializers.ModelSerializer):
    """
    Validates and creates new user accounts.

    The password field is write-only (never included in responses) and
    requires a minimum length of 8 characters. create() uses
    Django's create_user() which handles password hashing automatically.
    """
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        """Create a new user with a properly hashed password."""
        return User.objects.create_user(**validated_data)


class RegisterView(APIView):
    """
    POST /api/auth/register/

    Creates a new user account. Open to all (no authentication required).
    Returns HTTP 201 on success with a confirmation message.
    Returns HTTP 400 if validation fails (duplicate username, short password, etc.).
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'detail': 'User created.'}, status=status.HTTP_201_CREATED)
