import { useQuery } from '@tanstack/react-query'
import { Tile, ProgressBar, Loading, Accordion, AccordionItem } from '@carbon/react'
import { CheckmarkFilled } from '@carbon/icons-react'
import { achievementsApi } from '@/api/endpoints/achievements'
import type { AchievementProgressGroup } from '@/types'

interface AchievementProgressProps {
  userId?: number
  showTitle?: boolean
}

export function AchievementProgress({ userId, showTitle = true }: AchievementProgressProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['achievement-progress', userId],
    queryFn: () => achievementsApi.getProgress(userId),
  })

  if (isLoading) {
    return (
      <Tile>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <Loading withOverlay={false} />
        </div>
      </Tile>
    )
  }

  if (!data?.progress || data.progress.length === 0) {
    return (
      <Tile>
        {showTitle && <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Прогресс к достижениям</h3>}
        <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)', textAlign: 'center', padding: '2rem' }}>
          Автоматические достижения не настроены
        </p>
      </Tile>
    )
  }

  return (
    <Tile>
      {showTitle && <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Прогресс к достижениям</h3>}

      <Accordion>
        {data.progress.map((group: AchievementProgressGroup) => (
          <AccordionItem
            key={group.trigger_type}
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span style={{ fontWeight: 500 }}>{group.trigger_type_display}</span>
                <span
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--cds-text-secondary)',
                    fontWeight: 400,
                  }}
                >
                  {group.current_value}
                </span>
              </div>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0' }}>
              {group.achievements.map((achievement) => (
                <div
                  key={achievement.achievement.id}
                  style={{
                    padding: '0.75rem',
                    background: achievement.is_achieved ? 'var(--cds-layer-selected-01)' : 'var(--cds-layer-02)',
                    border: achievement.is_achieved ? '1px solid var(--cds-border-interactive)' : '1px solid var(--cds-border-subtle-01)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{achievement.achievement.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <p style={{ fontWeight: 500, fontSize: '0.875rem' }}>{achievement.achievement.name}</p>
                        {achievement.is_achieved && (
                          <CheckmarkFilled size={16} style={{ color: 'var(--cds-support-success)' }} />
                        )}
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                        {achievement.achievement.description}
                      </p>
                    </div>
                  </div>

                  {!achievement.is_achieved && (
                    <>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <ProgressBar
                          value={achievement.progress_percentage}
                          max={100}
                          label=""
                          hideLabel
                          size="small"
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--cds-text-helper)' }}>
                        <span>
                          {achievement.current_value} / {achievement.achievement.trigger_value}
                        </span>
                        <span>
                          {achievement.progress_percentage}%
                          {achievement.remaining > 0 && ` • Осталось: ${achievement.remaining}`}
                        </span>
                      </div>
                    </>
                  )}

                  {achievement.is_achieved && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--cds-support-success)', fontWeight: 500 }}>
                      ✓ Достижение получено
                    </div>
                  )}
                </div>
              ))}
            </div>
          </AccordionItem>
        ))}
      </Accordion>
    </Tile>
  )
}
