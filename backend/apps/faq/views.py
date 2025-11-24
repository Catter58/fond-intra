"""
FAQ views.
"""
from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q

from .models import FAQCategory, FAQItem
from .serializers import (
    FAQCategorySerializer,
    FAQCategoryWithItemsSerializer,
    FAQCategoryCreateSerializer,
    FAQItemSerializer,
    FAQItemCreateSerializer,
)


class FAQCategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for FAQ categories."""

    queryset = FAQCategory.objects.filter(is_active=True)
    permission_classes = [IsAuthenticated]
    pagination_class = None  # Few categories, no pagination needed

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return FAQCategoryCreateSerializer
        if self.action == 'with_items':
            return FAQCategoryWithItemsSerializer
        return FAQCategorySerializer

    def get_queryset(self):
        queryset = FAQCategory.objects.all()
        if self.action in ['list', 'retrieve', 'with_items']:
            # Non-admin users see only active categories
            user = self.request.user
            if not (user.is_superuser or (user.role and user.role.is_admin)):
                queryset = queryset.filter(is_active=True)
        return queryset.order_by('order', 'name')

    @action(detail=False, methods=['get'])
    def with_items(self, request):
        """Get all categories with their items."""
        queryset = self.get_queryset()
        serializer = FAQCategoryWithItemsSerializer(queryset, many=True)
        return Response(serializer.data)


class FAQItemViewSet(viewsets.ModelViewSet):
    """ViewSet for FAQ items."""

    queryset = FAQItem.objects.filter(is_published=True)
    permission_classes = [IsAuthenticated]
    pagination_class = None  # FAQ items are limited per category

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return FAQItemCreateSerializer
        return FAQItemSerializer

    def get_queryset(self):
        queryset = FAQItem.objects.select_related('category')
        user = self.request.user

        # Non-admin users see only published items
        if not (user.is_superuser or (user.role and user.role.is_admin)):
            queryset = queryset.filter(is_published=True, category__is_active=True)

        # Filter by category
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)

        return queryset.order_by('category__order', 'order', 'question')

    def retrieve(self, request, *args, **kwargs):
        """Get item and increment views."""
        instance = self.get_object()
        instance.increment_views()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search FAQ items."""
        query = request.query_params.get('q', '').strip()
        if len(query) < 2:
            return Response([])

        queryset = self.get_queryset().filter(
            Q(question__icontains=query) | Q(answer__icontains=query)
        )[:20]

        serializer = FAQItemSerializer(queryset, many=True)
        return Response(serializer.data)
