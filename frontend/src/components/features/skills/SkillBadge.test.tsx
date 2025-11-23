import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@/test/utils'
import { SkillBadge, SkillLevelIndicator, levelColors, levelLabels } from './SkillBadge'
import type { UserSkill } from '@/types'

const mockSkill: UserSkill = {
  id: 1,
  skill: 10,
  skill_name: 'TypeScript',
  skill_category: 'Языки программирования',
  level: 'advanced',
  level_display: 'Продвинутый',
}

describe('SkillBadge', () => {
  it('renders skill name', () => {
    render(<SkillBadge skill={mockSkill} />)
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
  })

  it('renders skill level label', () => {
    render(<SkillBadge skill={mockSkill} />)
    expect(screen.getByText('Продвинутый')).toBeInTheDocument()
  })

  it('calls onRemove when close button is clicked', () => {
    const handleRemove = vi.fn()
    render(<SkillBadge skill={mockSkill} onRemove={handleRemove} />)

    // Carbon Tag with filter prop has a close button
    const closeButton = screen.getByRole('button')
    fireEvent.click(closeButton)
    expect(handleRemove).toHaveBeenCalledTimes(1)
  })

  it('renders with showCategory prop', () => {
    render(<SkillBadge skill={mockSkill} showCategory />)
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
  })
})

describe('SkillLevelIndicator', () => {
  it('renders component without crashing', () => {
    const { container } = render(<SkillLevelIndicator level="intermediate" />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders for beginner level', () => {
    const { container } = render(<SkillLevelIndicator level="beginner" />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders for expert level', () => {
    const { container } = render(<SkillLevelIndicator level="expert" />)
    expect(container.firstChild).toBeInTheDocument()
  })
})

describe('levelColors', () => {
  it('has correct color for each level', () => {
    expect(levelColors.beginner).toBe('gray')
    expect(levelColors.intermediate).toBe('blue')
    expect(levelColors.advanced).toBe('green')
    expect(levelColors.expert).toBe('purple')
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
