import { useMemo } from 'react'
import { Accordion, AccordionItem, Tag } from '@carbon/react'
import type { UserSkill } from '@/types'
import { SkillBadge, levelLabels } from './SkillBadge'

interface UserSkillsListProps {
  skills: UserSkill[]
  editable?: boolean
  onRemove?: (skillId: number) => void
  loading?: boolean
}

interface GroupedSkills {
  [category: string]: UserSkill[]
}

export function UserSkillsList({
  skills,
  editable = false,
  onRemove,
  loading = false,
}: UserSkillsListProps) {
  // Group skills by category
  const groupedSkills = useMemo(() => {
    return skills.reduce<GroupedSkills>((acc, skill) => {
      const category = skill.skill_category || 'Другое'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(skill)
      return acc
    }, {})
  }, [skills])

  const categories = Object.keys(groupedSkills).sort()

  if (loading) {
    return (
      <div style={{ padding: '1rem' }}>
        <div className="skeleton" style={{ height: '2rem', width: '100%', marginBottom: '0.5rem' }} />
        <div className="skeleton" style={{ height: '2rem', width: '80%', marginBottom: '0.5rem' }} />
        <div className="skeleton" style={{ height: '2rem', width: '60%' }} />
      </div>
    )
  }

  if (skills.length === 0) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: 'var(--cds-text-secondary)',
      }}>
        <p>Навыки не указаны</p>
      </div>
    )
  }

  // If only one category, show flat list
  if (categories.length === 1) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '0.5rem 0' }}>
        {skills.map((skill) => (
          <SkillBadge
            key={skill.id}
            skill={skill}
            onRemove={editable && onRemove ? () => onRemove(skill.skill) : undefined}
          />
        ))}
      </div>
    )
  }

  // Multiple categories - use accordion
  return (
    <Accordion>
      {categories.map((category) => (
        <AccordionItem
          key={category}
          title={
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {category}
              <Tag size="sm" type="gray">{groupedSkills[category].length}</Tag>
            </span>
          }
          open
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '0.5rem 0' }}>
            {groupedSkills[category].map((skill) => (
              <SkillBadge
                key={skill.id}
                skill={skill}
                onRemove={editable && onRemove ? () => onRemove(skill.skill) : undefined}
              />
            ))}
          </div>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

// Compact view for profile cards
export function UserSkillsCompact({ skills, maxShow = 5 }: { skills: UserSkill[]; maxShow?: number }) {
  const displaySkills = skills.slice(0, maxShow)
  const remaining = skills.length - maxShow

  if (skills.length === 0) {
    return (
      <span style={{ color: 'var(--cds-text-secondary)', fontSize: '0.875rem' }}>
        Навыки не указаны
      </span>
    )
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', alignItems: 'center' }}>
      {displaySkills.map((skill) => (
        <SkillBadge key={skill.id} skill={skill} />
      ))}
      {remaining > 0 && (
        <Tag size="sm" type="gray">+{remaining}</Tag>
      )}
    </div>
  )
}

// Level selector for editing
export function SkillLevelSelector({
  value,
  onChange,
}: {
  value: UserSkill['level']
  onChange: (level: UserSkill['level']) => void
}) {
  const levels: UserSkill['level'][] = ['beginner', 'intermediate', 'advanced', 'expert']

  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      {levels.map((level) => (
        <button
          key={level}
          type="button"
          onClick={() => onChange(level)}
          style={{
            padding: '0.5rem 1rem',
            border: value === level ? '2px solid var(--cds-interactive)' : '1px solid var(--cds-border-subtle-01)',
            borderRadius: '4px',
            background: value === level ? 'var(--cds-layer-selected-01)' : 'transparent',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          {levelLabels[level]}
        </button>
      ))}
    </div>
  )
}
