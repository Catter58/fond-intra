import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@/test/utils'
import { SkillBadge, levelLabels } from './SkillBadge'
import type { UserSkill } from '@/types'

const mockSkill: UserSkill = {
  id: 1,
  skill: 10,
  skill_name: 'TypeScript',
  skill_category: 'Языки программирования',
  level: 'advanced',
  level_display: 'Продвинутый',
  endorsements_count: 0,
  is_endorsed_by_current_user: false,
}

describe('SkillBadge', () => {
  it('renders skill name', () => {
    render(<SkillBadge skill={mockSkill} userId={1} />)
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
  })

  it('renders skill level label', () => {
    render(<SkillBadge skill={mockSkill} userId={1} />)
    expect(screen.getByText('Продвинутый')).toBeInTheDocument()
  })

  it('calls onRemove when remove button is clicked', () => {
    const handleRemove = vi.fn()
    render(<SkillBadge skill={mockSkill} userId={1} isOwnProfile onRemove={handleRemove} />)

    const removeButton = screen.getByTitle('Удалить навык')
    fireEvent.click(removeButton)
    expect(handleRemove).toHaveBeenCalledTimes(1)
  })
})

describe('levelLabels', () => {
  it('has Russian labels for each level', () => {
    expect(levelLabels.beginner).toBe('Начинающий')
    expect(levelLabels.intermediate).toBe('Средний')
    expect(levelLabels.advanced).toBe('Продвинутый')
    expect(levelLabels.expert).toBe('Эксперт')
  })
})
