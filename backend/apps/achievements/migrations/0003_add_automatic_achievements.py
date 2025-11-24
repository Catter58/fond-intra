# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('achievements', '0002_change_icon_to_charfield'),
    ]

    operations = [
        migrations.AddField(
            model_name='achievement',
            name='is_automatic',
            field=models.BooleanField(default=False, help_text='Achievement is awarded automatically when trigger condition is met', verbose_name='automatic'),
        ),
        migrations.AddField(
            model_name='achievement',
            name='trigger_type',
            field=models.CharField(blank=True, choices=[('comments_count', 'Comments count'), ('reactions_given', 'Reactions given'), ('reactions_received', 'Reactions received'), ('news_created', 'News created'), ('logins_count', 'Logins count'), ('profile_views', 'Profile views'), ('endorsements_received', 'Endorsements received'), ('skills_count', 'Skills count'), ('achievements_count', 'Achievements received')], help_text='Type of action that triggers this achievement', max_length=30, null=True, verbose_name='trigger type'),
        ),
        migrations.AddField(
            model_name='achievement',
            name='trigger_value',
            field=models.PositiveIntegerField(blank=True, help_text='Threshold value for the trigger (e.g., 10 comments)', null=True, verbose_name='trigger value'),
        ),
    ]
