import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@/test/utils'
import { UserSkillsList, UserSkillsCompact, SkillLevelSelector } from './UserSkillsList'
import type { UserSkill } from '@/types'

const mockSkills: UserSkill[] = [
  {
    id: 1,
    skill: 10,
    skill_name: 'TypeScript',
    skill_category: 'Языки программирования',
    level: 'advanced',
    level_display: 'Продвинутый',
    endorsements_count: 0,
    is_endorsed_by_current_user: false,
  },
  {
    id: 2,
    skill: 20,
    skill_name: 'React',
    skill_category: 'Фреймворки',
    level: 'expert',
    level_display: 'Эксперт',
    endorsements_count: 0,
    is_endorsed_by_current_user: false,
  },
  {
    id: 3,
    skill: 30,
    skill_name: 'Python',
    skill_category: 'Языки программирования',
    level: 'intermediate',
    level_display: 'Средний',
    endorsements_count: 0,
    is_endorsed_by_current_user: false,
  },
]

describe('UserSkillsList', () => {
  it('renders empty state when no skills', () => {
    render(<UserSkillsList skills={[]} userId={1} />)
    expect(screen.getByText('Навыки не указаны')).toBeInTheDocument()
  })

  it('renders skills with single category as flat list', () => {
    const singleCategorySkills = mockSkills.filter((s) => s.skill_category === 'Языки программирования')
    render(<UserSkillsList skills={singleCategorySkills} userId={1} />)

    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(screen.getByText('Python')).toBeInTheDocument()
  })

  it('renders skills with multiple categories in accordion', () => {
    render(<UserSkillsList skills={mockSkills} userId={1} />)

    // All skill names should be visible
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('Python')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    const { container } = render(<UserSkillsList skills={[]} userId={1} loading />)
    // Skeleton loaders should be present
    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThan(0)
  })

  it('calls onRemove when skill is removed in editable mode', () => {
    const handleRemove = vi.fn()
    const singleSkill = [mockSkills[0]]
    render(<UserSkillsList skills={singleSkill} userId={1} editable onRemove={handleRemove} />)

    // Find the remove button
    const removeButton = screen.getByTitle('Удалить навык')
    fireEvent.click(removeButton)
    expect(handleRemove).toHaveBeenCalledWith(10) // skill id
  })
})

describe('UserSkillsCompact', () => {
  it('renders empty state when no skills', () => {
    render(<UserSkillsCompact skills={[]} userId={1} />)
    expect(screen.getByText('Навыки не указаны')).toBeInTheDocument()
  })

  it('renders limited number of skills', () => {
    render(<UserSkillsCompact skills={mockSkills} userId={1} maxShow={2} />)

    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(screen.getByText('React')).toBeInTheDocument()
    // Should show +1 for remaining
    expect(screen.getByText('+1')).toBeInTheDocument()
  })

  it('does not show counter when all skills fit', () => {
    render(<UserSkillsCompact skills={mockSkills} userId={1} maxShow={5} />)

    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument()
  })

  it('renders all skills when maxShow is larger than skills count', () => {
    render(<UserSkillsCompact skills={mockSkills} userId={1} maxShow={10} />)

    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('Python')).toBeInTheDocument()
  })
})

describe('SkillLevelSelector', () => {
  it('renders all level options', () => {
    const handleChange = vi.fn()
    render(<SkillLevelSelector value="intermediate" onChange={handleChange} />)

    expect(screen.getByText('Начинающий')).toBeInTheDocument()
    expect(screen.getByText('Средний')).toBeInTheDocument()
    expect(screen.getByText('Продвинутый')).toBeInTheDocument()
    expect(screen.getByText('Эксперт')).toBeInTheDocument()
  })

  it('calls onChange when level is selected', () => {
    const handleChange = vi.fn()
    render(<SkillLevelSelector value="intermediate" onChange={handleChange} />)

    fireEvent.click(screen.getByText('Эксперт'))
    expect(handleChange).toHaveBeenCalledWith('expert')
  })

  it('renders selected level button', () => {
    const handleChange = vi.fn()
    render(<SkillLevelSelector value="advanced" onChange={handleChange} />)

    const advancedButton = screen.getByText('Продвинутый').closest('button')
    expect(advancedButton).toBeInTheDocument()
  })
})
