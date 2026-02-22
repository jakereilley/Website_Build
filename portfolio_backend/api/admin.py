"""
Django admin configuration for portfolio models.

Registers all API models with the Django admin site (/admin/) so content
can be managed through Django's built-in admin interface as an alternative
to the custom frontend admin dashboard.

Features:
    - prepopulated_fields auto-generates slugs from titles as you type
    - list_display controls which columns appear in the admin list view
    - list_filter adds sidebar filters for quick filtering
"""

from django.contrib import admin

from .models import BlogPost, ContactSubmission, Project, Resume


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['title', 'featured', 'order', 'created_at']
    list_filter = ['featured']
    prepopulated_fields = {'slug': ('title',)}


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ['title', 'published', 'author', 'created_at']
    list_filter = ['published']
    prepopulated_fields = {'slug': ('title',)}


@admin.register(ContactSubmission)
class ContactSubmissionAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'subject', 'read', 'created_at']
    list_filter = ['read']


@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ['version', 'is_current', 'uploaded_at']
