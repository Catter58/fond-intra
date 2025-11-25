import { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Grid,
  Column,
  Tile,
  ProgressBar,
  Tag,
  ClickableTile
} from '@carbon/react'
import {
  Crossroads,
  CheckmarkFilled,
  InProgress,
  Time,
  ArrowUp,
  ArrowDown
} from '@carbon/icons-react'
import type { OKRStats } from '../../../types'

interface OKRDashboardProps {
  stats: OKRStats
  loading?: boolean
}

const statusLabels: Record<string, string> = {
  draft: 'Черновик',
  active: 'Активные',
  completed: 'Завершены',
  cancelled: 'Отменены'
}

const levelLabels: Record<string, string> = {
  company: 'Компания',
  department: 'Отдел',
  personal: 'Личные'
}

const OKRDashboard: FC<OKRDashboardProps> = ({ stats, loading }) => {
  const navigate = useNavigate()

  if (loading) {
    return <div>Loading...</div>
  }

  const getProgressColor = (progress: number): string => {
    if (progress >= 70) return 'var(--cds-support-success)'
    if (progress >= 30) return 'var(--cds-support-warning)'
    return 'var(--cds-support-error)'
  }

  const getProgressStatus = (progress: number): 'finished' | 'active' | 'error' => {
    if (progress >= 70) return 'finished'
    if (progress >= 30) return 'active'
    return 'error'
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="okr-dashboard" style={{ padding: '0 1rem' }}>
      {/* Overview Cards */}
      <Grid narrow style={{ marginBottom: '2rem' }}>
        <Column lg={4} md={4} sm={4}>
          <Tile style={{ height: '100%', textAlign: 'center', padding: '1.5rem' }}>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: 600,
              color: 'var(--cds-interactive-01)',
              marginBottom: '0.5rem'
            }}>
              {stats.my_stats.avg_progress}%
            </div>
            <div style={{ color: 'var(--cds-text-secondary)', marginBottom: '1rem' }}>
              Средний прогресс
            </div>
            <ProgressBar
              value={stats.my_stats.avg_progress}
              max={100}
              status={getProgressStatus(stats.my_stats.avg_progress)}
              size="small"
              label="Мой прогресс"
              hideLabel
            />
            <div style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: 'var(--cds-text-secondary)' }}>
              {stats.my_stats.active} активных целей из {stats.my_stats.total}
            </div>
          </Tile>
        </Column>

        <Column lg={4} md={4} sm={4}>
          <Tile style={{ height: '100%', textAlign: 'center', padding: '1.5rem' }}>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: 600,
              color: 'var(--cds-support-info)',
              marginBottom: '0.5rem'
            }}>
              {stats.team_stats.avg_progress}%
            </div>
            <div style={{ color: 'var(--cds-text-secondary)', marginBottom: '1rem' }}>
              Прогресс команды
            </div>
            <ProgressBar
              value={stats.team_stats.avg_progress}
              max={100}
              status={getProgressStatus(stats.team_stats.avg_progress)}
              size="small"
              label="Команда"
              hideLabel
            />
            <div style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: 'var(--cds-text-secondary)' }}>
              {stats.team_stats.active} активных целей из {stats.team_stats.total}
            </div>
          </Tile>
        </Column>

        <Column lg={4} md={4} sm={4}>
          <Tile style={{ height: '100%', textAlign: 'center', padding: '1.5rem' }}>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: 600,
              color: 'var(--cds-support-warning)',
              marginBottom: '0.5rem'
            }}>
              {stats.company_stats.avg_progress}%
            </div>
            <div style={{ color: 'var(--cds-text-secondary)', marginBottom: '1rem' }}>
              Прогресс компании
            </div>
            <ProgressBar
              value={stats.company_stats.avg_progress}
              max={100}
              status={getProgressStatus(stats.company_stats.avg_progress)}
              size="small"
              label="Компания"
              hideLabel
            />
            <div style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: 'var(--cds-text-secondary)' }}>
              {stats.company_stats.active} активных целей из {stats.company_stats.total}
            </div>
          </Tile>
        </Column>

        <Column lg={4} md={4} sm={4}>
          <Tile style={{ height: '100%', padding: '1.5rem' }}>
            <h5 style={{ marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 600 }}>
              Ключевые результаты
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <CheckmarkFilled size={20} style={{ color: 'var(--cds-support-success)' }} />
                <span style={{ flex: 1 }}>Выполнены</span>
                <strong>{stats.key_results.completed}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <InProgress size={20} style={{ color: 'var(--cds-support-warning)' }} />
                <span style={{ flex: 1 }}>В процессе</span>
                <strong>{stats.key_results.in_progress}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Time size={20} style={{ color: 'var(--cds-support-error)' }} />
                <span style={{ flex: 1 }}>Не начаты</span>
                <strong>{stats.key_results.not_started}</strong>
              </div>
            </div>
          </Tile>
        </Column>
      </Grid>

      {/* Status and Level Distribution */}
      <Grid narrow style={{ marginBottom: '2rem' }}>
        <Column lg={8} md={4} sm={4}>
          <Tile style={{ height: '100%', padding: '1.5rem' }}>
            <h5 style={{ marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 600 }}>
              Распределение по статусам
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {Object.entries(stats.my_stats.by_status).map(([status, count]) => (
                <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ minWidth: '100px', fontSize: '0.875rem' }}>
                    {statusLabels[status] || status}
                  </span>
                  <div style={{ flex: 1, height: '8px', background: 'var(--cds-layer-02)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${stats.my_stats.total > 0 ? (count / stats.my_stats.total) * 100 : 0}%`,
                        height: '100%',
                        background: status === 'active' ? 'var(--cds-interactive-01)' :
                                   status === 'completed' ? 'var(--cds-support-success)' :
                                   status === 'draft' ? 'var(--cds-layer-accent-01)' : 'var(--cds-support-error)',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                  <span style={{ minWidth: '30px', textAlign: 'right', fontWeight: 600 }}>{count}</span>
                </div>
              ))}
            </div>
          </Tile>
        </Column>

        <Column lg={8} md={4} sm={4}>
          <Tile style={{ height: '100%', padding: '1.5rem' }}>
            <h5 style={{ marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 600 }}>
              Распределение по уровням
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {Object.entries(stats.my_stats.by_level).map(([level, count]) => (
                <div key={level} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ minWidth: '100px', fontSize: '0.875rem' }}>
                    {levelLabels[level] || level}
                  </span>
                  <div style={{ flex: 1, height: '8px', background: 'var(--cds-layer-02)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${stats.my_stats.total > 0 ? (count / stats.my_stats.total) * 100 : 0}%`,
                        height: '100%',
                        background: level === 'company' ? 'var(--cds-support-info)' :
                                   level === 'department' ? 'var(--cds-support-warning)' : 'var(--cds-interactive-01)',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                  <span style={{ minWidth: '30px', textAlign: 'right', fontWeight: 600 }}>{count}</span>
                </div>
              ))}
            </div>
          </Tile>
        </Column>
      </Grid>

      {/* Progress Distribution Chart */}
      <Grid narrow style={{ marginBottom: '2rem' }}>
        <Column lg={8} md={4} sm={4}>
          <Tile style={{ height: '100%', padding: '1.5rem' }}>
            <h5 style={{ marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 600 }}>
              Распределение прогресса целей
            </h5>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '150px', paddingTop: '1rem' }}>
              {Object.entries(stats.progress_distribution).map(([range, count]) => {
                const maxCount = Math.max(...Object.values(stats.progress_distribution), 1)
                const height = (count / maxCount) * 100
                return (
                  <div key={range} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '100%',
                        height: `${height}%`,
                        minHeight: count > 0 ? '20px' : '4px',
                        background: range === '75-100' ? 'var(--cds-support-success)' :
                                   range === '50-75' ? 'var(--cds-support-warning)' :
                                   range === '25-50' ? 'var(--cds-support-info)' : 'var(--cds-support-error)',
                        borderRadius: '4px 4px 0 0',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        paddingTop: '4px',
                        transition: 'height 0.3s ease'
                      }}
                    >
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'white' }}>{count}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--cds-text-secondary)' }}>
                      {range}%
                    </span>
                  </div>
                )
              })}
            </div>
          </Tile>
        </Column>

        <Column lg={8} md={4} sm={4}>
          <Tile style={{ height: '100%', padding: '1.5rem' }}>
            <h5 style={{ marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 600 }}>
              Топ целей по прогрессу
            </h5>
            {stats.top_objectives.length === 0 ? (
              <div style={{ color: 'var(--cds-text-secondary)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem' }}>
                Нет активных целей
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {stats.top_objectives.map((obj) => (
                  <ClickableTile
                    key={obj.id}
                    onClick={() => navigate(`/okr/${obj.id}`)}
                    style={{ padding: '0.75rem' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Crossroads size={16} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {obj.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                          {obj.key_results_count} KR
                        </div>
                      </div>
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: getProgressColor(obj.progress)
                      }}>
                        {obj.progress}%
                      </div>
                    </div>
                  </ClickableTile>
                ))}
              </div>
            )}
          </Tile>
        </Column>
      </Grid>

      {/* Recent Check-ins */}
      <Grid narrow>
        <Column lg={16} md={8} sm={4}>
          <Tile style={{ padding: '1.5rem' }}>
            <h5 style={{ marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 600 }}>
              Последние обновления
            </h5>
            {stats.recent_check_ins.length === 0 ? (
              <div style={{ color: 'var(--cds-text-secondary)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem' }}>
                Нет недавних обновлений
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {stats.recent_check_ins.map((checkIn) => {
                  const progressDiff = checkIn.new_progress - checkIn.previous_progress
                  return (
                    <div
                      key={checkIn.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '1rem',
                        padding: '0.75rem',
                        background: 'var(--cds-layer-01)',
                        borderRadius: '4px'
                      }}
                    >
                      <div style={{
                        padding: '0.5rem',
                        background: progressDiff >= 0 ? 'var(--cds-support-success)' : 'var(--cds-support-error)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {progressDiff >= 0 ? (
                          <ArrowUp size={16} style={{ color: 'white' }} />
                        ) : (
                          <ArrowDown size={16} style={{ color: 'white' }} />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>
                          {checkIn.key_result_title}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)', marginBottom: '0.25rem' }}>
                          {checkIn.objective_title}
                        </div>
                        {checkIn.comment && (
                          <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                            {checkIn.comment}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ color: 'var(--cds-text-secondary)' }}>{checkIn.previous_progress}%</span>
                          <span>→</span>
                          <Tag type={progressDiff >= 0 ? 'green' : 'red'} size="sm">
                            {checkIn.new_progress}%
                          </Tag>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                          {formatDate(checkIn.created_at)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Tile>
        </Column>
      </Grid>
    </div>
  )
}

export default OKRDashboard
