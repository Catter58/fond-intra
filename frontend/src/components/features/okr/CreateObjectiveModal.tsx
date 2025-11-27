import { useState, useEffect } from 'react'
import {
  Modal,
  TextInput,
  TextArea,
  Select,
  SelectItem,
  NumberInput,
  Button,
  IconButton
} from '@carbon/react'
import { Add, TrashCan } from '@carbon/icons-react'
import type { OKRPeriod } from '../../../types'
import type { Department } from '../../../api/endpoints/organization'
import { createObjective, type CreateObjectiveData } from '../../../api/endpoints/okr'
import { getPeriods } from '../../../api/endpoints/okr'
import { organizationApi } from '../../../api/endpoints/organization'

interface CreateObjectiveModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  parentId?: number | null
}

interface KeyResultForm {
  title: string
  type: 'quantitative' | 'qualitative'
  target_value: number | null
  start_value: number
  unit: string
}

export default function CreateObjectiveModal({
  open,
  onClose,
  onSuccess,
  parentId = null
}: CreateObjectiveModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [level, setLevel] = useState<'company' | 'department' | 'personal'>('personal')
  const [periodId, setPeriodId] = useState<number | null>(null)
  const [departmentId, setDepartmentId] = useState<number | null>(null)
  const [keyResults, setKeyResults] = useState<KeyResultForm[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [periods, setPeriods] = useState<OKRPeriod[]>([])
  const [departments, setDepartments] = useState<Department[]>([])

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open])

  const loadData = async () => {
    try {
      const [periodsData, deptsData] = await Promise.all([
        getPeriods(),
        organizationApi.getDepartments()
      ])
      setPeriods(periodsData)
      setDepartments(deptsData)

      // Set default active period
      const activePeriod = periodsData.find((p: OKRPeriod) => p.is_active)
      if (activePeriod) {
        setPeriodId(activePeriod.id)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  const addKeyResult = () => {
    setKeyResults([...keyResults, {
      title: '',
      type: 'quantitative',
      target_value: null,
      start_value: 0,
      unit: ''
    }])
  }

  const updateKeyResult = (index: number, field: keyof KeyResultForm, value: unknown) => {
    const updated = [...keyResults]
    updated[index] = { ...updated[index], [field]: value }
    setKeyResults(updated)
  }

  const removeKeyResult = (index: number) => {
    setKeyResults(keyResults.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!title.trim() || !periodId) return

    setIsSubmitting(true)
    try {
      const data: CreateObjectiveData = {
        title: title.trim(),
        description: description.trim(),
        level,
        period: periodId,
        department: level === 'department' ? departmentId : null,
        parent: parentId,
        key_results: keyResults
          .filter(kr => kr.title.trim())
          .map((kr, index) => ({
            title: kr.title.trim(),
            type: kr.type,
            target_value: kr.type === 'quantitative' ? kr.target_value : null,
            start_value: kr.start_value,
            unit: kr.unit,
            order: index
          }))
      }

      await createObjective(data)
      onSuccess()
      resetForm()
      onClose()
    } catch (error) {
      console.error('Failed to create objective:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setLevel('personal')
    setDepartmentId(null)
    setKeyResults([])
  }

  return (
    <Modal
      open={open}
      onRequestClose={onClose}
      onRequestSubmit={handleSubmit}
      modalHeading={parentId ? 'Создать дочернюю цель' : 'Создать цель'}
      primaryButtonText="Создать"
      secondaryButtonText="Отмена"
      primaryButtonDisabled={!title.trim() || !periodId || isSubmitting}
      size="lg"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <TextInput
          id="objective-title"
          labelText="Название цели"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Например: Увеличить выручку на 20%"
          required
        />

        <TextArea
          id="objective-description"
          labelText="Описание (опционально)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Опишите цель подробнее..."
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Select
            id="objective-period"
            labelText="Период"
            value={periodId?.toString() || ''}
            onChange={(e) => setPeriodId(Number(e.target.value))}
          >
            <SelectItem value="" text="Выберите период" />
            {periods.map(period => (
              <SelectItem
                key={period.id}
                value={period.id.toString()}
                text={`${period.name}${period.is_active ? ' (активный)' : ''}`}
              />
            ))}
          </Select>

          <Select
            id="objective-level"
            labelText="Уровень"
            value={level}
            onChange={(e) => setLevel(e.target.value as 'company' | 'department' | 'personal')}
          >
            <SelectItem value="personal" text="Личная" />
            <SelectItem value="department" text="Отдел" />
            <SelectItem value="company" text="Компания" />
          </Select>
        </div>

        {level === 'department' && (
          <Select
            id="objective-department"
            labelText="Отдел"
            value={departmentId?.toString() || ''}
            onChange={(e) => setDepartmentId(Number(e.target.value))}
          >
            <SelectItem value="" text="Выберите отдел" />
            {departments.map(dept => (
              <SelectItem
                key={dept.id}
                value={dept.id.toString()}
                text={dept.name}
              />
            ))}
          </Select>
        )}

        {/* Key Results */}
        <div style={{ borderTop: '1px solid var(--cds-border-subtle-01)', paddingTop: '1rem', marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h5 style={{ margin: 0 }}>Ключевые результаты</h5>
            <Button kind="ghost" size="sm" renderIcon={Add} onClick={addKeyResult}>
              Добавить KR
            </Button>
          </div>

          {keyResults.map((kr, index) => (
            <div
              key={index}
              style={{
                padding: '1rem',
                marginBottom: '0.75rem',
                background: 'var(--cds-layer-01)',
                borderRadius: '4px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <TextInput
                  id={`kr-title-${index}`}
                  labelText="Название KR"
                  value={kr.title}
                  onChange={(e) => updateKeyResult(index, 'title', e.target.value)}
                  placeholder="Например: Количество новых клиентов"
                  style={{ flex: 1, marginRight: '1rem' }}
                />
                <IconButton
                  kind="ghost"
                  size="sm"
                  label="Удалить"
                  onClick={() => removeKeyResult(index)}
                >
                  <TrashCan />
                </IconButton>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                <Select
                  id={`kr-type-${index}`}
                  labelText="Тип"
                  value={kr.type}
                  onChange={(e) => updateKeyResult(index, 'type', e.target.value)}
                >
                  <SelectItem value="quantitative" text="Количественный" />
                  <SelectItem value="qualitative" text="Качественный" />
                </Select>

                {kr.type === 'quantitative' && (
                  <>
                    <NumberInput
                      id={`kr-start-${index}`}
                      label="Начальное"
                      value={kr.start_value}
                      onChange={(_e, { value }) => updateKeyResult(index, 'start_value', value)}
                      min={0}
                    />
                    <NumberInput
                      id={`kr-target-${index}`}
                      label="Целевое"
                      value={kr.target_value || 0}
                      onChange={(_e, { value }) => updateKeyResult(index, 'target_value', value)}
                      min={0}
                    />
                    <TextInput
                      id={`kr-unit-${index}`}
                      labelText="Единица"
                      value={kr.unit}
                      onChange={(e) => updateKeyResult(index, 'unit', e.target.value)}
                      placeholder="%"
                    />
                  </>
                )}
              </div>
            </div>
          ))}

          {keyResults.length === 0 && (
            <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>
              Ключевые результаты можно добавить сейчас или позже
            </p>
          )}
        </div>
      </div>
    </Modal>
  )
}
