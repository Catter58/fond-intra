import { useState, useMemo } from 'react'
import {
  Modal,
  Select,
  SelectItem,
  RadioButtonGroup,
  RadioButton,
  InlineNotification,
} from '@carbon/react'
import { useQuery } from '@tanstack/react-query'
import { skillsApi } from '@/api/endpoints/skills'
import type { UserSkill } from '@/types'
import { levelLabels } from './SkillBadge'

interface AddSkillFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (skillId: number, level: UserSkill['level']) => Promise<void>
  existingSkillIds: number[]
}

export function AddSkillForm({ open, onClose, onSubmit, existingSkillIds }: AddSkillFormProps) {
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('')
  const [selectedSkill, setSelectedSkill] = useState<number | ''>('')
  const [selectedLevel, setSelectedLevel] = useState<UserSkill['level']>('intermediate')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: categories = [] } = useQuery({
    queryKey: ['skill-categories'],
    queryFn: skillsApi.getCategories,
  })

  const { data: allSkills = [] } = useQuery({
    queryKey: ['skills'],
    queryFn: () => skillsApi.getSkills(),
  })

  // Filter skills by category and exclude already added
  const availableSkills = useMemo(() => {
    let filtered = allSkills.filter((skill) => !existingSkillIds.includes(skill.id))
    if (selectedCategory !== '') {
      filtered = filtered.filter((skill) => skill.category === selectedCategory)
    }
    return filtered
  }, [allSkills, existingSkillIds, selectedCategory])

  const handleSubmit = async () => {
    if (selectedSkill === '') {
      setError('Выберите навык')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await onSubmit(selectedSkill, selectedLevel)
      handleClose()
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Ошибка при добавлении навыка')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setSelectedCategory('')
    setSelectedSkill('')
    setSelectedLevel('intermediate')
    setError(null)
    onClose()
  }

  return (
    <Modal
      open={open}
      onRequestClose={handleClose}
      onRequestSubmit={handleSubmit}
      modalHeading="Добавить навык"
      primaryButtonText="Добавить"
      secondaryButtonText="Отмена"
      primaryButtonDisabled={selectedSkill === '' || isSubmitting}
      size="sm"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {error && (
          <InlineNotification
            kind="error"
            title="Ошибка"
            subtitle={error}
            lowContrast
            hideCloseButton
          />
        )}

        <Select
          id="category-select"
          labelText="Категория (фильтр)"
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value === '' ? '' : Number(e.target.value))
            setSelectedSkill('')
          }}
        >
          <SelectItem value="" text="Все категории" />
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id} text={cat.name} />
          ))}
        </Select>

        <Select
          id="skill-select"
          labelText="Навык"
          value={selectedSkill}
          onChange={(e) => setSelectedSkill(e.target.value === '' ? '' : Number(e.target.value))}
          invalid={availableSkills.length === 0 && allSkills.length > 0}
          invalidText={availableSkills.length === 0 ? 'Все навыки в этой категории уже добавлены' : undefined}
        >
          <SelectItem value="" text="Выберите навык" />
          {availableSkills.map((skill) => (
            <SelectItem
              key={skill.id}
              value={skill.id}
              text={`${skill.name}${selectedCategory === '' ? ` (${skill.category_name})` : ''}`}
            />
          ))}
        </Select>

        <div>
          <label
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.75rem',
              color: 'var(--cds-text-secondary)',
            }}
          >
            Уровень владения
          </label>
          <RadioButtonGroup
            name="skill-level"
            valueSelected={selectedLevel}
            onChange={(value) => setSelectedLevel(value as UserSkill['level'])}
            orientation="vertical"
          >
            <RadioButton
              id="level-beginner"
              value="beginner"
              labelText={`${levelLabels.beginner} - Базовые знания, нужна помощь`}
            />
            <RadioButton
              id="level-intermediate"
              value="intermediate"
              labelText={`${levelLabels.intermediate} - Уверенное владение, самостоятельная работа`}
            />
            <RadioButton
              id="level-advanced"
              value="advanced"
              labelText={`${levelLabels.advanced} - Глубокие знания, могу обучать других`}
            />
            <RadioButton
              id="level-expert"
              value="expert"
              labelText={`${levelLabels.expert} - Экспертный уровень, архитектурные решения`}
            />
          </RadioButtonGroup>
        </div>
      </div>
    </Modal>
  )
}
