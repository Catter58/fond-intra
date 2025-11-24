"""
Classifieds views.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Q

from .models import ClassifiedCategory, Classified, ClassifiedImage
from .serializers import (
    ClassifiedCategorySerializer,
    ClassifiedListSerializer,
    ClassifiedDetailSerializer,
    ClassifiedCreateSerializer,
    ClassifiedImageSerializer,
)


class ClassifiedCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for classified categories (read-only)."""

    queryset = ClassifiedCategory.objects.filter(is_active=True)
    serializer_class = ClassifiedCategorySerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None


class ClassifiedViewSet(viewsets.ModelViewSet):
    """ViewSet for classifieds."""

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        queryset = Classified.objects.select_related('author', 'category', 'author__department').prefetch_related('images')

        # Filter by status (default: active only)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        elif self.action == 'list':
            queryset = queryset.filter(status='active')

        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category_id=category)

        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )

        # My classifieds
        if self.request.query_params.get('my') == 'true':
            queryset = queryset.filter(author=self.request.user)

        # Ordering
        ordering = self.request.query_params.get('ordering', '-created_at')
        if ordering in ['-created_at', 'created_at', '-price', 'price', '-views_count']:
            queryset = queryset.order_by(ordering)

        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return ClassifiedListSerializer
        if self.action == 'retrieve':
            return ClassifiedDetailSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return ClassifiedCreateSerializer
        return ClassifiedListSerializer

    def retrieve(self, request, *args, **kwargs):
        """Get classified and increment views."""
        instance = self.get_object()
        # Only increment if not the author
        if instance.author != request.user:
            instance.increment_views()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        """Update classified (only by author)."""
        instance = self.get_object()
        if instance.author != request.user and not request.user.is_superuser:
            return Response(
                {'detail': 'Вы можете редактировать только свои объявления'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Delete classified (only by author or admin)."""
        instance = self.get_object()
        if instance.author != request.user and not request.user.is_superuser:
            return Response(
                {'detail': 'Вы можете удалять только свои объявления'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        """Close classified."""
        classified = self.get_object()
        if classified.author != request.user and not request.user.is_superuser:
            return Response(
                {'detail': 'Вы можете закрывать только свои объявления'},
                status=status.HTTP_403_FORBIDDEN
            )
        classified.close()
        return Response(ClassifiedDetailSerializer(classified).data)

    @action(detail=True, methods=['post'])
    def extend(self, request, pk=None):
        """Extend classified expiration."""
        classified = self.get_object()
        if classified.author != request.user:
            return Response(
                {'detail': 'Вы можете продлевать только свои объявления'},
                status=status.HTTP_403_FORBIDDEN
            )
        days = request.data.get('days', 30)
        classified.extend(days=int(days))
        return Response(ClassifiedDetailSerializer(classified).data)

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_image(self, request, pk=None):
        """Upload image to classified."""
        classified = self.get_object()
        if classified.author != request.user:
            return Response(
                {'detail': 'Вы можете добавлять изображения только к своим объявлениям'},
                status=status.HTTP_403_FORBIDDEN
            )

        if 'image' not in request.FILES:
            return Response(
                {'detail': 'Изображение не предоставлено'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check max images (limit to 5)
        if classified.images.count() >= 5:
            return Response(
                {'detail': 'Максимум 5 изображений на объявление'},
                status=status.HTTP_400_BAD_REQUEST
            )

        order = classified.images.count()
        image = ClassifiedImage.objects.create(
            classified=classified,
            image=request.FILES['image'],
            order=order
        )
        return Response(ClassifiedImageSerializer(image).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path='images/(?P<image_id>[^/.]+)')
    def delete_image(self, request, pk=None, image_id=None):
        """Delete image from classified."""
        classified = self.get_object()
        if classified.author != request.user:
            return Response(
                {'detail': 'Вы можете удалять изображения только из своих объявлений'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            image = classified.images.get(id=image_id)
            image.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ClassifiedImage.DoesNotExist:
            return Response(
                {'detail': 'Изображение не найдено'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def my(self, request):
        """Get current user's classifieds."""
        queryset = Classified.objects.filter(author=request.user).select_related('category').prefetch_related('images')
        serializer = ClassifiedListSerializer(queryset, many=True)
        return Response(serializer.data)
