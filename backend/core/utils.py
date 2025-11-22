"""
Common utility functions.
"""
import os
import uuid
from django.utils.text import slugify


def get_file_path(instance, filename, folder):
    """
    Generate unique file path for uploads.
    Usage: upload_to=lambda i, f: get_file_path(i, f, 'avatars')
    """
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4().hex}.{ext}"
    return os.path.join(folder, filename)


def avatar_upload_path(instance, filename):
    """Upload path for user avatars."""
    return get_file_path(instance, filename, 'avatars')


def achievement_icon_upload_path(instance, filename):
    """Upload path for achievement icons."""
    return get_file_path(instance, filename, 'achievements')


def news_attachment_upload_path(instance, filename):
    """Upload path for news attachments."""
    return get_file_path(instance, filename, 'news_attachments')
