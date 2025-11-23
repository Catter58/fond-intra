"""
Audit URLs (under /api/v1/admin/audit/).
"""
from django.urls import path

from apps.audit.views import (
    AuditLogListView,
    AuditLogDetailView,
    EntityAuditView,
    UserAuditView,
    AuditExportView,
)

urlpatterns = [
    path('', AuditLogListView.as_view(), name='audit-list'),
    path('export/', AuditExportView.as_view(), name='audit-export'),
    path('<int:pk>/', AuditLogDetailView.as_view(), name='audit-detail'),
    path('entity/<str:entity_type>/<int:entity_id>/', EntityAuditView.as_view(), name='entity-audit'),
    path('user/<int:user_id>/', UserAuditView.as_view(), name='user-audit'),
]
