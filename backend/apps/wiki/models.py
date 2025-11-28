from django.db import models
from django.conf import settings
from django.utils.text import slugify
from unidecode import unidecode


class WikiSpace(models.Model):
    """Пространство знаний (раздел wiki)"""
    name = models.CharField('Название', max_length=200)
    slug = models.SlugField('URL-имя', max_length=200, unique=True)
    description = models.TextField('Описание', blank=True)
    icon = models.CharField('Иконка', max_length=50, default='Folder')
    is_public = models.BooleanField('Публичный доступ', default=True)

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='owned_wiki_spaces',
        verbose_name='Владелец'
    )
    department = models.ForeignKey(
        'organization.Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='wiki_spaces',
        verbose_name='Отдел'
    )

    # Права доступа
    allowed_departments = models.ManyToManyField(
        'organization.Department',
        blank=True,
        related_name='accessible_wiki_spaces',
        verbose_name='Доступные отделы'
    )
    allowed_roles = models.ManyToManyField(
        'roles.Role',
        blank=True,
        related_name='accessible_wiki_spaces',
        verbose_name='Доступные роли'
    )

    order = models.PositiveIntegerField('Порядок', default=0)
    created_at = models.DateTimeField('Создано', auto_now_add=True)
    updated_at = models.DateTimeField('Обновлено', auto_now=True)

    class Meta:
        verbose_name = 'Пространство Wiki'
        verbose_name_plural = 'Пространства Wiki'
        ordering = ['order', 'name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(unidecode(self.name))
        super().save(*args, **kwargs)

    def user_has_access(self, user):
        """Проверка доступа пользователя к пространству"""
        if self.is_public:
            return True
        if user.is_superuser:
            return True
        if self.owner == user:
            return True
        if self.department and user.department == self.department:
            return True
        if self.allowed_departments.filter(id=user.department_id).exists():
            return True
        if self.allowed_roles.filter(id__in=user.roles.values_list('id', flat=True)).exists():
            return True
        return False


class WikiTag(models.Model):
    """Тег для страниц wiki"""
    name = models.CharField('Название', max_length=100, unique=True)
    slug = models.SlugField('URL-имя', max_length=100, unique=True)
    color = models.CharField('Цвет', max_length=20, default='blue')

    class Meta:
        verbose_name = 'Тег Wiki'
        verbose_name_plural = 'Теги Wiki'
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(unidecode(self.name))
        super().save(*args, **kwargs)


class WikiPage(models.Model):
    """Страница wiki"""
    title = models.CharField('Заголовок', max_length=300)
    slug = models.SlugField('URL-имя', max_length=300)
    content = models.JSONField('Содержимое', default=dict, blank=True)
    excerpt = models.TextField('Краткое описание', blank=True, max_length=500)

    space = models.ForeignKey(
        WikiSpace,
        on_delete=models.CASCADE,
        related_name='pages',
        verbose_name='Пространство'
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='wiki_pages',
        verbose_name='Автор'
    )

    # Иерархия страниц
    parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='children',
        verbose_name='Родительская страница'
    )
    order = models.PositiveIntegerField('Порядок', default=0)
    depth = models.PositiveIntegerField('Глубина вложенности', default=0)

    # Теги
    tags = models.ManyToManyField(
        WikiTag,
        blank=True,
        related_name='pages',
        verbose_name='Теги'
    )

    # Статусы
    is_published = models.BooleanField('Опубликовано', default=True)
    is_archived = models.BooleanField('В архиве', default=False)

    # Статистика
    view_count = models.PositiveIntegerField('Просмотры', default=0)

    created_at = models.DateTimeField('Создано', auto_now_add=True)
    updated_at = models.DateTimeField('Обновлено', auto_now=True)

    class Meta:
        verbose_name = 'Страница Wiki'
        verbose_name_plural = 'Страницы Wiki'
        ordering = ['order', 'title']
        unique_together = [['space', 'slug']]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(unidecode(self.title))
            slug = base_slug
            counter = 1
            while WikiPage.objects.filter(space=self.space, slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug

        # Вычисляем глубину
        if self.parent:
            self.depth = self.parent.depth + 1
        else:
            self.depth = 0

        super().save(*args, **kwargs)

    def get_breadcrumbs(self):
        """Получить хлебные крошки"""
        breadcrumbs = []
        page = self
        while page:
            breadcrumbs.insert(0, {'id': page.id, 'title': page.title, 'slug': page.slug})
            page = page.parent
        return breadcrumbs

    def get_plain_text_content(self):
        """Извлечь текст из Editor.js контента для поиска"""
        if not self.content or not isinstance(self.content, dict):
            return ''

        blocks = self.content.get('blocks', [])
        text_parts = []

        for block in blocks:
            block_type = block.get('type')
            data = block.get('data', {})

            if block_type == 'paragraph':
                text_parts.append(data.get('text', ''))
            elif block_type == 'header':
                text_parts.append(data.get('text', ''))
            elif block_type == 'list':
                items = data.get('items', [])
                text_parts.extend(items)
            elif block_type == 'quote':
                text_parts.append(data.get('text', ''))
            elif block_type == 'code':
                text_parts.append(data.get('code', ''))
            elif block_type == 'table':
                for row in data.get('content', []):
                    text_parts.extend(row)

        return ' '.join(text_parts)


class WikiPageVersion(models.Model):
    """Версия страницы wiki"""
    page = models.ForeignKey(
        WikiPage,
        on_delete=models.CASCADE,
        related_name='versions',
        verbose_name='Страница'
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='wiki_page_versions',
        verbose_name='Автор'
    )

    version_number = models.PositiveIntegerField('Номер версии')
    content = models.JSONField('Содержимое', default=dict)
    title = models.CharField('Заголовок', max_length=300)
    change_summary = models.CharField('Описание изменений', max_length=500, blank=True)

    created_at = models.DateTimeField('Создано', auto_now_add=True)

    class Meta:
        verbose_name = 'Версия страницы Wiki'
        verbose_name_plural = 'Версии страниц Wiki'
        ordering = ['-version_number']
        unique_together = [['page', 'version_number']]

    def __str__(self):
        return f"{self.page.title} - v{self.version_number}"


class WikiAttachment(models.Model):
    """Вложение к странице wiki"""
    page = models.ForeignKey(
        WikiPage,
        on_delete=models.CASCADE,
        related_name='attachments',
        verbose_name='Страница'
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='wiki_attachments',
        verbose_name='Загружено'
    )

    file = models.FileField('Файл', upload_to='wiki/attachments/%Y/%m/')
    filename = models.CharField('Имя файла', max_length=255)
    size = models.PositiveIntegerField('Размер (байт)', default=0)
    mime_type = models.CharField('MIME тип', max_length=100, blank=True)

    created_at = models.DateTimeField('Создано', auto_now_add=True)

    class Meta:
        verbose_name = 'Вложение Wiki'
        verbose_name_plural = 'Вложения Wiki'
        ordering = ['-created_at']

    def __str__(self):
        return self.filename

    def save(self, *args, **kwargs):
        if self.file:
            if not self.filename:
                self.filename = self.file.name
            if not self.size:
                self.size = self.file.size
        super().save(*args, **kwargs)
