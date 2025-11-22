"""
Signals for accounts app.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver


# Signals will be implemented when models are created
# Example:
# @receiver(post_save, sender='accounts.User')
# def create_notification_settings(sender, instance, created, **kwargs):
#     if created:
#         NotificationSettings.objects.create(user=instance)
