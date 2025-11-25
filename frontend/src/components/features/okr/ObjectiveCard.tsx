import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Tile,
  Tag,
  ProgressBar,
  Button,
  OverflowMenu,
  OverflowMenuItem
} from '@carbon/react'
import { ChevronDown, ChevronUp, Crossroads } from '@carbon/icons-react'
import type { Objective } from '../../../types'

interface ObjectiveCardProps {
  objective: Objective
  onEdit?: (objective: Objective) => void
  onDelete?: (id: number) => void
  onAddKeyResult?: (objectiveId: number) => void
  canEdit?: boolean
  showOwner?: boolean
}

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

export default function ObjectiveCard({
  objective,
  onEdit,
  onDelete,
  onAddKeyResult,
  canEdit = false,
  showOwner = true
}: ObjectiveCardProps) {
  const navigate = useNavigate()
  const [isExpanded, setIsExpanded] = useState(false)

  const getProgressStatus = (progress: number) => {
    if (progress >= 70) return 'finished'
    if (progress >= 30) return 'active'
    return 'error'
  }

  return (
    <Tile className="objective-card" style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Crossroads size={20} />
            <h4 style={{ margin: 0, cursor: 'pointer' }} onClick={() => navigate(`/okr/${objective.id}`)}>
              {objective.title}
            </h4>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            <Tag type={statusColors[objective.status]} size="sm">
              {statusLabels[objective.status]}
            </Tag>
            <Tag type="outline" size="sm">
              {levelLabels[objective.level]}
            </Tag>
            <Tag type="cool-gray" size="sm">
              {objective.period_name}
            </Tag>
            {objective.department_name && (
              <Tag type="purple" size="sm">
                {objective.department_name}
              </Tag>
            )}
          </div>
          {objective.description && (
            <p style={{ margin: '0 0 0.75rem 0', color: 'var(--cds-text-secondary)', fontSize: '0.875rem' }}>
              {objective.description}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {canEdit && (
            <OverflowMenu size="sm" flipped>
              {onEdit && (
                <OverflowMenuItem
                  itemText="Редактировать"
                  onClick={() => onEdit(objective)}
                />
              )}
              {onAddKeyResult && (
                <OverflowMenuItem
                  itemText="Добавить KR"
                  onClick={() => onAddKeyResult(objective.id)}
                />
              )}
              {onDelete && (
                <OverflowMenuItem
                  itemText="Удалить"
                  isDelete
                  onClick={() => onDelete(objective.id)}
                />
              )}
            </OverflowMenu>
          )}
        </div>
      </div>

      {/* Progress */}
      <div style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
            Прогресс
          </span>
          <span style={{ fontWeight: 600 }}>{objective.progress}%</span>
        </div>
        <ProgressBar
          value={objective.progress}
          max={100}
          status={getProgressStatus(objective.progress)}
          size="small"
          label="Прогресс цели"
          hideLabel
        />
      </div>

      {/* Owner info */}
      {showOwner && objective.owner && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginTop: '1rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--cds-border-subtle-01)'
        }}>
          {objective.owner.avatar ? (
            <img
              src={objective.owner.avatar}
              alt={objective.owner.full_name}
              style={{ width: 24, height: 24, borderRadius: '50%' }}
            />
          ) : (
            <div style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: 'var(--cds-layer-accent-01)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem'
            }}>
              {objective.owner.full_name.charAt(0)}
            </div>
          )}
          <span style={{ fontSize: '0.875rem' }}>
            {objective.owner.full_name}
          </span>
          {objective.owner.position_name && (
            <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
              ({objective.owner.position_name})
            </span>
          )}
        </div>
      )}

      {/* Key Results Preview */}
      {objective.key_results_count > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <Button
            kind="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            renderIcon={isExpanded ? ChevronUp : ChevronDown}
          >
            {objective.key_results_count} ключевых результатов
          </Button>

          {isExpanded && objective.key_results && (
            <div style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
              {objective.key_results.map((kr) => (
                <div
                  key={kr.id}
                  style={{
                    padding: '0.5rem',
                    marginBottom: '0.5rem',
                    background: 'var(--cds-layer-01)',
                    borderRadius: '4px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.875rem' }}>{kr.title}</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{kr.progress}%</span>
                  </div>
                  <ProgressBar
                    value={kr.progress}
                    max={100}
                    size="small"
                    status={getProgressStatus(kr.progress)}
                    label={kr.title}
                    hideLabel
                  />
                  {kr.type === 'quantitative' && kr.target_value && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', marginTop: '0.25rem' }}>
                      {kr.current_value} / {kr.target_value} {kr.unit}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Tile>
  )
}
