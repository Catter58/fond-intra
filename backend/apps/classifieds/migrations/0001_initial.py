# Generated migration for classifieds app

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
            name='ClassifiedCategory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, verbose_name='Название')),
                ('slug', models.SlugField(blank=True, max_length=100, unique=True, verbose_name='Slug')),
                ('icon', models.CharField(blank=True, help_text='Carbon icon name', max_length=50, verbose_name='Иконка')),
                ('order', models.PositiveIntegerField(default=0, verbose_name='Порядок')),
                ('is_active', models.BooleanField(default=True, verbose_name='Активна')),
            ],
            options={
                'verbose_name': 'Категория объявлений',
                'verbose_name_plural': 'Категории объявлений',
                'ordering': ['order', 'name'],
            },
        ),
        migrations.CreateModel(
            name='Classified',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200, verbose_name='Заголовок')),
                ('description', models.TextField(verbose_name='Описание')),
                ('contact_info', models.CharField(blank=True, help_text='Если отличается от данных профиля', max_length=200, verbose_name='Контактная информация')),
                ('price', models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True, verbose_name='Цена')),
                ('status', models.CharField(choices=[('active', 'Активно'), ('closed', 'Закрыто'), ('expired', 'Истекло')], default='active', max_length=20, verbose_name='Статус')),
                ('views_count', models.PositiveIntegerField(default=0, verbose_name='Просмотры')),
                ('expires_at', models.DateTimeField(blank=True, null=True, verbose_name='Истекает')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Создано')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Обновлено')),
                ('author', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='classifieds', to=settings.AUTH_USER_MODEL, verbose_name='Автор')),
                ('category', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='classifieds', to='classifieds.classifiedcategory', verbose_name='Категория')),
            ],
            options={
                'verbose_name': 'Объявление',
                'verbose_name_plural': 'Объявления',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='ClassifiedImage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('image', models.ImageField(upload_to='classifieds/', verbose_name='Изображение')),
                ('order', models.PositiveIntegerField(default=0, verbose_name='Порядок')),
                ('uploaded_at', models.DateTimeField(auto_now_add=True, verbose_name='Загружено')),
                ('classified', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='images', to='classifieds.classified', verbose_name='Объявление')),
            ],
            options={
                'verbose_name': 'Изображение',
                'verbose_name_plural': 'Изображения',
                'ordering': ['order'],
            },
        ),
    ]
