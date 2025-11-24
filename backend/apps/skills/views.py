"""
Views for skills app.
"""
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet
from rest_framework.views import APIView

from .models import SkillCategory, Skill, UserSkill, SkillEndorsement
from .serializers import (
    SkillCategorySerializer,
    SkillSerializer,
    SkillCreateSerializer,
    UserSkillSerializer,
    UserSkillCreateSerializer,
    SkillEndorsementSerializer,
    SkillEndorsementCreateSerializer,
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


class UserSkillsView(APIView):
    """Get skills for a specific user."""
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        """List user's skills."""
        skills = UserSkill.objects.filter(
            user_id=user_id
        ).select_related('skill', 'skill__category').prefetch_related('endorsements')
        serializer = UserSkillSerializer(skills, many=True, context={'request': request})
        return Response(serializer.data)


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


class SkillEndorseView(APIView):
    """Endorse a user's skill."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Create a skill endorsement."""
        serializer = SkillEndorsementCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)

        # Create endorsement
        user_skill = serializer.validated_data['user_skill']
        endorsement = SkillEndorsement.objects.create(
            user_skill=user_skill,
            endorsed_by=request.user
        )

        # Create notification
        from apps.notifications.models import Notification
        full_name = f"{request.user.first_name} {request.user.last_name}"
        Notification.objects.create(
            user=user_skill.user,
            type=Notification.NotificationType.SYSTEM,
            title=f'{full_name} подтвердил ваш навык',
            message=f'{full_name} подтвердил навык "{user_skill.skill.name}"',
            link=f'/profile/{user_skill.user.id}/skills'
        )

        response_serializer = SkillEndorsementSerializer(endorsement)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    def delete(self, request):
        """Remove a skill endorsement."""
        user_id = request.data.get('user_id')
        skill_id = request.data.get('skill_id')

        if not user_id or not skill_id:
            return Response(
                {'detail': 'user_id and skill_id are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user_skill = UserSkill.objects.get(user_id=user_id, skill_id=skill_id)
            endorsement = SkillEndorsement.objects.get(
                user_skill=user_skill,
                endorsed_by=request.user
            )
            endorsement.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except UserSkill.DoesNotExist:
            return Response(
                {'detail': 'Skill not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        except SkillEndorsement.DoesNotExist:
            return Response(
                {'detail': 'Endorsement not found.'},
                status=status.HTTP_404_NOT_FOUND
            )


class SkillEndorsementsView(APIView):
    """Get endorsements for a user skill."""
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id, skill_id):
        """List endorsements for a specific user skill."""
        try:
            user_skill = UserSkill.objects.get(user_id=user_id, skill_id=skill_id)
            endorsements = SkillEndorsement.objects.filter(
                user_skill=user_skill
            ).select_related('endorsed_by', 'endorsed_by__position')
            serializer = SkillEndorsementSerializer(endorsements, many=True)
            return Response(serializer.data)
        except UserSkill.DoesNotExist:
            return Response(
                {'detail': 'Skill not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
