from rest_framework import serializers
from django.utils import timezone
from datetime import datetime, timedelta
from .models import ResourceType, Resource, Booking


class ResourceTypeSerializer(serializers.ModelSerializer):
    """Сериализатор типа ресурса"""
    resources_count = serializers.SerializerMethodField()

    class Meta:
        model = ResourceType
        fields = [
            'id', 'name', 'slug', 'icon', 'description',
            'is_active', 'order', 'resources_count'
        ]
        read_only_fields = ['id']

    def get_resources_count(self, obj):
        return obj.resources.filter(is_active=True).count()


class ResourceListSerializer(serializers.ModelSerializer):
    """Сериализатор списка ресурсов"""
    type_name = serializers.CharField(source='type.name', read_only=True)
    type_slug = serializers.CharField(source='type.slug', read_only=True)

    class Meta:
        model = Resource
        fields = [
            'id', 'name', 'description', 'location', 'capacity',
            'amenities', 'image', 'type', 'type_name', 'type_slug',
            'is_active', 'work_hours_start', 'work_hours_end',
            'min_booking_duration', 'max_booking_duration'
        ]


class ResourceDetailSerializer(serializers.ModelSerializer):
    """Детальный сериализатор ресурса"""
    type = ResourceTypeSerializer(read_only=True)
    upcoming_bookings = serializers.SerializerMethodField()

    class Meta:
        model = Resource
        fields = [
            'id', 'name', 'description', 'location', 'capacity',
            'amenities', 'image', 'type', 'is_active',
            'work_hours_start', 'work_hours_end',
            'min_booking_duration', 'max_booking_duration',
            'upcoming_bookings', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_upcoming_bookings(self, obj):
        now = timezone.now()
        bookings = obj.bookings.filter(
            status=Booking.Status.CONFIRMED,
            ends_at__gte=now
        ).order_by('starts_at')[:5]
        return BookingListSerializer(bookings, many=True).data


class ResourceCreateUpdateSerializer(serializers.ModelSerializer):
    """Сериализатор создания/обновления ресурса"""

    class Meta:
        model = Resource
        fields = [
            'id', 'name', 'description', 'location', 'capacity',
            'amenities', 'image', 'type', 'is_active',
            'work_hours_start', 'work_hours_end',
            'min_booking_duration', 'max_booking_duration'
        ]
        read_only_fields = ['id']

    def validate_type(self, value):
        if not value:
            raise serializers.ValidationError('Выберите тип ресурса')
        return value


class BookingUserSerializer(serializers.Serializer):
    """Краткий сериализатор пользователя для бронирования"""
    id = serializers.IntegerField()
    full_name = serializers.SerializerMethodField()
    avatar = serializers.ImageField()
    department_name = serializers.SerializerMethodField()

    def get_full_name(self, obj):
        return obj.get_full_name() if obj else None

    def get_department_name(self, obj):
        if obj and obj.department:
            return obj.department.name
        return None


class BookingListSerializer(serializers.ModelSerializer):
    """Сериализатор списка бронирований"""
    user = BookingUserSerializer(read_only=True)
    resource_name = serializers.CharField(source='resource.name', read_only=True)
    resource_type = serializers.CharField(source='resource.type.name', read_only=True)
    duration_minutes = serializers.IntegerField(read_only=True)
    is_past = serializers.BooleanField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'title', 'description', 'resource', 'resource_name',
            'resource_type', 'user', 'starts_at', 'ends_at', 'status',
            'duration_minutes', 'is_past', 'is_active', 'is_recurring',
            'created_at'
        ]


class BookingDetailSerializer(serializers.ModelSerializer):
    """Детальный сериализатор бронирования"""
    user = BookingUserSerializer(read_only=True)
    resource = ResourceListSerializer(read_only=True)
    resource_id = serializers.IntegerField(write_only=True)
    duration_minutes = serializers.IntegerField(read_only=True)
    is_past = serializers.BooleanField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'title', 'description', 'resource', 'resource_id',
            'user', 'starts_at', 'ends_at', 'status',
            'duration_minutes', 'is_past', 'is_active',
            'is_recurring', 'recurrence_rule', 'parent_booking',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class BookingCreateSerializer(serializers.ModelSerializer):
    """Сериализатор создания бронирования"""

    class Meta:
        model = Booking
        fields = [
            'title', 'description', 'resource', 'starts_at', 'ends_at',
            'is_recurring', 'recurrence_rule'
        ]

    def validate(self, attrs):
        resource = attrs.get('resource')
        starts_at = attrs.get('starts_at')
        ends_at = attrs.get('ends_at')

        if starts_at >= ends_at:
            raise serializers.ValidationError({
                'ends_at': 'Время окончания должно быть позже времени начала'
            })

        # Проверка что бронирование не в прошлом
        if starts_at < timezone.now():
            raise serializers.ValidationError({
                'starts_at': 'Нельзя создать бронирование в прошлом'
            })

        # Проверка рабочих часов
        start_time = starts_at.time()
        end_time = ends_at.time()

        if start_time < resource.work_hours_start or end_time > resource.work_hours_end:
            raise serializers.ValidationError({
                'starts_at': f'Бронирование должно быть в рабочие часы: {resource.work_hours_start}-{resource.work_hours_end}'
            })

        # Проверка длительности
        duration = (ends_at - starts_at).total_seconds() / 60
        if duration < resource.min_booking_duration:
            raise serializers.ValidationError({
                'ends_at': f'Минимальная длительность: {resource.min_booking_duration} мин.'
            })
        if duration > resource.max_booking_duration:
            raise serializers.ValidationError({
                'ends_at': f'Максимальная длительность: {resource.max_booking_duration} мин.'
            })

        # Проверка пересечений
        overlapping = Booking.objects.filter(
            resource=resource,
            status=Booking.Status.CONFIRMED,
            starts_at__lt=ends_at,
            ends_at__gt=starts_at
        )
        if overlapping.exists():
            raise serializers.ValidationError({
                'starts_at': 'Это время уже занято'
            })

        return attrs


class TimeSlotSerializer(serializers.Serializer):
    """Сериализатор временного слота"""
    start = serializers.DateTimeField()
    end = serializers.DateTimeField()
    is_available = serializers.BooleanField()
    booking_id = serializers.IntegerField(allow_null=True)
    booking_title = serializers.CharField(allow_null=True)
    booking_user = serializers.CharField(allow_null=True)


class AvailabilitySerializer(serializers.Serializer):
    """Сериализатор доступности ресурса на день"""
    date = serializers.DateField()
    resource_id = serializers.IntegerField()
    resource_name = serializers.CharField()
    work_hours_start = serializers.TimeField()
    work_hours_end = serializers.TimeField()
    slots = TimeSlotSerializer(many=True)


class CalendarBookingSerializer(serializers.ModelSerializer):
    """Сериализатор бронирования для календаря"""
    resource_name = serializers.CharField(source='resource.name', read_only=True)
    user_name = serializers.SerializerMethodField()
    color = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            'id', 'title', 'resource', 'resource_name',
            'starts_at', 'ends_at', 'user_name', 'color'
        ]

    def get_user_name(self, obj):
        if obj.user:
            return obj.user.get_full_name()
        return None

    def get_color(self, obj):
        # Цвет на основе типа ресурса
        colors = {
            'meeting_room': '#0f62fe',  # синий
            'equipment': '#a56eff',     # фиолетовый
            'workplace': '#198038',     # зелёный
            'parking': '#eb6200',       # оранжевый
        }
        return colors.get(obj.resource.type.slug, '#8a3ffc')
