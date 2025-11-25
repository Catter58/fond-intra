import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Grid,
  Column,
  Tile,
  Tag,
  ProgressBar,
  Button,
  Loading,
  InlineNotification,
  Modal,
  TextInput,
  Select,
  SelectItem,
  NumberInput
} from '@carbon/react'
import { ArrowLeft, Add, TrashCan, Crossroads } from '@carbon/icons-react'
import { KeyResultItem, ObjectiveCard } from '../../components/features/okr'
import {
  getObjective,
  deleteObjective,
  addKeyResult,
  deleteKeyResult,
  updateObjective,
  type CreateKeyResultData
} from '../../api/endpoints/okr'
import type { Objective } from '../../types'
import { useAuthStore } from '../../store/authStore'

const statusColors: Record<string, 'blue' | 'green' | 'gray' | 'red'> = {
  draft: 'gray',
  active: 'blue',
  completed: 'green',
  cancelled: 'red'
}

const statusLabels: Record<string, string> = {
  draft: 'Черновик',
  active: 'Активна',
  completed: 'Завершена',
  cancelled: 'Отменена'
}

const levelLabels: Record<string, string> = {
  company: 'Компания',
  department: 'Отдел',
  personal: 'Личная'
}

export default function OKRDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [objective, setObjective] = useState<Objective | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addKRModalOpen, setAddKRModalOpen] = useState(false)
  const [editStatusModalOpen, setEditStatusModalOpen] = useState(false)

  // KR Form
  const [krTitle, setKRTitle] = useState('')
  const [krType, setKRType] = useState<'quantitative' | 'qualitative'>('quantitative')
  const [krTargetValue, setKRTargetValue] = useState<number>(100)
  const [krStartValue, setKRStartValue] = useState<number>(0)
  const [krUnit, setKRUnit] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Status Form
  const [newStatus, setNewStatus] = useState<string>('')

  const canEdit = objective?.owner?.id === user?.id || user?.is_superuser

  useEffect(() => {
    if (id) {
      loadObjective()
    }
  }, [id])

  const loadObjective = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getObjective(Number(id))
      setObjective(data)
      setNewStatus(data.status)
    } catch (err) {
      setError('Не удалось загрузить цель')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!objective || !confirm('Вы уверены, что хотите удалить эту цель?')) return
    try {
      await deleteObjective(objective.id)
      navigate('/okr')
    } catch (err) {
      setError('Не удалось удалить цель')
    }
  }

  const handleAddKR = async () => {
    if (!objective || !krTitle.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const data: CreateKeyResultData = {
        title: krTitle.trim(),
        type: krType,
        target_value: krType === 'quantitative' ? krTargetValue : null,
        start_value: krStartValue,
        unit: krUnit,
        order: (objective.key_results?.length || 0)
      }
      await addKeyResult(objective.id, data)
      setAddKRModalOpen(false)
      resetKRForm()
      loadObjective()
    } catch (err) {
      setError('Не удалось добавить ключевой результат')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteKR = async (krId: number) => {
    if (!confirm('Удалить ключевой результат?')) return
    try {
      await deleteKeyResult(krId)
      loadObjective()
    } catch (err) {
      setError('Не удалось удалить ключевой результат')
    }
  }

  const handleUpdateStatus = async () => {
    if (!objective || isSubmitting) return

    setIsSubmitting(true)
    try {
      await updateObjective(objective.id, { status: newStatus as Objective['status'] })
      setEditStatusModalOpen(false)
      loadObjective()
    } catch (err) {
      setError('Не удалось обновить статус')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetKRForm = () => {
    setKRTitle('')
    setKRType('quantitative')
    setKRTargetValue(100)
    setKRStartValue(0)
    setKRUnit('')
  }

  const getProgressStatus = (progress: number) => {
    if (progress >= 70) return 'finished'
    if (progress >= 30) return 'active'
    return 'error'
  }

  if (loading) {
    return <Loading />
  }

  if (error || !objective) {
    return (
      <Grid>
        <Column lg={16} md={8} sm={4}>
          <InlineNotification
            kind="error"
            title="Ошибка"
            subtitle={error || 'Цель не найдена'}
          />
          <Button kind="ghost" renderIcon={ArrowLeft} onClick={() => navigate('/okr')}>
            Назад к OKR
          </Button>
        </Column>
      </Grid>
    )
  }

  return (
    <Grid>
      <Column lg={16} md={8} sm={4}>
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Button
            kind="ghost"
            size="sm"
            renderIcon={ArrowLeft}
            onClick={() => navigate('/okr')}
            style={{ marginBottom: '1rem' }}
          >
            Назад к OKR
          </Button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Crossroads size={24} />
                <h1 style={{ margin: 0 }}>{objective.title}</h1>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <Tag
                  type={statusColors[objective.status]}
                  onClick={canEdit ? () => setEditStatusModalOpen(true) : undefined}
                  style={canEdit ? { cursor: 'pointer' } : undefined}
                >
                  {statusLabels[objective.status]}
                </Tag>
                <Tag type="outline">{levelLabels[objective.level]}</Tag>
                <Tag type="cool-gray">{objective.period_name}</Tag>
                {objective.department_name && (
                  <Tag type="purple">{objective.department_name}</Tag>
                )}
              </div>
            </div>

            {canEdit && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button kind="danger--tertiary" size="sm" renderIcon={TrashCan} onClick={handleDelete}>
                  Удалить
                </Button>
              </div>
            )}
          </div>
        </div>

        {error && (
          <InlineNotification
            kind="error"
            title="Ошибка"
            subtitle={error}
            onCloseButtonClick={() => setError(null)}
            style={{ marginBottom: '1rem' }}
          />
        )}

        <Grid condensed>
          <Column lg={11} md={5} sm={4}>
            {/* Description */}
            {objective.description && (
              <Tile style={{ marginBottom: '1rem' }}>
                <h4 style={{ marginBottom: '0.5rem' }}>Описание</h4>
                <p style={{ color: 'var(--cds-text-secondary)' }}>{objective.description}</p>
              </Tile>
            )}

            {/* Key Results */}
            <Tile style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0 }}>Ключевые результаты</h4>
                {canEdit && (
                  <Button kind="ghost" size="sm" renderIcon={Add} onClick={() => setAddKRModalOpen(true)}>
                    Добавить KR
                  </Button>
                )}
              </div>

              {objective.key_results && objective.key_results.length > 0 ? (
                objective.key_results.map(kr => (
                  <KeyResultItem
                    key={kr.id}
                    keyResult={kr}
                    onDelete={handleDeleteKR}
                    onUpdate={() => loadObjective()}
                    canEdit={canEdit}
                  />
                ))
              ) : (
                <p style={{ color: 'var(--cds-text-secondary)', textAlign: 'center', padding: '2rem' }}>
                  Ключевые результаты ещё не добавлены
                </p>
              )}
            </Tile>

            {/* Children objectives */}
            {objective.children && objective.children.length > 0 && (
              <Tile>
                <h4 style={{ marginBottom: '1rem' }}>Дочерние цели</h4>
                {objective.children.map(child => (
                  <ObjectiveCard
                    key={child.id}
                    objective={child}
                    showOwner
                  />
                ))}
              </Tile>
            )}
          </Column>

          <Column lg={5} md={3} sm={4}>
            {/* Progress */}
            <Tile style={{ marginBottom: '1rem' }}>
              <h4 style={{ marginBottom: '1rem' }}>Общий прогресс</h4>
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '3rem', fontWeight: 600 }}>{objective.progress}%</span>
              </div>
              <ProgressBar
                value={objective.progress}
                max={100}
                status={getProgressStatus(objective.progress)}
                label="Общий прогресс"
                hideLabel
              />
            </Tile>

            {/* Owner */}
            <Tile style={{ marginBottom: '1rem' }}>
              <h4 style={{ marginBottom: '0.75rem' }}>Владелец</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {objective.owner.avatar ? (
                  <img
                    src={objective.owner.avatar}
                    alt={objective.owner.full_name}
                    style={{ width: 40, height: 40, borderRadius: '50%' }}
                  />
                ) : (
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'var(--cds-layer-accent-01)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600
                  }}>
                    {objective.owner.full_name.charAt(0)}
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 500 }}>{objective.owner.full_name}</div>
                  {objective.owner.position_name && (
                    <div style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
                      {objective.owner.position_name}
                    </div>
                  )}
                </div>
              </div>
            </Tile>

            {/* Parent objective */}
            {objective.parent_title && (
              <Tile>
                <h4 style={{ marginBottom: '0.5rem' }}>Родительская цель</h4>
                <Button
                  kind="ghost"
                  size="sm"
                  onClick={() => navigate(`/okr/${objective.parent}`)}
                >
                  {objective.parent_title}
                </Button>
              </Tile>
            )}
          </Column>
        </Grid>

        {/* Add KR Modal */}
        <Modal
          open={addKRModalOpen}
          onRequestClose={() => setAddKRModalOpen(false)}
          onRequestSubmit={handleAddKR}
          modalHeading="Добавить ключевой результат"
          primaryButtonText="Добавить"
          secondaryButtonText="Отмена"
          primaryButtonDisabled={!krTitle.trim() || isSubmitting}
        >
          <TextInput
            id="kr-title"
            labelText="Название"
            value={krTitle}
            onChange={(e) => setKRTitle(e.target.value)}
            placeholder="Например: Количество новых клиентов"
            required
          />

          <Select
            id="kr-type"
            labelText="Тип"
            value={krType}
            onChange={(e) => setKRType(e.target.value as 'quantitative' | 'qualitative')}
            style={{ marginTop: '1rem' }}
          >
            <SelectItem value="quantitative" text="Количественный" />
            <SelectItem value="qualitative" text="Качественный" />
          </Select>

          {krType === 'quantitative' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <NumberInput
                id="kr-start"
                label="Начальное значение"
                value={krStartValue}
                onChange={(_e, { value }) => setKRStartValue(value as number)}
                min={0}
              />
              <NumberInput
                id="kr-target"
                label="Целевое значение"
                value={krTargetValue}
                onChange={(_e, { value }) => setKRTargetValue(value as number)}
                min={0}
              />
              <TextInput
                id="kr-unit"
                labelText="Единица измерения"
                value={krUnit}
                onChange={(e) => setKRUnit(e.target.value)}
                placeholder="%"
              />
            </div>
          )}
        </Modal>

        {/* Edit Status Modal */}
        <Modal
          open={editStatusModalOpen}
          onRequestClose={() => setEditStatusModalOpen(false)}
          onRequestSubmit={handleUpdateStatus}
          modalHeading="Изменить статус"
          primaryButtonText="Сохранить"
          secondaryButtonText="Отмена"
          primaryButtonDisabled={isSubmitting}
          size="sm"
        >
          <Select
            id="objective-status"
            labelText="Статус"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
          >
            <SelectItem value="draft" text="Черновик" />
            <SelectItem value="active" text="Активна" />
            <SelectItem value="completed" text="Завершена" />
            <SelectItem value="cancelled" text="Отменена" />
          </Select>
        </Modal>
      </Column>
    </Grid>
  )
}
