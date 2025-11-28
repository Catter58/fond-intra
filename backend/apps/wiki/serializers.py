from rest_framework import serializers
from .models import WikiSpace, WikiPage, WikiPageVersion, WikiTag, WikiAttachment


class WikiTagSerializer(serializers.ModelSerializer):
    """Сериализатор тегов"""
    class Meta:
        model = WikiTag
        fields = ['id', 'name', 'slug', 'color']
        read_only_fields = ['slug']


class WikiAttachmentSerializer(serializers.ModelSerializer):
    """Сериализатор вложений"""
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)

    class Meta:
        model = WikiAttachment
        fields = ['id', 'file', 'filename', 'size', 'mime_type', 'uploaded_by', 'uploaded_by_name', 'created_at']
        read_only_fields = ['filename', 'size', 'mime_type', 'uploaded_by', 'created_at']


class WikiPageVersionSerializer(serializers.ModelSerializer):
    """Сериализатор версий страницы"""
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)
    author_avatar = serializers.SerializerMethodField()

    class Meta:
        model = WikiPageVersion
        fields = ['id', 'version_number', 'title', 'content', 'change_summary', 'author', 'author_name', 'author_avatar', 'created_at']
        read_only_fields = ['id', 'version_number', 'title', 'content', 'author', 'created_at']

    def get_author_avatar(self, obj):
        if obj.author and obj.author.avatar:
            return obj.author.avatar.url
        return None


class WikiPageListSerializer(serializers.ModelSerializer):
    """Сериализатор списка страниц (краткий)"""
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)
    tags = WikiTagSerializer(many=True, read_only=True)
    children_count = serializers.SerializerMethodField()

    class Meta:
        model = WikiPage
        fields = [
            'id', 'title', 'slug', 'excerpt', 'space', 'parent',
            'order', 'depth', 'is_published', 'is_archived',
            'view_count', 'author', 'author_name', 'tags',
            'children_count', 'created_at', 'updated_at'
        ]

    def get_children_count(self, obj):
        return obj.children.filter(is_archived=False).count()


class WikiPageDetailSerializer(serializers.ModelSerializer):
    """Сериализатор детальной страницы"""
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)
    author_avatar = serializers.SerializerMethodField()
    tags = WikiTagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=WikiTag.objects.all(),
        many=True,
        write_only=True,
        required=False,
        source='tags'
    )
    attachments = WikiAttachmentSerializer(many=True, read_only=True)
    breadcrumbs = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()
    versions_count = serializers.SerializerMethodField()
    space_name = serializers.CharField(source='space.name', read_only=True)
    space_slug = serializers.CharField(source='space.slug', read_only=True)

    class Meta:
        model = WikiPage
        fields = [
            'id', 'title', 'slug', 'content', 'excerpt',
            'space', 'space_name', 'space_slug',
            'parent', 'order', 'depth',
            'is_published', 'is_archived', 'view_count',
            'author', 'author_name', 'author_avatar',
            'tags', 'tag_ids', 'attachments',
            'breadcrumbs', 'children', 'versions_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['slug', 'depth', 'view_count', 'author', 'created_at', 'updated_at']

    def get_author_avatar(self, obj):
        if obj.author and obj.author.avatar:
            return obj.author.avatar.url
        return None

    def get_breadcrumbs(self, obj):
        return obj.get_breadcrumbs()

    def get_children(self, obj):
        children = obj.children.filter(is_archived=False).order_by('order', 'title')
        return WikiPageListSerializer(children, many=True).data

    def get_versions_count(self, obj):
        return obj.versions.count()


class WikiPageCreateSerializer(serializers.ModelSerializer):
    """Сериализатор создания страницы"""
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=WikiTag.objects.all(),
        many=True,
        write_only=True,
        required=False
    )

    class Meta:
        model = WikiPage
        fields = [
            'id', 'title', 'content', 'excerpt',
            'space', 'parent', 'order',
            'is_published', 'tag_ids'
        ]

    def create(self, validated_data):
        tag_ids = validated_data.pop('tag_ids', [])
        validated_data['author'] = self.context['request'].user
        page = WikiPage.objects.create(**validated_data)
        if tag_ids:
            page.tags.set(tag_ids)
        return page


