"""
Root URL configuration for the portfolio project.

Routes:
    /admin/      — Django's built-in admin interface
    /api/        — REST API endpoints (projects, blog, contact, resume)
    /api/auth/   — Authentication endpoints (login, register, refresh)
    /media/...   — User-uploaded files (only served in DEBUG mode;
                   in production, use a web server like Nginx)
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('api/auth/', include('accounts.urls')),
]

# Serve media files (project images, resumes) during local development.
# In production, configure your web server to serve MEDIA_ROOT directly.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
