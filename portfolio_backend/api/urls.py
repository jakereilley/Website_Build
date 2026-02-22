"""
API URL configuration.

Uses DRF's DefaultRouter to automatically generate URL patterns for all
ViewSets. The router creates both list and detail endpoints:

    /api/projects/              GET (list), POST (create)
    /api/projects/<slug>/       GET (detail), PUT (update), DELETE (destroy)
    /api/blog/                  GET (list), POST (create)
    /api/blog/<slug>/           GET (detail), PUT (update), DELETE (destroy)
    /api/contact/               GET (list, admin only), POST (create, public)
    /api/contact/<id>/          GET/PUT/DELETE (admin only)
    /api/resume/                GET (list), POST (create)
    /api/resume/<id>/           GET (detail), PUT (update), DELETE (destroy)

These URLs are included under the /api/ prefix in portfolio/urls.py.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    BlogPostViewSet,
    ContactSubmissionViewSet,
    ProjectViewSet,
    ResumeViewSet,
)

# The DefaultRouter also provides an API root view at /api/ that lists
# all registered endpoints — useful for browsing during development.
router = DefaultRouter()
router.register(r'projects', ProjectViewSet)
router.register(r'blog', BlogPostViewSet, basename='blogpost')
router.register(r'contact', ContactSubmissionViewSet)
router.register(r'resume', ResumeViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
