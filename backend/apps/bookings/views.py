from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q
from datetime import datetime, timedelta
from .models import ResourceType, Resource, Booking
from .serializers import (
    ResourceTypeSerializer,
    ResourceListSerializer,
    ResourceDetailSerializer,
    ResourceCreateUpdateSerializer,
    BookingListSerializer,
    BookingDetailSerializer,
    BookingCreateSerializer,
    AvailabilitySerializer,
    CalendarBookingSerializer,
)


class ResourceTypeViewSet(viewsets.ModelViewSet):
    """ViewSet для типов ресурсов"""
    queryset = ResourceType.objects.filter(is_active=True)
    serializer_class = ResourceTypeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        # Админы видят все типы, остальные только активные
        if self.request.user.is_staff or (hasattr(self.request.user, 'role') and self.request.user.role and self.request.user.role.is_admin):
            queryset = ResourceType.objects.all()
        return queryset.order_by('order', 'name')


class ResourceViewSet(viewsets.ModelViewSet):
    """ViewSet для ресурсов"""
    queryset = Resource.objects.filter(is_active=True)
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return ResourceListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return ResourceCreateUpdateSerializer
        return ResourceDetailSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        # Фильтрация по типу
        type_id = self.request.query_params.get('type')
        if type_id:
            queryset = queryset.filter(type_id=type_id)

        type_slug = self.request.query_params.get('type_slug')
        if type_slug:
            queryset = queryset.filter(type__slug=type_slug)

        # Фильтрация по вместимости
        min_capacity = self.request.query_params.get('min_capacity')
        if min_capacity:
            queryset = queryset.filter(capacity__gte=int(min_capacity))

        # Поиск
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(location__icontains=search)
            )

        return queryset.select_related('type').order_by('type', 'name')

    @action(detail=True, methods=['get'])
    def availability(self, request, pk=None):
        """Получить доступность ресурса на определенную дату"""
        resource = self.get_object()
        date_str = request.query_params.get('date')

        if not date_str:
            date = timezone.now().date()
        else:
            try:
                date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': 'Неверный формат даты. Используйте YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Получить все бронирования на эту дату
        day_start = timezone.make_aware(datetime.combine(date, resource.work_hours_start))
        day_end = timezone.make_aware(datetime.combine(date, resource.work_hours_end))

        bookings = Booking.objects.filter(
            resource=resource,
            status=Booking.Status.CONFIRMED,
            starts_at__lt=day_end,
            ends_at__gt=day_start
        ).order_by('starts_at')

        # Формируем слоты
        slots = []
        current_time = day_start
        slot_duration = timedelta(minutes=30)  # 30-минутные слоты

        for booking in bookings:
            # Добавляем свободные слоты до бронирования
            while current_time + slot_duration <= booking.starts_at:
                slots.append({
                    'start': current_time,
                    'end': current_time + slot_duration,
                    'is_available': True,
                    'booking_id': None,
                    'booking_title': None,
                    'booking_user': None,
                })
                current_time += slot_duration

            # Добавляем занятый слот
            slots.append({
                'start': booking.starts_at,
                'end': booking.ends_at,
                'is_available': False,
                'booking_id': booking.id,
                'booking_title': booking.title,
                'booking_user': booking.user.get_full_name() if booking.user else None,
            })
            current_time = booking.ends_at

        # Добавляем оставшиеся свободные слоты
        while current_time + slot_duration <= day_end:
            slots.append({
                'start': current_time,
                'end': current_time + slot_duration,
                'is_available': True,
                'booking_id': None,
                'booking_title': None,
                'booking_user': None,
            })
            current_time += slot_duration

        data = {
            'date': date,
            'resource_id': resource.id,
            'resource_name': resource.name,
            'work_hours_start': resource.work_hours_start,
            'work_hours_end': resource.work_hours_end,
            'slots': slots,
        }

        return Response(AvailabilitySerializer(data).data)


