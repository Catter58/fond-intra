import { useState } from 'react'
import { Button, Tooltip, Modal } from '@carbon/react'
import { CheckmarkFilled, UserFollow } from '@carbon/icons-react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { skillsApi } from '@/api/endpoints/skills'
import type { UserSkill } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { Avatar } from '@/components/ui/Avatar'

export const levelLabels = {
  beginner: 'Начинающий',
  intermediate: 'Средний',
  advanced: 'Продвинутый',
  expert: 'Эксперт',
}

interface SkillBadgeProps {
  skill: UserSkill
  userId: number
  isOwnProfile?: boolean
  onRemove?: () => void
  onEdit?: () => void
}

export function SkillBadge({ skill, userId, isOwnProfile = false, onRemove, onEdit }: SkillBadgeProps) {
  const currentUser = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()
  const [showEndorsers, setShowEndorsers] = useState(false)

  const { data: endorsements = [] } = useQuery({
    queryKey: ['skill-endorsements', userId, skill.skill],
    queryFn: () => skillsApi.getSkillEndorsements(userId, skill.skill),
    enabled: showEndorsers,
  })

  const endorseMutation = useMutation({
    mutationFn: () => skillsApi.endorseSkill(userId, skill.skill),
    onSuccess: () => {
      // Invalidate the specific user's skills list
      queryClient.invalidateQueries({ queryKey: ['user-skills', userId] })
      // Also invalidate 'my-skills' if viewing own profile
      if (isOwnProfile || currentUser?.id === userId) {
        queryClient.invalidateQueries({ queryKey: ['my-skills'] })
      }
      // Invalidate endorsements list
      queryClient.invalidateQueries({ queryKey: ['skill-endorsements', userId, skill.skill] })
    },
  })

  const unendorseMutation = useMutation({
    mutationFn: () => skillsApi.unendorseSkill(userId, skill.skill),
    onSuccess: () => {
      // Invalidate the specific user's skills list
      queryClient.invalidateQueries({ queryKey: ['user-skills', userId] })
      // Also invalidate 'my-skills' if viewing own profile
      if (isOwnProfile || currentUser?.id === userId) {
        queryClient.invalidateQueries({ queryKey: ['my-skills'] })
      }
      // Invalidate endorsements list
      queryClient.invalidateQueries({ queryKey: ['skill-endorsements', userId, skill.skill] })
    },
  })

  const handleEndorse = () => {
    if (skill.is_endorsed_by_current_user) {
      unendorseMutation.mutate()
    } else {
      endorseMutation.mutate()
    }
  }

  const canEndorse = !isOwnProfile && currentUser && currentUser.id !== userId

  return (
    <>
      <div
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
        {/* Skill name and level */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: isOwnProfile && onEdit ? 'pointer' : 'default',
          }}
          onClick={isOwnProfile && onEdit ? onEdit : undefined}
          title={isOwnProfile ? 'Изменить уровень' : undefined}
        >
          <span style={{ fontWeight: 500, color: 'var(--cds-text-primary)' }}>
            {skill.skill_name}
          </span>
          <span
            style={{
              fontSize: '0.75rem',
              padding: '0.125rem 0.5rem',
              borderRadius: '10px',
              backgroundColor:
                skill.level === 'expert'
                  ? '#8a3ffc'
                  : skill.level === 'advanced'
                  ? '#198038'
                  : skill.level === 'intermediate'
                  ? '#0043ce'
                  : '#6f6f6f',
              color: '#ffffff',
            }}
          >
            {levelLabels[skill.level]}
          </span>
        </div>

        {/* Endorsement count and button */}
        {skill.endorsements_count > 0 && (
          <Tooltip label="Посмотреть, кто подтвердил" align="bottom">
            <button
              onClick={() => setShowEndorsers(true)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.125rem 0.375rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                borderRadius: '10px',
                backgroundColor: 'var(--cds-layer-accent-01)',
                color: 'var(--cds-text-primary)',
                fontSize: '0.75rem',
              }}
            >
              <CheckmarkFilled size={12} />
              <span>{skill.endorsements_count}</span>
            </button>
          </Tooltip>
        )}

        {canEndorse && (
          <Tooltip
            label={skill.is_endorsed_by_current_user ? 'Отменить подтверждение' : 'Подтвердить навык'}
            align="bottom"
          >
            <Button
              kind={skill.is_endorsed_by_current_user ? 'primary' : 'ghost'}
              size="sm"
              renderIcon={UserFollow}
              iconDescription={skill.is_endorsed_by_current_user ? 'Отменить' : 'Подтвердить'}
              hasIconOnly
              onClick={handleEndorse}
              disabled={endorseMutation.isPending || unendorseMutation.isPending}
              style={{
                minHeight: '24px',
                padding: '0.25rem',
              }}
            />
          </Tooltip>
        )}

        {/* Remove button (only on own profile) */}
        {isOwnProfile && onRemove && (
          <button
            onClick={onRemove}
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
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--cds-layer-hover-01)')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            ×
          </button>
        )}
      </div>

      {/* Endorsers modal */}
      <Modal
        open={showEndorsers}
        onRequestClose={() => setShowEndorsers(false)}
        modalHeading={`Подтверждения навыка "${skill.skill_name}"`}
        passiveModal
        size="sm"
      >
        {endorsements.length === 0 ? (
          <p style={{ color: 'var(--cds-text-secondary)' }}>Загрузка...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {endorsements.map((endorsement) => (
              <div
                key={endorsement.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  backgroundColor: 'var(--cds-layer-01)',
                }}
              >
                <Avatar
                  src={endorsement.endorsed_by_details.avatar}
                  name={endorsement.endorsed_by_details.full_name}
                  size={32}
                  showIcon={false}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, color: 'var(--cds-text-primary)' }}>
                    {endorsement.endorsed_by_details.full_name}
                  </div>
                  {endorsement.endorsed_by_details.position && (
                    <div style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
                      {endorsement.endorsed_by_details.position}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                  {new Date(endorsement.created_at).toLocaleDateString('ru-RU')}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </>
  )
}
