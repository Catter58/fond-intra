"""
Views for audit app.
"""
import csv
from django.http import HttpResponse
from rest_framework import filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView, RetrieveAPIView
from django_filters.rest_framework import DjangoFilterBackend

from .models import AuditLog
from .serializers import AuditLogSerializer, AuditLogListSerializer
from .permissions import CanViewAudit, CanExportAudit


class AuditLogListView(ListAPIView):
    """List audit logs with filtering."""
    serializer_class = AuditLogListSerializer
    permission_classes = [IsAuthenticated, CanViewAudit]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['action', 'entity_type', 'user']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        return AuditLog.objects.select_related('user')


class AuditLogDetailView(RetrieveAPIView):
    """Get audit log detail."""
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, CanViewAudit]
    queryset = AuditLog.objects.select_related('user')


class EntityAuditView(ListAPIView):
    """Get audit history for specific entity."""
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, CanViewAudit]

    def get_queryset(self):
        entity_type = self.kwargs.get('entity_type')
        entity_id = self.kwargs.get('entity_id')
        return AuditLog.objects.filter(
            entity_type=entity_type,
            entity_id=entity_id
        ).select_related('user')


class UserAuditView(ListAPIView):
    """Get audit history for specific user's actions."""
    serializer_class = AuditLogListSerializer
    permission_classes = [IsAuthenticated, CanViewAudit]

    def get_queryset(self):
        user_id = self.kwargs.get('user_id')
        return AuditLog.objects.filter(
            user_id=user_id
        ).select_related('user')


class AuditExportView(APIView):
    """Export audit logs to CSV."""
    permission_classes = [IsAuthenticated, CanExportAudit]

    def get(self, request):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="audit_log.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'ID', 'User', 'Action', 'Entity Type', 'Entity ID',
            'Entity', 'IP Address', 'Created At'
        ])

        logs = AuditLog.objects.select_related('user')

        # Apply filters
        action = request.query_params.get('action')
        if action:
            logs = logs.filter(action=action)

        entity_type = request.query_params.get('entity_type')
        if entity_type:
            logs = logs.filter(entity_type=entity_type)

        user_id = request.query_params.get('user')
        if user_id:
            logs = logs.filter(user_id=user_id)

        for log in logs[:10000]:  # Limit export
            writer.writerow([
                log.id,
                log.user.get_full_name() if log.user else 'System',
                log.get_action_display(),
                log.entity_type,
                log.entity_id,
                log.entity_repr,
                log.ip_address,
                log.created_at.isoformat()
            ])

        return response
