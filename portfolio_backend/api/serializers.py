"""
REST API serializers for portfolio models.

Serializers convert Django model instances to/from JSON for the API.
Each serializer maps to one model and controls which fields are
included in the API response and which are writable.

Usage:
    These serializers are used by the ViewSets in api/views.py.
"""

from rest_framework import serializers

from .models import BlogPost, ContactSubmission, Project, Resume


class ProjectSerializer(serializers.ModelSerializer):
    """Serializes all fields on the Project model."""
    class Meta:
        model = Project
        fields = '__all__'


class BlogPostSerializer(serializers.ModelSerializer):
    """
    Serializes blog posts with an added 'author_name' read-only field.

    The 'author' field is read-only — it gets set automatically in
    BlogPostViewSet.perform_create() to the currently logged-in user,
    preventing users from spoofing authorship.
    """
    author_name = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model = BlogPost
        fields = '__all__'
        read_only_fields = ['author']


class ContactSubmissionSerializer(serializers.ModelSerializer):
    """
    Serializes contact form submissions.

    The 'read' field is read-only in this serializer to prevent
    public users from marking their own submissions as read.
    Admins update 'read' status through the admin dashboard.
    """
    class Meta:
        model = ContactSubmission
        fields = '__all__'
        read_only_fields = ['read']


class ResumeSerializer(serializers.ModelSerializer):
    """Serializes all fields on the Resume model."""
    class Meta:
        model = Resume
        fields = '__all__'
