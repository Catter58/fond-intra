"""
Views for roles app.
"""
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.audit.models import AuditLog
from .models import Permission, Role
from .serializers import (
    PermissionSerializer,
    RoleSerializer,
    RoleListSerializer,
    RoleCreateUpdateSerializer,
)
from .permissions import CanManageRoles


class PermissionListView(APIView):
    """List all available permissions."""
    permission_classes = [IsAuthenticated, CanManageRoles]

    def get(self, request):
        permissions = Permission.objects.all()
        serializer = PermissionSerializer(permissions, many=True)
        return Response(serializer.data)


class RoleViewSet(ModelViewSet):
    """CRUD for roles."""
    queryset = Role.objects.all().prefetch_related('permissions')
    permission_classes = [IsAuthenticated, CanManageRoles]

    def get_serializer_class(self):
        if self.action == 'list':
            return RoleListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return RoleCreateUpdateSerializer
        return RoleSerializer

    def perform_create(self, serializer):
        role = serializer.save()
        AuditLog.log(
            user=self.request.user,
            action=AuditLog.Action.CREATE,
            entity_type='Role',
            entity_id=role.id,
            entity_repr=str(role),
            ip_address=getattr(self.request, 'audit_ip', None),
            user_agent=getattr(self.request, 'audit_user_agent', '')
        )

    def perform_update(self, serializer):
        role = serializer.save()
        AuditLog.log(
            user=self.request.user,
            action=AuditLog.Action.UPDATE,
            entity_type='Role',
            entity_id=role.id,
            entity_repr=str(role),
            ip_address=getattr(self.request, 'audit_ip', None),
            user_agent=getattr(self.request, 'audit_user_agent', '')
        )

    def destroy(self, request, *args, **kwargs):
        role = self.get_object()
        if role.is_system:
            return Response(
                {'detail': 'System roles cannot be deleted.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'], url_path='assign/(?P<user_id>[^/.]+)')
    def assign(self, request, pk=None, user_id=None):
        """Assign role to user."""
        role = self.get_object()
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response(
                {'detail': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        user.roles.add(role)

        AuditLog.log(
            user=request.user,
            action=AuditLog.Action.UPDATE,
            entity_type='User',
            entity_id=user.id,
            entity_repr=f"Assigned role {role.name} to {user}",
            ip_address=getattr(request, 'audit_ip', None),
            user_agent=getattr(request, 'audit_user_agent', '')
        )

        return Response({'detail': f'Role {role.name} assigned to {user}.'})

    @action(detail=True, methods=['post'], url_path='revoke/(?P<user_id>[^/.]+)')
    def revoke(self, request, pk=None, user_id=None):
        """Revoke role from user."""
        role = self.get_object()
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response(
                {'detail': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        user.roles.remove(role)

        AuditLog.log(
            user=request.user,
            action=AuditLog.Action.UPDATE,
            entity_type='User',
            entity_id=user.id,
            entity_repr=f"Revoked role {role.name} from {user}",
            ip_address=getattr(request, 'audit_ip', None),
            user_agent=getattr(request, 'audit_user_agent', '')
        )

        return Response({'detail': f'Role {role.name} revoked from {user}.'})
