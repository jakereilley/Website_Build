"""
Data models for the portfolio API.

This module defines the four core content models:
    - Project       — portfolio project entries displayed in the 3D gallery
    - BlogPost      — blog articles with tags and publish control
    - ContactSubmission — messages submitted via the contact form
    - Resume        — uploaded resume files with version tracking

All models are exposed through the REST API (see api/views.py) and
registered in the Django admin (see api/admin.py).
"""

from django.conf import settings
from django.db import models


class Project(models.Model):
    """
    A portfolio project displayed in the 3D gallery.

    Each project appears as an interactive panel on the gallery walls.
    The 'slug' field is used as the URL identifier (e.g., /api/projects/my-project/).
    The 'technologies' field is a JSON array of strings (e.g., ["Python", "Django"]).
    'featured' projects can be highlighted on the home page.
    'order' controls the display sequence in the gallery (lower = first).
    """
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    technologies = models.JSONField(default=list)       # e.g., ["Python", "Three.js"]
    github_url = models.URLField(blank=True)
    live_url = models.URLField(blank=True)
    image = models.ImageField(upload_to='projects/', blank=True)
    featured = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', '-created_at']

    def __str__(self):
        return self.title


class BlogPost(models.Model):
    """
    A blog article.

    Posts with 'published=False' are drafts visible only to admin users.
    The 'excerpt' is a short summary shown in blog listing cards.
    'tags' is a JSON array of strings used for filtering (e.g., ["python", "webdev"]).
    The 'author' is automatically set to the logged-in user on creation
    (see BlogPostViewSet.perform_create).
    """
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    content = models.TextField()                        # HTML content
    excerpt = models.TextField(max_length=500, blank=True)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    tags = models.JSONField(default=list)                # e.g., ["python", "tutorial"]
    published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class ContactSubmission(models.Model):
    """
    A message submitted through the public contact form.

    Anyone can create a submission (no auth required). Only admins can
    view the list. The 'read' flag lets admins track which messages
    they've reviewed.
    """
    name = models.CharField(max_length=100)
    email = models.EmailField()
    subject = models.CharField(max_length=200)
    message = models.TextField()
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} — {self.subject}"


class Resume(models.Model):
    """
    An uploaded resume/CV file with version tracking.

    When a new resume is saved with 'is_current=True', the save() method
    automatically sets all other resumes to 'is_current=False', ensuring
    only one resume is active at a time. The frontend's About page
    fetches the current resume for the download link.
    """
    file = models.FileField(upload_to='resumes/')
    version = models.IntegerField(default=1)
    is_current = models.BooleanField(default=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"Resume v{self.version}"

    def save(self, *args, **kwargs):
        # Deactivate all other resumes when this one is marked as current
        if self.is_current:
            Resume.objects.filter(is_current=True).update(is_current=False)
        super().save(*args, **kwargs)
