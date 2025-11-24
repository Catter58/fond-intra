"""
Endorsement URLs - separate from main skills URLs to avoid routing conflicts.
"""
from django.urls import path

from .views import SkillEndorseView, SkillEndorsementsView

urlpatterns = [
    # Endorsement operations
    path('endorse/', SkillEndorseView.as_view(), name='user-skill-endorse'),
    path('<int:user_id>/<int:skill_id>/endorsements/',
         SkillEndorsementsView.as_view(), name='user-skill-endorsements'),
]
