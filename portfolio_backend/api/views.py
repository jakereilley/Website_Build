"""
API ViewSets for portfolio content.

Each ViewSet provides full CRUD (list, create, retrieve, update, destroy)
for its model. Permissions control who can perform which actions:

    - ProjectViewSet:           Public read, admin write. Lookup by slug.
    - BlogPostViewSet:          Public sees published only, admin sees all. Lookup by slug.
    - ContactSubmissionViewSet: Anyone can create (submit form), only admin can list/read.
    - ResumeViewSet:            Public read (download), admin write (upload).

All ViewSets are registered with the DRF router in api/urls.py, which
auto-generates the URL patterns (e.g., /api/projects/, /api/projects/<slug>/).
"""

from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAdminUser

from .models import BlogPost, ContactSubmission, Project, Resume
from .permissions import IsAdminOrReadOnly
from .serializers import (
    BlogPostSerializer,
    ContactSubmissionSerializer,
    ProjectSerializer,
    ResumeSerializer,
)


class ProjectViewSet(viewsets.ModelViewSet):
    """
    CRUD for portfolio projects.

    Uses slug as the URL lookup field instead of the default primary key,
    so URLs look like /api/projects/my-project/ instead of /api/projects/1/.
    """
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = 'slug'


class BlogPostViewSet(viewsets.ModelViewSet):
    """
    CRUD for blog posts.

    Queryset filtering:
        - Admin users see all posts (including unpublished drafts).
        - Public users only see posts where published=True.

    On creation, the 'author' field is automatically set to the
    currently authenticated user via perform_create().
    """
    serializer_class = BlogPostSerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = 'slug'

    def get_queryset(self):
        """Return all posts for admins, only published posts for everyone else."""
        if self.request.user.is_staff:
            return BlogPost.objects.all()
        return BlogPost.objects.filter(published=True)

    def perform_create(self, serializer):
        """Attach the logged-in user as the post author on creation."""
        serializer.save(author=self.request.user)


class ContactSubmissionViewSet(viewsets.ModelViewSet):
    """
    Contact form submissions.

    Permission logic:
        - 'create' action (POST /api/contact/) is open to anyone (AllowAny),
          so visitors can submit the contact form without logging in.
        - All other actions (list, retrieve, update, delete) require admin.
    """
    queryset = ContactSubmission.objects.all()
    serializer_class = ContactSubmissionSerializer

    def get_permissions(self):
        """Allow unauthenticated users to submit, but require admin for everything else."""
        if self.action == 'create':
            return [AllowAny()]
        return [IsAdminUser()]


class ResumeViewSet(viewsets.ModelViewSet):
    """
    Resume file management.

    Public users can list/download resumes. Admin users can upload new
    versions. The Resume model's save() method ensures only one resume
    is marked as 'is_current' at a time.
    """
    queryset = Resume.objects.all()
    serializer_class = ResumeSerializer
    permission_classes = [IsAdminOrReadOnly]
