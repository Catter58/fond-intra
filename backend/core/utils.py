"""
Common utility functions.
"""
import os
import uuid
from io import BytesIO
from django.utils.text import slugify
from django.core.files.base import ContentFile
import bleach

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False


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


# HTML Sanitization for Rich Text
ALLOWED_TAGS = [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'a', 'img',
    'blockquote', 'pre', 'code',
    'hr', 'div', 'span',
]

ALLOWED_ATTRIBUTES = {
    '*': ['class', 'style'],
    'a': ['href', 'title', 'target', 'rel'],
    'img': ['src', 'alt', 'title', 'width', 'height'],
}

ALLOWED_STYLES = [
    'text-align', 'text-decoration', 'font-weight', 'font-style',
]


def sanitize_html(html_content: str) -> str:
    """
    Sanitize HTML content to prevent XSS attacks.
    Allows only safe tags and attributes for rich text content.
    """
    if not html_content:
        return ''

    return bleach.clean(
        html_content,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        strip=True,
    )


def generate_thumbnail(image_file, size=(400, 300), quality=85):
    """
    Generate thumbnail from image file.

    Args:
        image_file: Django File/InMemoryUploadedFile
        size: tuple (width, height) - max dimensions
        quality: JPEG quality (1-100)

    Returns:
        ContentFile with thumbnail or None if PIL not available
    """
    if not HAS_PIL:
        return None

    try:
        image_file.seek(0)
        img = Image.open(image_file)

        # Convert to RGB if necessary (for PNG with transparency)
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')

        # Calculate thumbnail size maintaining aspect ratio
        img.thumbnail(size, Image.Resampling.LANCZOS)

        # Save to BytesIO
        thumb_io = BytesIO()
        img.save(thumb_io, format='JPEG', quality=quality, optimize=True)
        thumb_io.seek(0)

        return ContentFile(thumb_io.read())
    except Exception:
        return None


def is_valid_image(file_obj, max_size_mb=10):
    """
    Validate image file.

    Args:
        file_obj: Django File/InMemoryUploadedFile
        max_size_mb: Maximum file size in MB

    Returns:
        tuple (is_valid, error_message)
    """
    # Check file size
    max_size_bytes = max_size_mb * 1024 * 1024
    if file_obj.size > max_size_bytes:
        return False, f'Файл слишком большой. Максимум {max_size_mb} MB.'

    # Check content type
    valid_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    content_type = getattr(file_obj, 'content_type', '')
    if content_type not in valid_types:
        return False, 'Неподдерживаемый формат изображения. Используйте JPEG, PNG, GIF или WebP.'

    # Validate with PIL if available
    if HAS_PIL:
        try:
            file_obj.seek(0)
            img = Image.open(file_obj)
            img.verify()
            file_obj.seek(0)
        except Exception:
            return False, 'Файл повреждён или не является изображением.'

    return True, None