class BookingViewSet(viewsets.ModelViewSet):
    """ViewSet для бронирований"""
    queryset = Booking.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return BookingCreateSerializer
        if self.action == 'list':
            return BookingListSerializer
        return BookingDetailSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        # Фильтрация по ресурсу
        resource_id = self.request.query_params.get('resource')
        if resource_id:
            queryset = queryset.filter(resource_id=resource_id)

        # Фильтрация по типу ресурса
        resource_type = self.request.query_params.get('resource_type')
        if resource_type:
            queryset = queryset.filter(resource__type_id=resource_type)

        # Фильтрация по статусу (по умолчанию скрываем отменённые)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        else:
            # By default, exclude cancelled bookings
            queryset = queryset.filter(status=Booking.Status.CONFIRMED)

        # Фильтрация по датам
        date_from = self.request.query_params.get('date_from')
        if date_from:
            queryset = queryset.filter(starts_at__date__gte=date_from)

        date_to = self.request.query_params.get('date_to')
        if date_to:
            queryset = queryset.filter(starts_at__date__lte=date_to)

        # Только предстоящие
        upcoming = self.request.query_params.get('upcoming')
        if upcoming == 'true':
            queryset = queryset.filter(ends_at__gte=timezone.now())

        return queryset.select_related(
            'resource', 'resource__type', 'user', 'user__department'
        ).order_by('starts_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def my(self, request):
        """Мои бронирования"""
        queryset = self.get_queryset().filter(
            user=request.user,
            status=Booking.Status.CONFIRMED  # Exclude cancelled bookings
        )

        # По умолчанию показываем только предстоящие
        if request.query_params.get('upcoming') != 'false':
            queryset = queryset.filter(ends_at__gte=timezone.now())

        queryset = queryset.order_by('starts_at')
        serializer = BookingListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def calendar(self, request):
        """Бронирования для календаря"""
        # Получить даты из параметров
        start_str = request.query_params.get('start')
        end_str = request.query_params.get('end')

        if not start_str or not end_str:
            return Response(
                {'error': 'Укажите start и end даты'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            start_date = datetime.strptime(start_str, '%Y-%m-%d')
            end_date = datetime.strptime(end_str, '%Y-%m-%d')
        except ValueError:
            return Response(
                {'error': 'Неверный формат даты. Используйте YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )

        queryset = Booking.objects.filter(
            status=Booking.Status.CONFIRMED,
            starts_at__date__lte=end_date,
            ends_at__date__gte=start_date
        ).select_related('resource', 'resource__type', 'user')

        # Фильтрация по ресурсу
        resource_id = request.query_params.get('resource')
        if resource_id:
            queryset = queryset.filter(resource_id=resource_id)

        # Фильтрация по типу ресурса
        resource_type = request.query_params.get('resource_type')
        if resource_type:
            queryset = queryset.filter(resource__type_id=resource_type)

        serializer = CalendarBookingSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Отменить бронирование"""
        booking = self.get_object()

        # Проверка прав
        is_admin = request.user.is_staff or (hasattr(request.user, 'role') and request.user.role and request.user.role.is_admin)
        if booking.user != request.user and not is_admin:
            return Response(
                {'error': 'Вы не можете отменить чужое бронирование'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Проверка что бронирование можно отменить
        if booking.status == Booking.Status.CANCELLED:
            return Response(
                {'error': 'Бронирование уже отменено'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if booking.is_past:
            return Response(
                {'error': 'Нельзя отменить прошедшее бронирование'},
                status=status.HTTP_400_BAD_REQUEST
            )

        booking.status = Booking.Status.CANCELLED
        booking.save(update_fields=['status', 'updated_at'])

        serializer = BookingDetailSerializer(booking)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def extend(self, request, pk=None):
        """Продлить бронирование"""
        booking = self.get_object()

        # Проверка прав
        if booking.user != request.user:
            return Response(
                {'error': 'Вы не можете продлить чужое бронирование'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Проверка статуса
        if booking.status != Booking.Status.CONFIRMED:
            return Response(
                {'error': 'Можно продлить только подтвержденное бронирование'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Получить новое время окончания
        new_end_str = request.data.get('ends_at')
        if not new_end_str:
            return Response(
                {'error': 'Укажите новое время окончания (ends_at)'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            new_ends_at = datetime.fromisoformat(new_end_str.replace('Z', '+00:00'))
            if timezone.is_naive(new_ends_at):
                new_ends_at = timezone.make_aware(new_ends_at)
        except ValueError:
            return Response(
                {'error': 'Неверный формат времени'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Проверить что новое время позже текущего
        if new_ends_at <= booking.ends_at:
            return Response(
                {'error': 'Новое время окончания должно быть позже текущего'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Проверить рабочие часы
        resource = booking.resource
        end_time = new_ends_at.time()
        if end_time > resource.work_hours_end:
            return Response(
                {'error': f'Время окончания должно быть не позже {resource.work_hours_end}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Проверить максимальную длительность
        duration = (new_ends_at - booking.starts_at).total_seconds() / 60
        if duration > resource.max_booking_duration:
            return Response(
                {'error': f'Максимальная длительность: {resource.max_booking_duration} мин.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Проверить пересечения с другими бронированиями
        overlapping = Booking.objects.filter(
            resource=resource,
            status=Booking.Status.CONFIRMED,
            starts_at__lt=new_ends_at,
            ends_at__gt=booking.ends_at
        ).exclude(pk=booking.pk)

        if overlapping.exists():
            return Response(
                {'error': 'Время уже занято другим бронированием'},
                status=status.HTTP_400_BAD_REQUEST
            )

        booking.ends_at = new_ends_at
        booking.save(update_fields=['ends_at', 'updated_at'])

        serializer = BookingDetailSerializer(booking)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Статистика бронирований"""
        now = timezone.now()
        today = now.date()
        week_start = today - timedelta(days=today.weekday())
        month_start = today.replace(day=1)

        # Общая статистика
        total_bookings = Booking.objects.filter(
            status=Booking.Status.CONFIRMED
        ).count()

        today_bookings = Booking.objects.filter(
            status=Booking.Status.CONFIRMED,
            starts_at__date=today
        ).count()

        week_bookings = Booking.objects.filter(
            status=Booking.Status.CONFIRMED,
            starts_at__date__gte=week_start
        ).count()

        month_bookings = Booking.objects.filter(
            status=Booking.Status.CONFIRMED,
            starts_at__date__gte=month_start
        ).count()

        # Мои бронирования
        my_upcoming = Booking.objects.filter(
            user=request.user,
            status=Booking.Status.CONFIRMED,
            ends_at__gte=now
        ).count()

        my_total = Booking.objects.filter(user=request.user).count()

        # Статистика по типам ресурсов
        resource_stats = []
        for resource_type in ResourceType.objects.filter(is_active=True):
            count = Booking.objects.filter(
                resource__type=resource_type,
                status=Booking.Status.CONFIRMED,
                starts_at__date__gte=month_start
            ).count()
            resource_stats.append({
                'type_id': resource_type.id,
                'type_name': resource_type.name,
                'type_slug': resource_type.slug,
                'bookings_count': count,
            })

        return Response({
            'total_bookings': total_bookings,
            'today_bookings': today_bookings,
            'week_bookings': week_bookings,
            'month_bookings': month_bookings,
            'my_upcoming': my_upcoming,
            'my_total': my_total,
            'by_resource_type': resource_stats,
        })
