import { Tag } from '@carbon/react'
import type { UserSkill } from '@/types'

interface SkillBadgeProps {
  skill: UserSkill
  showCategory?: boolean
  onRemove?: () => void
  onLevelChange?: (level: UserSkill['level']) => void
}

const levelColors: Record<UserSkill['level'], 'gray' | 'blue' | 'green' | 'purple'> = {
  beginner: 'gray',
  intermediate: 'blue',
  advanced: 'green',
  expert: 'purple',
}

const levelLabels: Record<UserSkill['level'], string> = {
  beginner: 'Начинающий',
  intermediate: 'Средний',
  advanced: 'Продвинутый',
  expert: 'Эксперт',
}

export function SkillBadge({ skill, showCategory = false, onRemove }: SkillBadgeProps) {
  const color = levelColors[skill.level]

  return (
    <Tag
      type={color}
      size="md"
      filter={!!onRemove}
      onClose={onRemove}
      title={`${skill.skill_name} - ${levelLabels[skill.level]}${showCategory ? ` (${skill.skill_category})` : ''}`}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <span>{skill.skill_name}</span>
        <span style={{
          fontSize: '0.75rem',
          opacity: 0.8,
          marginLeft: '0.25rem'
        }}>
          {levelLabels[skill.level]}
        </span>
      </span>
    </Tag>
  )
}

export function SkillLevelIndicator({ level }: { level: UserSkill['level'] }) {
  const levels: UserSkill['level'][] = ['beginner', 'intermediate', 'advanced', 'expert']
  const currentIndex = levels.indexOf(level)

  return (
    <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
      {levels.map((l, i) => (
        <div
          key={l}
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: i <= currentIndex
              ? `var(--cds-tag-color-${levelColors[level]})`
              : 'var(--cds-border-subtle-01)',
          }}
        />
      ))}
    </div>
  )
}

export { levelColors, levelLabels }
