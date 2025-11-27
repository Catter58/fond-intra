import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Tile,
  InlineNotification,
  Modal,
  Select,
  SelectItem,
} from '@carbon/react'
import { Add, ArrowLeft, Education, Help } from '@carbon/icons-react'
import { skillsApi } from '@/api/endpoints/skills'
import { AddSkillForm, SkillBadge, levelLabels } from '@/components/features/skills'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuthStore } from '@/store/authStore'
import { OnboardingTour, useModuleTour } from '@/components/ui/OnboardingTour'
import type { UserSkill } from '@/types'

export function ProfileSkillsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((state) => state.user)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingSkill, setEditingSkill] = useState<UserSkill | null>(null)
  const [newLevel, setNewLevel] = useState<UserSkill['level']>('intermediate')
  const { showTour, handleComplete, resetTour } = useModuleTour('skills')

  const { data: mySkills = [], isLoading, error } = useQuery({
    queryKey: ['my-skills'],
    queryFn: skillsApi.getMySkills,
  })

  const addSkillMutation = useMutation({
    mutationFn: (data: { skillId: number; level: UserSkill['level'] }) =>
      skillsApi.addMySkill({ skill: data.skillId, level: data.level }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-skills'] })
    },
  })

  const updateSkillMutation = useMutation({
    mutationFn: (data: { skillId: number; level: UserSkill['level'] }) =>
      skillsApi.updateMySkill(data.skillId, { level: data.level }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-skills'] })
      setEditingSkill(null)
    },
  })

  const removeSkillMutation = useMutation({
    mutationFn: (skillId: number) => skillsApi.removeMySkill(skillId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-skills'] })
    },
  })

  const handleAddSkill = async (skillId: number, level: UserSkill['level']) => {
    await addSkillMutation.mutateAsync({ skillId, level })
  }

  const handleRemoveSkill = (skillId: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот навык?')) {
      removeSkillMutation.mutate(skillId)
    }
  }

  const handleEditSkill = (skill: UserSkill) => {
    setEditingSkill(skill)
    setNewLevel(skill.level)
  }

  const handleSaveLevel = () => {
    if (editingSkill) {
      updateSkillMutation.mutate({ skillId: editingSkill.skill, level: newLevel })
    }
  }

  const existingSkillIds = mySkills.map((s) => s.skill)

  return (
    <div>
      <Breadcrumb noTrailingSlash>
        <BreadcrumbItem href="/" onClick={(e) => { e.preventDefault(); navigate('/') }}>
          Главная
        </BreadcrumbItem>
        <BreadcrumbItem href="/profile" onClick={(e) => { e.preventDefault(); navigate('/profile') }}>
          Профиль
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>Навыки</BreadcrumbItem>
      </Breadcrumb>

      <div style={{ marginTop: '1rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Button
            kind="ghost"
            size="sm"
            renderIcon={ArrowLeft}
            onClick={() => navigate('/profile')}
          >
            Назад
          </Button>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600 }}>Мои навыки</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            kind="ghost"
            size="sm"
            hasIconOnly
            iconDescription="Справка по странице"
            renderIcon={Help}
            onClick={resetTour}
          />
          <Button
            renderIcon={Add}
            onClick={() => setShowAddForm(true)}
            className="add-skill-btn"
          >
            Добавить навык
          </Button>
        </div>
      </div>

      {error && (
        <InlineNotification
          kind="error"
          title="Ошибка загрузки"
          subtitle="Не удалось загрузить навыки"
          lowContrast
          style={{ marginBottom: '1rem' }}
        />
      )}

      <Tile style={{ padding: '1.5rem' }}>
        {mySkills.length === 0 && !isLoading ? (
          <EmptyState
            icon={Education}
            title="У вас пока нет добавленных навыков"
            description="Добавьте навыки, чтобы коллеги могли узнать о ваших компетенциях"
            action={{
              label: 'Добавить первый навык',
              onClick: () => setShowAddForm(true),
            }}
          />
        ) : (
          <div>
            <p style={{ marginBottom: '1rem', color: 'var(--cds-text-secondary)', fontSize: '0.875rem' }}>
              Нажмите на навык, чтобы изменить уровень. Нажмите X, чтобы удалить.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {mySkills.map((skill) => (
                <SkillBadge
                  key={skill.id}
                  skill={skill}
                  userId={currentUser?.id || 0}
                  isOwnProfile={true}
                  onRemove={() => handleRemoveSkill(skill.skill)}
                  onEdit={() => handleEditSkill(skill)}
                />
              ))}
            </div>
          </div>
        )}
      </Tile>

      <AddSkillForm
        open={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSubmit={handleAddSkill}
        existingSkillIds={existingSkillIds}
      />

      <Modal
        open={!!editingSkill}
        onRequestClose={() => setEditingSkill(null)}
        onRequestSubmit={handleSaveLevel}
        modalHeading={`Изменить уровень: ${editingSkill?.skill_name}`}
        primaryButtonText="Сохранить"
        secondaryButtonText="Отмена"
        size="xs"
      >
        <Select
          id="edit-level"
          labelText="Уровень владения"
          value={newLevel}
          onChange={(e) => setNewLevel(e.target.value as UserSkill['level'])}
        >
          <SelectItem value="beginner" text={levelLabels.beginner} />
          <SelectItem value="intermediate" text={levelLabels.intermediate} />
          <SelectItem value="advanced" text={levelLabels.advanced} />
          <SelectItem value="expert" text={levelLabels.expert} />
        </Select>
      </Modal>

      {/* Module-specific onboarding tour */}
      <OnboardingTour
        tourType="skills"
        forceRun={showTour}
        onComplete={handleComplete}
      />
    </div>
  )
}
