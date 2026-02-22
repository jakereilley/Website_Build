"""
Custom DRF permission classes.

These permissions are applied to ViewSets in api/views.py to control
who can read vs. write portfolio content.
"""

from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsAdminOrReadOnly(BasePermission):
    """
    Allow read-only access (GET, HEAD, OPTIONS) to any user.
    Require staff/admin status for write operations (POST, PUT, PATCH, DELETE).

    This is the primary permission for Projects, BlogPosts, and Resumes —
    the public can browse content, but only admins can create or modify it.
    """
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user and request.user.is_staff
