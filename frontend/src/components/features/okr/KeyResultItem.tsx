import { useState } from 'react'
import {
  ProgressBar,
  Button,
  OverflowMenu,
  OverflowMenuItem,
  Modal,
  TextArea,
  NumberInput
} from '@carbon/react'
import { Add, Time } from '@carbon/icons-react'
import type { KeyResult } from '../../../types'
import { createCheckIn } from '../../../api/endpoints/okr'

interface KeyResultItemProps {
  keyResult: KeyResult
  onUpdate?: (keyResult: KeyResult) => void
  onDelete?: (id: number) => void
  canEdit?: boolean
}

export default function KeyResultItem({
  keyResult,
  onUpdate,
  onDelete,
  canEdit = false
}: KeyResultItemProps) {
  const [checkInModalOpen, setCheckInModalOpen] = useState(false)
  const [checkInValue, setCheckInValue] = useState<number>(keyResult.current_value)
  const [checkInComment, setCheckInComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const getProgressStatus = (progress: number) => {
    if (progress >= 70) return 'finished'
    if (progress >= 30) return 'active'
    return 'error'
  }

  const handleCheckIn = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      await createCheckIn(keyResult.id, {
        new_value: checkInValue,
        comment: checkInComment
      })
      setCheckInModalOpen(false)
      setCheckInComment('')
      if (onUpdate) {
        onUpdate({ ...keyResult, current_value: checkInValue })
      }
    } catch (error) {
      console.error('Failed to create check-in:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short'
    })
  }

  return (
    <div
      style={{
        padding: '1rem',
        marginBottom: '0.75rem',
        background: 'var(--cds-layer-01)',
        borderRadius: '4px',
        border: '1px solid var(--cds-border-subtle-01)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 500 }}>{keyResult.title}</span>
            <span style={{
              fontSize: '0.75rem',
              padding: '0.125rem 0.5rem',
              borderRadius: '4px',
              background: keyResult.type === 'quantitative' ? 'var(--cds-support-info-inverse)' : 'var(--cds-support-warning-inverse)',
              color: keyResult.type === 'quantitative' ? 'var(--cds-support-info)' : 'var(--cds-support-warning)'
            }}>
              {keyResult.type === 'quantitative' ? 'Количественный' : 'Качественный'}
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                {keyResult.type === 'quantitative' && keyResult.target_value
                  ? `${keyResult.current_value} / ${keyResult.target_value} ${keyResult.unit}`
                  : 'Прогресс'}
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{keyResult.progress}%</span>
            </div>
            <ProgressBar
              value={keyResult.progress}
              max={100}
              size="small"
              status={getProgressStatus(keyResult.progress)}
              label={keyResult.title}
              hideLabel
            />
          </div>

          {/* Last check-in info */}
          {keyResult.last_check_in && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.75rem',
              color: 'var(--cds-text-secondary)'
            }}>
              <Time size={12} />
              <span>
                Последний check-in: {formatDate(keyResult.last_check_in.created_at)}
                {keyResult.last_check_in.comment && ` — ${keyResult.last_check_in.comment}`}
              </span>
            </div>
          )}
        </div>

        {canEdit && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button
              kind="ghost"
              size="sm"
              renderIcon={Add}
              onClick={() => setCheckInModalOpen(true)}
              hasIconOnly
              iconDescription="Check-in"
            />
            <OverflowMenu size="sm" flipped>
              {onUpdate && (
                <OverflowMenuItem
                  itemText="Редактировать"
                  onClick={() => {}}
                />
              )}
              {onDelete && (
                <OverflowMenuItem
                  itemText="Удалить"
                  isDelete
                  onClick={() => onDelete(keyResult.id)}
                />
              )}
            </OverflowMenu>
          </div>
        )}
      </div>

      {/* Check-in Modal */}
      <Modal
        open={checkInModalOpen}
        onRequestClose={() => setCheckInModalOpen(false)}
        onRequestSubmit={handleCheckIn}
        modalHeading="Добавить Check-in"
        primaryButtonText="Сохранить"
        secondaryButtonText="Отмена"
        primaryButtonDisabled={isSubmitting}
      >
        <p style={{ marginBottom: '1rem' }}>
          Обновите прогресс для "{keyResult.title}"
        </p>

        {keyResult.type === 'quantitative' ? (
          <NumberInput
            id="check-in-value"
            label={`Текущее значение (${keyResult.unit || 'единиц'})`}
            value={checkInValue}
            onChange={(_e, { value }) => setCheckInValue(value as number)}
            min={keyResult.start_value}
            max={keyResult.target_value || undefined}
            helperText={`Целевое значение: ${keyResult.target_value} ${keyResult.unit}`}
          />
        ) : (
          <NumberInput
            id="check-in-progress"
            label="Прогресс (%)"
            value={checkInValue}
            onChange={(_e, { value }) => setCheckInValue(value as number)}
            min={0}
            max={100}
          />
        )}

        <TextArea
          id="check-in-comment"
          labelText="Комментарий (опционально)"
          value={checkInComment}
          onChange={(e) => setCheckInComment(e.target.value)}
          placeholder="Опишите что было сделано..."
          style={{ marginTop: '1rem' }}
        />
      </Modal>
    </div>
  )
}
