from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from .models import WikiPage, WikiPageVersion


@receiver(pre_save, sender=WikiPage)
def create_version_on_update(sender, instance, **kwargs):
    """Создать версию страницы перед сохранением изменений"""
    if instance.pk:
        try:
            old_instance = WikiPage.objects.get(pk=instance.pk)
            # Проверяем, изменился ли контент
            if old_instance.content != instance.content or old_instance.title != instance.title:
                # Сохраняем старую версию в атрибут для последующего создания
                instance._old_content = old_instance.content
                instance._old_title = old_instance.title
        except WikiPage.DoesNotExist:
            pass


@receiver(post_save, sender=WikiPage)
def save_version_after_update(sender, instance, created, **kwargs):
    """Сохранить версию после обновления страницы"""
    if not created and hasattr(instance, '_old_content'):
        # Получаем последний номер версии
        last_version = instance.versions.order_by('-version_number').first()
        next_version = (last_version.version_number + 1) if last_version else 1

        WikiPageVersion.objects.create(
            page=instance,
            author=getattr(instance, '_updated_by', instance.author),
            version_number=next_version,
            content=instance._old_content,
            title=instance._old_title,
            change_summary=getattr(instance, '_change_summary', '')
        )

        # Очищаем временные атрибуты
        delattr(instance, '_old_content')
        delattr(instance, '_old_title')

    elif created:
        # Создаём первую версию для новой страницы
        WikiPageVersion.objects.create(
            page=instance,
            author=instance.author,
            version_number=1,
            content=instance.content,
            title=instance.title,
            change_summary='Создание страницы'
        )
