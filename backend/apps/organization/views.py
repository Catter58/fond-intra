"""
Views for organization app.
"""
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet
from rest_framework.views import APIView

from apps.audit.models import AuditLog
from .models import Department, Position
from .serializers import (
    DepartmentSerializer,
    DepartmentCreateUpdateSerializer,
    DepartmentTreeSerializer,
    PositionSerializer,
    PositionCreateUpdateSerializer,
)
from .permissions import CanManageOrganization


class DepartmentViewSet(ModelViewSet):
    """CRUD for departments."""
    queryset = Department.objects.all().select_related('parent', 'head')
    permission_classes = [IsAuthenticated]
    pagination_class = None  # Few departments, no pagination needed

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return DepartmentCreateUpdateSerializer
        return DepartmentSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), CanManageOrganization()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        department = serializer.save()
        AuditLog.log(
            user=self.request.user,
            action=AuditLog.Action.CREATE,
            entity_type='Department',
            entity_id=department.id,
            entity_repr=str(department),
            new_values=serializer.validated_data,
            ip_address=getattr(self.request, 'audit_ip', None),
            user_agent=getattr(self.request, 'audit_user_agent', '')
        )

    def perform_update(self, serializer):
        old_values = DepartmentSerializer(self.get_object()).data
        department = serializer.save()
        AuditLog.log(
            user=self.request.user,
            action=AuditLog.Action.UPDATE,
            entity_type='Department',
            entity_id=department.id,
            entity_repr=str(department),
            old_values=old_values,
            new_values=serializer.validated_data,
            ip_address=getattr(self.request, 'audit_ip', None),
            user_agent=getattr(self.request, 'audit_user_agent', '')
        )

    def perform_destroy(self, instance):
        AuditLog.log(
            user=self.request.user,
            action=AuditLog.Action.DELETE,
            entity_type='Department',
            entity_id=instance.id,
            entity_repr=str(instance),
            ip_address=getattr(self.request, 'audit_ip', None),
            user_agent=getattr(self.request, 'audit_user_agent', '')
        )
        instance.delete()


class PositionViewSet(ModelViewSet):
    """CRUD for positions."""
    queryset = Position.objects.all()
    permission_classes = [IsAuthenticated]
    pagination_class = None  # Few positions, no pagination needed

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return PositionCreateUpdateSerializer
        return PositionSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), CanManageOrganization()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        position = serializer.save()
        AuditLog.log(
            user=self.request.user,
            action=AuditLog.Action.CREATE,
            entity_type='Position',
            entity_id=position.id,
            entity_repr=str(position),
            new_values=serializer.validated_data,
            ip_address=getattr(self.request, 'audit_ip', None),
            user_agent=getattr(self.request, 'audit_user_agent', '')
        )


class OrganizationTreeView(APIView):
    """Get organization tree structure."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get root departments (no parent)
        root_departments = Department.objects.filter(
            parent__isnull=True
        ).select_related('head').prefetch_related('children')

        serializer = DepartmentTreeSerializer(root_departments, many=True)
        return Response(serializer.data)
