"""
Views for notifications app.
"""
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView

from core.pagination import SmallPagination
from .models import Notification, NotificationSettings
from .serializers import NotificationSerializer, NotificationSettingsSerializer


class NotificationListView(ListAPIView):
    """List user's notifications."""
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = SmallPagination

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


class UnreadCountView(APIView):
    """Get count of unread notifications."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(
            user=request.user,
            is_read=False
        ).count()
        return Response({'count': count})


class MarkAsReadView(APIView):
    """Mark notification as read."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            notification = Notification.objects.get(
                pk=pk,
                user=request.user
            )
            notification.mark_as_read()
            return Response({'detail': 'Marked as read.'})
        except Notification.DoesNotExist:
            return Response(
                {'detail': 'Notification not found.'},
                status=status.HTTP_404_NOT_FOUND
            )


class MarkAllAsReadView(APIView):
    """Mark all notifications as read."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(
            user=request.user,
            is_read=False
        ).update(is_read=True)
        return Response({'detail': 'All notifications marked as read.'})


class NotificationSettingsView(APIView):
    """Get and update notification settings."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        settings, _ = NotificationSettings.objects.get_or_create(
            user=request.user
        )
        serializer = NotificationSettingsSerializer(settings)
        return Response(serializer.data)

    def put(self, request):
        settings, _ = NotificationSettings.objects.get_or_create(
            user=request.user
        )
        serializer = NotificationSettingsSerializer(settings, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def patch(self, request):
        settings, _ = NotificationSettings.objects.get_or_create(
            user=request.user
        )
        serializer = NotificationSettingsSerializer(
            settings,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
