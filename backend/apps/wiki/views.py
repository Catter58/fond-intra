from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Q
from django.shortcuts import get_object_or_404

from .models import WikiSpace, WikiPage, WikiPageVersion, WikiTag, WikiAttachment
from .serializers import (
    WikiSpaceListSerializer, WikiSpaceDetailSerializer, WikiSpaceCreateSerializer,
    WikiPageListSerializer, WikiPageDetailSerializer, WikiPageCreateSerializer,
    WikiPageUpdateSerializer, WikiPageVersionSerializer, WikiPageTreeSerializer,
    WikiTagSerializer, WikiAttachmentSerializer
)
from .permissions import WikiSpacePermission, WikiPagePermission, WikiTagPermission


class WikiSpaceViewSet(viewsets.ModelViewSet):
    """ViewSet для пространств Wiki"""
    permission_classes = [WikiSpacePermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'order', 'created_at']
    ordering = ['order', 'name']
    pagination_class = None

    def get_queryset(self):
        user = self.request.user
        queryset = WikiSpace.objects.all()

        if not user.is_superuser:
            # Фильтруем по доступу
            queryset = queryset.filter(
                Q(is_public=True) |
                Q(owner=user) |
                Q(department=user.department) |
                Q(allowed_departments=user.department) |
                Q(allowed_roles__in=user.roles.all())
            ).distinct()

        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return WikiSpaceListSerializer
        return WikiSpaceDetailSerializer

    def create(self, request, *args, **kwargs):
        """Создание пространства с возвратом детального сериализатора"""
        serializer = WikiSpaceCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        space = serializer.save()
        detail_serializer = WikiSpaceDetailSerializer(space)
        return Response(detail_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def tree(self, request, pk=None):
        """Получить дерево страниц пространства"""
        space = self.get_object()
        root_pages = space.pages.filter(parent__isnull=True, is_archived=False).order_by('order', 'title')
        serializer = WikiPageTreeSerializer(root_pages, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def pages(self, request, pk=None):
        """Получить все страницы пространства (плоский список)"""
        space = self.get_object()
        pages = space.pages.filter(is_archived=False).order_by('order', 'title')

        # Фильтрация
        search = request.query_params.get('search', '')
        if search:
            pages = pages.filter(
                Q(title__icontains=search) |
                Q(excerpt__icontains=search)
            )

        tag = request.query_params.get('tag', '')
        if tag:
            pages = pages.filter(tags__slug=tag)

        serializer = WikiPageListSerializer(pages, many=True)
        return Response(serializer.data)


class WikiPageViewSet(viewsets.ModelViewSet):
    """ViewSet для страниц Wiki"""
    permission_classes = [WikiPagePermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'excerpt']
    ordering_fields = ['title', 'order', 'created_at', 'updated_at', 'view_count']
    ordering = ['order', 'title']
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    pagination_class = None

    def get_queryset(self):
        user = self.request.user
        queryset = WikiPage.objects.select_related('space', 'author', 'parent').prefetch_related('tags')

        # Фильтр по доступным пространствам
        if not user.is_superuser:
            accessible_spaces = WikiSpace.objects.filter(
                Q(is_public=True) |
                Q(owner=user) |
                Q(department=user.department) |
                Q(allowed_departments=user.department) |
                Q(allowed_roles__in=user.roles.all())
            ).distinct()
            queryset = queryset.filter(space__in=accessible_spaces)

        # Фильтр по пространству
        space_id = self.request.query_params.get('space')
        if space_id:
            queryset = queryset.filter(space_id=space_id)

        space_slug = self.request.query_params.get('space_slug')
        if space_slug:
            queryset = queryset.filter(space__slug=space_slug)

        # Фильтр по архивным
        show_archived = self.request.query_params.get('archived', 'false').lower() == 'true'
        if not show_archived:
            queryset = queryset.filter(is_archived=False)

        # Фильтр по тегу
        tag = self.request.query_params.get('tag')
        if tag:
            queryset = queryset.filter(tags__slug=tag)

        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return WikiPageListSerializer
        return WikiPageDetailSerializer

    def create(self, request, *args, **kwargs):
        """Создание страницы с возвратом детального сериализатора"""
        serializer = WikiPageCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        page = serializer.save()
        detail_serializer = WikiPageDetailSerializer(page)
        return Response(detail_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Обновление страницы с возвратом детального сериализатора"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = WikiPageUpdateSerializer(instance, data=request.data, partial=partial, context={'request': request})
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}

        # Возвращаем детальный сериализатор
        detail_serializer = WikiPageDetailSerializer(instance)
        return Response(detail_serializer.data)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Увеличиваем счетчик просмотров
        WikiPage.objects.filter(pk=instance.pk).update(view_count=instance.view_count + 1)
        instance.refresh_from_db()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_slug(self, request):
        """Получить страницу по slug пространства и страницы"""
        space_slug = request.query_params.get('space')
        page_slug = request.query_params.get('page')

        if not space_slug or not page_slug:
            return Response(
                {'detail': 'Требуются параметры space и page'},
                status=status.HTTP_400_BAD_REQUEST
            )

        page = get_object_or_404(
            WikiPage,
            space__slug=space_slug,
            slug=page_slug,
            is_archived=False
        )

        # Проверяем доступ
        if not page.space.user_has_access(request.user):
            return Response(
                {'detail': 'Нет доступа к этой странице'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Увеличиваем счетчик просмотров
        WikiPage.objects.filter(pk=page.pk).update(view_count=page.view_count + 1)
        page.refresh_from_db()

        serializer = WikiPageDetailSerializer(page)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def versions(self, request, pk=None):
        """Получить историю версий страницы"""
        page = self.get_object()
        versions = page.versions.all().order_by('-version_number')
        serializer = WikiPageVersionSerializer(versions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def restore_version(self, request, pk=None):
        """Восстановить версию страницы"""
        page = self.get_object()
        version_number = request.data.get('version_number')

        if not version_number:
            return Response(
                {'detail': 'Требуется номер версии'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            version = page.versions.get(version_number=version_number)
        except WikiPageVersion.DoesNotExist:
            return Response(
                {'detail': 'Версия не найдена'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Восстанавливаем контент
        page._updated_by = request.user
        page._change_summary = f'Восстановление версии {version_number}'
        page.title = version.title
        page.content = version.content
        page.save()

        serializer = WikiPageDetailSerializer(page)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def move(self, request, pk=None):
        """Переместить страницу"""
        page = self.get_object()

        new_parent_id = request.data.get('parent_id')
        new_space_id = request.data.get('space_id')
        new_order = request.data.get('order')

        if new_parent_id is not None:
            if new_parent_id:
                try:
                    new_parent = WikiPage.objects.get(pk=new_parent_id)
                    # Проверяем, что не перемещаем в потомка
                    if page.pk == new_parent.pk:
                        return Response(
                            {'detail': 'Нельзя переместить страницу в саму себя'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    page.parent = new_parent
                except WikiPage.DoesNotExist:
                    return Response(
                        {'detail': 'Родительская страница не найдена'},
                        status=status.HTTP_404_NOT_FOUND
                    )
            else:
                page.parent = None

        if new_space_id:
            try:
                new_space = WikiSpace.objects.get(pk=new_space_id)
                if not new_space.user_has_access(request.user):
                    return Response(
                        {'detail': 'Нет доступа к целевому пространству'},
                        status=status.HTTP_403_FORBIDDEN
                    )
                page.space = new_space
                page.parent = None  # При смене пространства убираем родителя
            except WikiSpace.DoesNotExist:
                return Response(
                    {'detail': 'Пространство не найдено'},
                    status=status.HTTP_404_NOT_FOUND
                )

        if new_order is not None:
            page.order = new_order

        page.save()
        serializer = WikiPageDetailSerializer(page)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_attachment(self, request, pk=None):
        """Загрузить вложение к странице"""
        page = self.get_object()
        file = request.FILES.get('file')

        if not file:
            return Response(
                {'detail': 'Файл не предоставлен'},
                status=status.HTTP_400_BAD_REQUEST
            )

        attachment = WikiAttachment.objects.create(
            page=page,
            uploaded_by=request.user,
            file=file,
            filename=file.name,
            size=file.size,
            mime_type=file.content_type or ''
        )

        serializer = WikiAttachmentSerializer(attachment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Полнотекстовый поиск по страницам"""
        query = request.query_params.get('q', '').strip()
        if len(query) < 2:
            return Response([])

        user = request.user
        queryset = self.get_queryset()

        # Поиск по заголовку, excerpt и контенту
        results = queryset.filter(
            Q(title__icontains=query) |
            Q(excerpt__icontains=query)
        ).distinct()[:20]

        # TODO: Для поиска по контенту Editor.js нужен отдельный механизм
        # (например, PostgreSQL FTS или Elasticsearch)

        serializer = WikiPageListSerializer(results, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Недавно обновленные страницы"""
        queryset = self.get_queryset().order_by('-updated_at')[:10]
        serializer = WikiPageListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Популярные страницы"""
        queryset = self.get_queryset().order_by('-view_count')[:10]
        serializer = WikiPageListSerializer(queryset, many=True)
        return Response(serializer.data)


class WikiTagViewSet(viewsets.ModelViewSet):
    """ViewSet для тегов Wiki"""
    queryset = WikiTag.objects.all()
    serializer_class = WikiTagSerializer
    permission_classes = [WikiTagPermission]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']
    pagination_class = None

    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Популярные теги (по количеству страниц)"""
        from django.db.models import Count
        tags = WikiTag.objects.annotate(
            pages_count=Count('pages', filter=Q(pages__is_archived=False))
        ).order_by('-pages_count')[:20]
        serializer = self.get_serializer(tags, many=True)
        return Response(serializer.data)


class WikiAttachmentViewSet(viewsets.ModelViewSet):
    """ViewSet для вложений Wiki"""
    queryset = WikiAttachment.objects.all()
    serializer_class = WikiAttachmentSerializer
    permission_classes = [WikiPagePermission]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        queryset = WikiAttachment.objects.select_related('page', 'uploaded_by')

        page_id = self.request.query_params.get('page')
        if page_id:
            queryset = queryset.filter(page_id=page_id)

        return queryset

    def perform_create(self, serializer):
        file = self.request.FILES.get('file')
        serializer.save(
            uploaded_by=self.request.user,
            filename=file.name if file else '',
            size=file.size if file else 0,
            mime_type=file.content_type if file else ''
        )
