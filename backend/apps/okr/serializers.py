from rest_framework import serializers
from .models import OKRPeriod, Objective, KeyResult, CheckIn


class OKRPeriodSerializer(serializers.ModelSerializer):
    """Сериализатор периода OKR"""

    class Meta:
        model = OKRPeriod
        fields = [
            'id', 'name', 'type', 'starts_at', 'ends_at',
            'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class CheckInSerializer(serializers.ModelSerializer):
    """Сериализатор check-in"""
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = CheckIn
        fields = [
            'id', 'key_result', 'author', 'author_name',
            'previous_value', 'new_value', 'previous_progress',
            'new_progress', 'comment', 'created_at'
        ]
        read_only_fields = ['id', 'author', 'author_name', 'previous_value',
                           'previous_progress', 'created_at']

    def get_author_name(self, obj):
        if obj.author:
            return obj.author.get_full_name()
        return None


class CheckInCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания check-in"""

    class Meta:
        model = CheckIn
        fields = ['new_value', 'comment']


class KeyResultSerializer(serializers.ModelSerializer):
    """Сериализатор ключевого результата"""
    check_ins_count = serializers.SerializerMethodField()
    last_check_in = serializers.SerializerMethodField()

    class Meta:
        model = KeyResult
        fields = [
            'id', 'objective', 'title', 'type', 'target_value',
            'current_value', 'start_value', 'unit', 'progress',
            'order', 'check_ins_count', 'last_check_in',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'progress', 'created_at', 'updated_at']

    def get_check_ins_count(self, obj):
        return obj.check_ins.count()

    def get_last_check_in(self, obj):
        last = obj.check_ins.first()
        if last:
            return {
                'id': last.id,
                'new_value': str(last.new_value),
                'comment': last.comment,
                'created_at': last.created_at.isoformat()
            }
        return None


class KeyResultCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания KR"""

    class Meta:
        model = KeyResult
        fields = [
            'title', 'type', 'target_value', 'current_value',
            'start_value', 'unit', 'order'
        ]


class KeyResultUpdateSerializer(serializers.ModelSerializer):
    """Сериализатор для обновления KR"""

    class Meta:
        model = KeyResult
        fields = [
            'title', 'type', 'target_value', 'current_value',
            'start_value', 'unit', 'progress', 'order'
        ]


class ObjectiveOwnerSerializer(serializers.Serializer):
    """Краткий сериализатор владельца"""
    id = serializers.IntegerField()
    full_name = serializers.SerializerMethodField()
    avatar = serializers.ImageField()
    position_name = serializers.SerializerMethodField()

    def get_full_name(self, obj):
        return obj.get_full_name() if obj else None

    def get_position_name(self, obj):
        if obj and obj.position:
            return obj.position.name
        return None


class ObjectiveListSerializer(serializers.ModelSerializer):
    """Сериализатор списка целей"""
    owner = ObjectiveOwnerSerializer(read_only=True)
    owner_id = serializers.IntegerField(write_only=True, required=False)
    department_name = serializers.CharField(source='department.name', read_only=True, allow_null=True)
    period_name = serializers.CharField(source='period.name', read_only=True)
    progress = serializers.IntegerField(read_only=True)
    key_results_count = serializers.SerializerMethodField()
    children_count = serializers.SerializerMethodField()

    class Meta:
        model = Objective
        fields = [
            'id', 'title', 'description', 'level', 'status',
            'period', 'period_name', 'owner', 'owner_id',
            'department', 'department_name', 'parent',
            'progress', 'key_results_count', 'children_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'progress', 'created_at', 'updated_at']

    def get_key_results_count(self, obj):
        return obj.key_results.count()

    def get_children_count(self, obj):
        return obj.children.count()


class ObjectiveDetailSerializer(serializers.ModelSerializer):
    """Детальный сериализатор цели с KR"""
    owner = ObjectiveOwnerSerializer(read_only=True)
    owner_id = serializers.IntegerField(write_only=True, required=False)
    department_name = serializers.CharField(source='department.name', read_only=True, allow_null=True)
    period_name = serializers.CharField(source='period.name', read_only=True)
    progress = serializers.IntegerField(read_only=True)
    key_results = KeyResultSerializer(many=True, read_only=True)
    children = ObjectiveListSerializer(many=True, read_only=True)
    parent_title = serializers.CharField(source='parent.title', read_only=True, allow_null=True)

    class Meta:
        model = Objective
        fields = [
            'id', 'title', 'description', 'level', 'status',
            'period', 'period_name', 'owner', 'owner_id',
            'department', 'department_name', 'parent', 'parent_title',
            'progress', 'key_results', 'children',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'progress', 'key_results', 'children',
                           'created_at', 'updated_at']


class ObjectiveCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания цели"""
    key_results = KeyResultCreateSerializer(many=True, required=False)

    class Meta:
        model = Objective
        fields = [
            'title', 'description', 'level', 'status',
            'period', 'department', 'parent', 'key_results'
        ]

    def create(self, validated_data):
        key_results_data = validated_data.pop('key_results', [])
        objective = Objective.objects.create(**validated_data)

        for kr_data in key_results_data:
            KeyResult.objects.create(objective=objective, **kr_data)

        return objective


class ObjectiveUpdateSerializer(serializers.ModelSerializer):
    """Сериализатор для обновления цели"""

    class Meta:
        model = Objective
        fields = [
            'title', 'description', 'level', 'status',
            'department', 'parent'
        ]


class ObjectiveTreeSerializer(serializers.ModelSerializer):
    """Сериализатор дерева целей"""
    owner = ObjectiveOwnerSerializer(read_only=True)
    progress = serializers.IntegerField(read_only=True)
    children = serializers.SerializerMethodField()

    class Meta:
        model = Objective
        fields = [
            'id', 'title', 'level', 'status', 'owner',
            'progress', 'children'
        ]

    def get_children(self, obj):
        children = obj.children.filter(status__in=['active', 'completed'])
        return ObjectiveTreeSerializer(children, many=True).data
