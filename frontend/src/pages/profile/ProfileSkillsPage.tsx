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
import { Add, ArrowLeft } from '@carbon/icons-react'
import { skillsApi } from '@/api/endpoints/skills'
import { AddSkillForm, levelLabels } from '@/components/features/skills'
import type { UserSkill } from '@/types'

export function ProfileSkillsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingSkill, setEditingSkill] = useState<UserSkill | null>(null)
  const [newLevel, setNewLevel] = useState<UserSkill['level']>('intermediate')

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
        <Button
          renderIcon={Add}
          onClick={() => setShowAddForm(true)}
        >
          Добавить навык
        </Button>
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
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ fontSize: '1.125rem', marginBottom: '1rem', color: 'var(--cds-text-secondary)' }}>
              У вас пока нет добавленных навыков
            </p>
            <p style={{ marginBottom: '1.5rem', color: 'var(--cds-text-secondary)' }}>
              Добавьте навыки, чтобы коллеги могли узнать о ваших компетенциях
            </p>
            <Button renderIcon={Add} onClick={() => setShowAddForm(true)}>
              Добавить первый навык
            </Button>
          </div>
        ) : (
          <div>
            <p style={{ marginBottom: '1rem', color: 'var(--cds-text-secondary)', fontSize: '0.875rem' }}>
              Нажмите на навык, чтобы изменить уровень. Нажмите X, чтобы удалить.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {mySkills.map((skill) => (
                <div
                  key={skill.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '4px',
                    backgroundColor: 'var(--cds-layer-02)',
                    border: '1px solid var(--cds-border-subtle-01)',
                  }}
                >
                  <button
                    onClick={() => handleEditSkill(skill)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                    title="Изменить уровень"
                  >
                    <span style={{ fontWeight: 500, color: 'var(--cds-text-primary)' }}>{skill.skill_name}</span>
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '10px',
                      backgroundColor: skill.level === 'expert' ? '#8a3ffc'
                        : skill.level === 'advanced' ? '#198038'
                        : skill.level === 'intermediate' ? '#0043ce'
                        : '#6f6f6f',
                      color: '#ffffff',
                    }}>
                      {levelLabels[skill.level]}
                    </span>
                  </button>
                  <button
                    onClick={() => handleRemoveSkill(skill.skill)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--cds-text-secondary)',
                      fontSize: '1.25rem',
                      lineHeight: 1,
                      borderRadius: '50%',
                    }}
                    title="Удалить навык"
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--cds-layer-hover-01)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    ×
                  </button>
                </div>
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
    </div>
  )
}
