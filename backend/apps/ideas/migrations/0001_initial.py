# Generated migration for ideas app

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Idea',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255, verbose_name='Заголовок')),
                ('description', models.TextField(verbose_name='Описание')),
                ('category', models.CharField(choices=[('process', 'Процессы'), ('product', 'Продукт'), ('culture', 'Культура'), ('other', 'Другое')], default='other', max_length=20, verbose_name='Категория')),
                ('status', models.CharField(choices=[('new', 'Новая'), ('under_review', 'На рассмотрении'), ('approved', 'Одобрена'), ('in_progress', 'В работе'), ('implemented', 'Реализована'), ('rejected', 'Отклонена')], default='new', max_length=20, verbose_name='Статус')),
                ('admin_comment', models.TextField(blank=True, verbose_name='Комментарий модератора')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Создано')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Обновлено')),
                ('author', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='ideas', to=settings.AUTH_USER_MODEL, verbose_name='Автор')),
            ],
            options={
                'verbose_name': 'Идея',
                'verbose_name_plural': 'Идеи',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='IdeaVote',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('is_upvote', models.BooleanField(default=True, verbose_name='За')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Создано')),
                ('idea', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='votes', to='ideas.idea', verbose_name='Идея')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='idea_votes', to=settings.AUTH_USER_MODEL, verbose_name='Пользователь')),
            ],
            options={
                'verbose_name': 'Голос',
                'verbose_name_plural': 'Голоса',
                'unique_together': {('idea', 'user')},
            },
        ),
        migrations.CreateModel(
            name='IdeaComment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('text', models.TextField(verbose_name='Текст')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Создано')),
                ('author', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='idea_comments', to=settings.AUTH_USER_MODEL, verbose_name='Автор')),
                ('idea', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='comments', to='ideas.idea', verbose_name='Идея')),
            ],
            options={
                'verbose_name': 'Комментарий',
                'verbose_name_plural': 'Комментарии',
                'ordering': ['created_at'],
            },
        ),
    ]
