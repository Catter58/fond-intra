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
            name='Kudos',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('category', models.CharField(choices=[('help', 'Помощь'), ('great_job', 'Отличная работа'), ('initiative', 'Инициатива'), ('mentorship', 'Наставничество'), ('teamwork', 'Командная работа')], default='great_job', max_length=20, verbose_name='категория')),
                ('message', models.TextField(max_length=500, verbose_name='сообщение')),
                ('is_public', models.BooleanField(default=True, verbose_name='публичная')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='создано')),
                ('recipient', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='kudos_received', to=settings.AUTH_USER_MODEL, verbose_name='получатель')),
                ('sender', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='kudos_sent', to=settings.AUTH_USER_MODEL, verbose_name='отправитель')),
            ],
            options={
                'verbose_name': 'благодарность',
                'verbose_name_plural': 'благодарности',
                'ordering': ['-created_at'],
            },
        ),
    ]
