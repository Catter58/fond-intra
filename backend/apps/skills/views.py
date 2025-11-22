"""
Views for skills app.
"""
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet
from rest_framework.views import APIView

from .models import SkillCategory, Skill, UserSkill
from .serializers import (
    SkillCategorySerializer,
    SkillSerializer,
    SkillCreateSerializer,
    UserSkillSerializer,
    UserSkillCreateSerializer,
)
from .permissions import CanManageSkills


class SkillCategoryViewSet(ReadOnlyModelViewSet):
    """List skill categories."""
    queryset = SkillCategory.objects.all()
    serializer_class = SkillCategorySerializer
    permission_classes = [IsAuthenticated]


class SkillViewSet(ModelViewSet):
    """CRUD for skills."""
    queryset = Skill.objects.all().select_related('category')
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return SkillCreateSerializer
        return SkillSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), CanManageSkills()]
        return [IsAuthenticated()]


class MySkillsView(APIView):
    """Manage current user's skills."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """List current user's skills."""
        skills = UserSkill.objects.filter(
            user=request.user
        ).select_related('skill', 'skill__category')
        serializer = UserSkillSerializer(skills, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Add a skill to current user."""
        serializer = UserSkillCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MySkillDetailView(APIView):
    """Delete current user's skill."""
    permission_classes = [IsAuthenticated]

    def delete(self, request, skill_id):
        """Remove a skill from current user."""
        try:
            user_skill = UserSkill.objects.get(
                user=request.user,
                skill_id=skill_id
            )
            user_skill.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except UserSkill.DoesNotExist:
            return Response(
                {'detail': 'Skill not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

    def patch(self, request, skill_id):
        """Update skill level."""
        try:
            user_skill = UserSkill.objects.get(
                user=request.user,
                skill_id=skill_id
            )
            level = request.data.get('level')
            if level:
                user_skill.level = level
                user_skill.save()
            return Response(UserSkillSerializer(user_skill).data)
        except UserSkill.DoesNotExist:
            return Response(
                {'detail': 'Skill not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