class WikiPageUpdateSerializer(serializers.ModelSerializer):
    """Сериализатор обновления страницы"""
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=WikiTag.objects.all(),
        many=True,
        write_only=True,
        required=False
    )
    change_summary = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = WikiPage
        fields = [
            'title', 'content', 'excerpt',
            'parent', 'order', 'is_published', 'is_archived',
            'tag_ids', 'change_summary'
        ]

    def update(self, instance, validated_data):
        tag_ids = validated_data.pop('tag_ids', None)
        change_summary = validated_data.pop('change_summary', '')

        # Устанавливаем атрибуты для сигнала
        instance._updated_by = self.context['request'].user
        instance._change_summary = change_summary

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        if tag_ids is not None:
            instance.tags.set(tag_ids)

        return instance


class WikiSpaceListSerializer(serializers.ModelSerializer):
    """Сериализатор списка пространств"""
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True, default=None)
    pages_count = serializers.SerializerMethodField()

    class Meta:
        model = WikiSpace
        fields = [
            'id', 'name', 'slug', 'description', 'icon',
            'is_public', 'owner', 'owner_name',
            'department', 'department_name',
            'pages_count', 'order', 'created_at', 'updated_at'
        ]

    def get_pages_count(self, obj):
        return obj.pages.filter(is_archived=False).count()


class WikiSpaceDetailSerializer(serializers.ModelSerializer):
    """Сериализатор детального пространства"""
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True, default=None)
    pages_count = serializers.SerializerMethodField()
    root_pages = serializers.SerializerMethodField()
    allowed_department_ids = serializers.PrimaryKeyRelatedField(
        queryset='organization.Department'.objects.all() if False else [],
        many=True,
        write_only=True,
        required=False,
        source='allowed_departments'
    )
    allowed_role_ids = serializers.PrimaryKeyRelatedField(
        queryset='roles.Role'.objects.all() if False else [],
        many=True,
        write_only=True,
        required=False,
        source='allowed_roles'
    )

    class Meta:
        model = WikiSpace
        fields = [
            'id', 'name', 'slug', 'description', 'icon',
            'is_public', 'owner', 'owner_name',
            'department', 'department_name',
            'allowed_departments', 'allowed_roles',
            'allowed_department_ids', 'allowed_role_ids',
            'pages_count', 'root_pages',
            'order', 'created_at', 'updated_at'
        ]
        read_only_fields = ['slug', 'owner', 'created_at', 'updated_at']

    def get_pages_count(self, obj):
        return obj.pages.filter(is_archived=False).count()

    def get_root_pages(self, obj):
        root_pages = obj.pages.filter(parent__isnull=True, is_archived=False).order_by('order', 'title')
        return WikiPageListSerializer(root_pages, many=True).data


class WikiSpaceCreateSerializer(serializers.ModelSerializer):
    """Сериализатор создания пространства"""
    allowed_department_ids = serializers.PrimaryKeyRelatedField(
        queryset='organization.Department'.objects.all() if False else [],
        many=True,
        write_only=True,
        required=False
    )
    allowed_role_ids = serializers.PrimaryKeyRelatedField(
        queryset='roles.Role'.objects.all() if False else [],
        many=True,
        write_only=True,
        required=False
    )

    class Meta:
        model = WikiSpace
        fields = [
            'name', 'description', 'icon',
            'is_public', 'department', 'order',
            'allowed_department_ids', 'allowed_role_ids'
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from apps.organization.models import Department
        from apps.roles.models import Role
        self.fields['allowed_department_ids'] = serializers.PrimaryKeyRelatedField(
            queryset=Department.objects.all(),
            many=True,
            write_only=True,
            required=False
        )
        self.fields['allowed_role_ids'] = serializers.PrimaryKeyRelatedField(
            queryset=Role.objects.all(),
            many=True,
            write_only=True,
            required=False
        )

    def create(self, validated_data):
        allowed_departments = validated_data.pop('allowed_department_ids', [])
        allowed_roles = validated_data.pop('allowed_role_ids', [])

        validated_data['owner'] = self.context['request'].user
        space = WikiSpace.objects.create(**validated_data)

        if allowed_departments:
            space.allowed_departments.set(allowed_departments)
        if allowed_roles:
            space.allowed_roles.set(allowed_roles)

        return space


class WikiPageTreeSerializer(serializers.ModelSerializer):
    """Сериализатор дерева страниц"""
    children = serializers.SerializerMethodField()

    class Meta:
        model = WikiPage
        fields = ['id', 'title', 'slug', 'order', 'depth', 'is_published', 'children']

    def get_children(self, obj):
        children = obj.children.filter(is_archived=False).order_by('order', 'title')
        return WikiPageTreeSerializer(children, many=True).data
