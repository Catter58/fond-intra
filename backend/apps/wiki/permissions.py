from rest_framework import permissions


class WikiSpacePermission(permissions.BasePermission):
    """Права доступа к пространствам Wiki"""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return True

    def has_object_permission(self, request, view, obj):
        user = request.user

        # Суперпользователь имеет полный доступ
        if user.is_superuser:
            return True

        # Проверка доступа к пространству
        if not obj.user_has_access(user):
            return False

        # Чтение доступно всем с доступом
        if request.method in permissions.SAFE_METHODS:
            return True

        # Редактирование доступно владельцу или админам
        if obj.owner == user:
            return True

        # Проверяем роль администратора
        if hasattr(user, 'roles') and user.roles.filter(is_admin=True).exists():
            return True

        return False


class WikiPagePermission(permissions.BasePermission):
    """Права доступа к страницам Wiki"""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return True

    def has_object_permission(self, request, view, obj):
        user = request.user

        # Суперпользователь имеет полный доступ
        if user.is_superuser:
            return True

        # Проверка доступа к пространству
        if not obj.space.user_has_access(user):
            return False

        # Чтение доступно всем с доступом к пространству
        if request.method in permissions.SAFE_METHODS:
            return True

        # Автор может редактировать свои страницы
        if obj.author == user:
            return True

        # Владелец пространства может редактировать все страницы
        if obj.space.owner == user:
            return True

        # Админы могут редактировать всё
        if hasattr(user, 'roles') and user.roles.filter(is_admin=True).exists():
            return True

        return False


class WikiTagPermission(permissions.BasePermission):
    """Права доступа к тегам Wiki"""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        # Чтение тегов доступно всем
        if request.method in permissions.SAFE_METHODS:
            return True

        # Создание/редактирование тегов только для админов
        if request.user.is_superuser:
            return True

        if hasattr(request.user, 'roles') and request.user.roles.filter(is_admin=True).exists():
            return True

        return False
