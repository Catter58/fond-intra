"""
Migration to convert News.content from TextField to JSONField for Editor.js.
Converts existing HTML/text content to Editor.js JSON format.
"""
from django.db import migrations, models
import json


def convert_text_to_editorjs(apps, schema_editor):
    """Convert existing text content to Editor.js JSON format."""
    News = apps.get_model('news', 'News')
    for news in News.objects.all():
        old_content = news.content
        if old_content:
            # Convert text/HTML to Editor.js paragraph blocks
            paragraphs = old_content.split('\n')
            blocks = []
            for p in paragraphs:
                p = p.strip()
                if p:
                    blocks.append({
                        "id": str(hash(p) % 10**10),
                        "type": "paragraph",
                        "data": {"text": p}
                    })
            news.content = json.dumps({
                "time": 0,
                "blocks": blocks,
                "version": "2.28.0"
            })
        else:
            news.content = json.dumps({
                "time": 0,
                "blocks": [],
                "version": "2.28.0"
            })
        news.save(update_fields=['content'])


def convert_editorjs_to_text(apps, schema_editor):
    """Reverse: convert Editor.js JSON back to text."""
    News = apps.get_model('news', 'News')
    for news in News.objects.all():
        try:
            data = json.loads(news.content)
            texts = []
            for block in data.get('blocks', []):
                if block.get('type') == 'paragraph':
                    texts.append(block.get('data', {}).get('text', ''))
            news.content = '\n'.join(texts)
        except (json.JSONDecodeError, TypeError):
            pass  # Keep as is if not valid JSON
        news.save(update_fields=['content'])


class Migration(migrations.Migration):

    dependencies = [
        ('news', '0002_add_tags'),
    ]

    operations = [
        # Step 1: Convert existing text to JSON string
        migrations.RunPython(
            convert_text_to_editorjs,
            reverse_code=convert_editorjs_to_text
        ),
        # Step 2: Change field type to JSONField
        migrations.AlterField(
            model_name='news',
            name='content',
            field=models.JSONField(
                default=dict,
                help_text='Editor.js JSON content',
                verbose_name='content'
            ),
        ),
    ]
