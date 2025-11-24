# Generated migration for surveys app

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('organization', '0001_initial'),
        ('roles', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Survey',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255, verbose_name='Название')),
                ('description', models.TextField(blank=True, verbose_name='Описание')),
                ('is_anonymous', models.BooleanField(default=False, verbose_name='Анонимный')),
                ('is_required', models.BooleanField(default=False, verbose_name='Обязательный')),
                ('status', models.CharField(choices=[('draft', 'Черновик'), ('active', 'Активный'), ('closed', 'Завершён')], default='draft', max_length=20, verbose_name='Статус')),
                ('starts_at', models.DateTimeField(blank=True, null=True, verbose_name='Начало')),
                ('ends_at', models.DateTimeField(blank=True, null=True, verbose_name='Окончание')),
                ('target_type', models.CharField(choices=[('all', 'Все сотрудники'), ('department', 'По отделам'), ('role', 'По ролям')], default='all', max_length=20, verbose_name='Тип аудитории')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Создано')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Обновлено')),
                ('author', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='created_surveys', to=settings.AUTH_USER_MODEL, verbose_name='Автор')),
                ('target_departments', models.ManyToManyField(blank=True, related_name='targeted_surveys', to='organization.department', verbose_name='Целевые отделы')),
                ('target_roles', models.ManyToManyField(blank=True, related_name='targeted_surveys', to='roles.role', verbose_name='Целевые роли')),
            ],
            options={
                'verbose_name': 'Опрос',
                'verbose_name_plural': 'Опросы',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='Question',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('text', models.TextField(verbose_name='Текст вопроса')),
                ('type', models.CharField(choices=[('single_choice', 'Один вариант'), ('multiple_choice', 'Несколько вариантов'), ('scale', 'Шкала'), ('text', 'Текст'), ('nps', 'NPS (0-10)')], default='single_choice', max_length=20, verbose_name='Тип вопроса')),
                ('is_required', models.BooleanField(default=True, verbose_name='Обязательный')),
                ('order', models.PositiveIntegerField(default=0, verbose_name='Порядок')),
                ('scale_min', models.PositiveSmallIntegerField(default=1, verbose_name='Мин. значение')),
                ('scale_max', models.PositiveSmallIntegerField(default=5, verbose_name='Макс. значение')),
                ('scale_min_label', models.CharField(blank=True, max_length=100, verbose_name='Подпись мин.')),
                ('scale_max_label', models.CharField(blank=True, max_length=100, verbose_name='Подпись макс.')),
                ('survey', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='questions', to='surveys.survey', verbose_name='Опрос')),
            ],
            options={
                'verbose_name': 'Вопрос',
                'verbose_name_plural': 'Вопросы',
                'ordering': ['order'],
            },
        ),
        migrations.CreateModel(
            name='QuestionOption',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('text', models.CharField(max_length=255, verbose_name='Текст варианта')),
                ('order', models.PositiveIntegerField(default=0, verbose_name='Порядок')),
                ('question', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='options', to='surveys.question', verbose_name='Вопрос')),
            ],
            options={
                'verbose_name': 'Вариант ответа',
                'verbose_name_plural': 'Варианты ответа',
                'ordering': ['order'],
            },
        ),
        migrations.CreateModel(
            name='Response',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Создано')),
                ('survey', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='responses', to='surveys.survey', verbose_name='Опрос')),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='survey_responses', to=settings.AUTH_USER_MODEL, verbose_name='Пользователь')),
            ],
            options={
                'verbose_name': 'Ответ на опрос',
                'verbose_name_plural': 'Ответы на опросы',
                'unique_together': {('survey', 'user')},
            },
        ),
        migrations.CreateModel(
            name='Answer',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('text_value', models.TextField(blank=True, verbose_name='Текстовый ответ')),
                ('scale_value', models.PositiveSmallIntegerField(blank=True, null=True, verbose_name='Числовой ответ')),
                ('question', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='answers', to='surveys.question', verbose_name='Вопрос')),
                ('response', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='answers', to='surveys.response', verbose_name='Ответ')),
                ('selected_options', models.ManyToManyField(blank=True, related_name='answers', to='surveys.questionoption', verbose_name='Выбранные варианты')),
            ],
            options={
                'verbose_name': 'Ответ на вопрос',
                'verbose_name_plural': 'Ответы на вопросы',
                'unique_together': {('response', 'question')},
            },
        ),
    ]
