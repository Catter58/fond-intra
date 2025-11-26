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
        # Convert validated_data to JSON-serializable format
        new_values = {}
        for key, value in serializer.validated_data.items():
            if hasattr(value, 'pk'):
                new_values[key] = value.pk
            else:
                new_values[key] = value
        AuditLog.log(
            user=self.request.user,
            action=AuditLog.Action.CREATE,
            entity_type='Department',
            entity_id=department.id,
            entity_repr=str(department),
            new_values=new_values,
            ip_address=getattr(self.request, 'audit_ip', None),
            user_agent=getattr(self.request, 'audit_user_agent', '')
        )

    def perform_update(self, serializer):
        old_values = DepartmentSerializer(self.get_object()).data
        department = serializer.save()
        # Convert validated_data to JSON-serializable format
        new_values = {}
        for key, value in serializer.validated_data.items():
            if hasattr(value, 'pk'):
                new_values[key] = value.pk
            else:
                new_values[key] = value
        AuditLog.log(
            user=self.request.user,
            action=AuditLog.Action.UPDATE,
            entity_type='Department',
            entity_id=department.id,
            entity_repr=str(department),
            old_values=old_values,
            new_values=new_values,
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


class DepartmentSkillsMatrixView(APIView):
    """Get skills matrix for a department."""
    permission_classes = [IsAuthenticated]

    def get(self, request, department_id):
        from apps.skills.models import UserSkill, Skill
        from apps.accounts.models import User
        from django.db.models import Count, Q

        try:
            department = Department.objects.get(id=department_id)
        except Department.DoesNotExist:
            return Response(
                {'detail': 'Department not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get all users in this department
        users = User.objects.filter(
            department=department
        ).select_related('position').order_by('last_name', 'first_name')

        # Get category filter if provided
        category_id = request.query_params.get('category')

        # Get all skills that exist in this department
        skills_query = Skill.objects.filter(
            user_skills__user__department=department
        ).select_related('category').distinct()

        if category_id:
            skills_query = skills_query.filter(category_id=category_id)

        skills = skills_query.order_by('category__order', 'name')

        # Get all UserSkills for this department
        user_skills = UserSkill.objects.filter(
            user__department=department
        ).select_related('skill', 'user')

        if category_id:
            user_skills = user_skills.filter(skill__category_id=category_id)

        # Build matrix: skill_id -> user_id -> level
        matrix = {}
        for user_skill in user_skills:
            skill_id = user_skill.skill_id
            user_id = user_skill.user_id
            if skill_id not in matrix:
                matrix[skill_id] = {}
            matrix[skill_id][user_id] = user_skill.level

        # Build response
        skills_data = []
        for skill in skills:
            skill_row = {
                'id': skill.id,
                'name': skill.name,
                'category': skill.category.name,
                'category_id': skill.category.id,
                'users': {}
            }

            # Add user levels for this skill
            for user in users:
                user_level = matrix.get(skill.id, {}).get(user.id)
                skill_row['users'][str(user.id)] = user_level

            # Calculate statistics for this skill
            skill_levels = matrix.get(skill.id, {}).values()
            skill_row['stats'] = {
                'total': len([l for l in skill_levels if l]),
                'beginner': len([l for l in skill_levels if l == 'beginner']),
                'intermediate': len([l for l in skill_levels if l == 'intermediate']),
                'advanced': len([l for l in skill_levels if l == 'advanced']),
                'expert': len([l for l in skill_levels if l == 'expert']),
            }

            skills_data.append(skill_row)

        users_data = [
            {
                'id': user.id,
                'full_name': f"{user.first_name} {user.last_name}",
                'avatar': user.avatar.url if user.avatar else None,
                'position': user.position.name if user.position else None,
            }
            for user in users
        ]

        return Response({
            'department': {
                'id': department.id,
                'name': department.name,
            },
            'users': users_data,
            'skills': skills_data,
        })
