import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Tile, Button, Pagination, Loading } from '@carbon/react'
import { Add, Trophy, ChartLineSmooth } from '@carbon/icons-react'
import { AwardAchievementModal } from '@/components/features/achievements/AwardAchievementModal'
import { achievementsApi } from '@/api/endpoints/achievements'
import { formatDate } from '@/lib/utils'
import { EmptyState } from '@/components/ui/EmptyState'

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function AchievementsPage() {
  const [page, setPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { data: achievementTypes } = useQuery({
    queryKey: ['achievement-types'],
    queryFn: achievementsApi.getTypes,
  })

  const { data: feed, isLoading } = useQuery({
    queryKey: ['achievements', 'feed', page],
    queryFn: () => achievementsApi.getFeed({ page, page_size: 20 }),
  })

  const { data: stats } = useQuery({
    queryKey: ['achievements', 'stats'],
    queryFn: achievementsApi.getStats,
  })

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="page-title">Достижения</h1>
          <Button renderIcon={Add} onClick={() => setShowCreateModal(true)}>
            Наградить коллегу
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '1.5rem' }}>
        {/* Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Tile>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, marginBottom: '1rem' }}>
              <ChartLineSmooth size={20} />
              Статистика
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>Всего наград</span>
                <span style={{ fontWeight: 600 }}>{stats?.total_awards || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>За месяц</span>
                <span style={{ fontWeight: 600 }}>{stats?.this_month || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>Типов наград</span>
                <span style={{ fontWeight: 600 }}>{achievementTypes?.length || 0}</span>
              </div>
            </div>
          </Tile>

          {/* Achievement types */}
          <Tile>
            <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Типы наград</h3>
            {achievementTypes && achievementTypes.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {achievementTypes.map((type) => (
                  <div
                    key={type.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.5rem',
                    }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>{type.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {type.name}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {type.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>Типы наград не созданы</p>
            )}
          </Tile>
        </div>

        {/* Feed */}
        <Tile>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, marginBottom: '1rem' }}>
            <Trophy size={20} />
            Лента достижений
          </h3>
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <Loading withOverlay={false} />
            </div>
          ) : feed?.results && feed.results.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {feed.results.map((award) => (
                <div
                  key={award.id}
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    padding: '1rem',
                    background: 'var(--cds-layer-02)',
                  }}
                >
                  <div className="list-item-avatar" style={{ width: '48px', height: '48px', flexShrink: 0 }}>
                    {award.recipient?.avatar ? (
                      <img src={award.recipient.avatar} alt={award.recipient.full_name} />
                    ) : (
                      getInitials(award.recipient?.full_name || '')
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <div>
                        <p style={{ fontWeight: 500 }}>
                          {award.recipient?.full_name || 'Неизвестный'}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                          <span style={{ fontSize: '1.25rem' }}>{award.achievement?.icon || '🏆'}</span>
                          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--cds-link-primary)' }}>
                            {award.achievement?.name || 'Достижение'}
                          </span>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)', flexShrink: 0 }}>
                        {formatDate(award.awarded_at)}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)', marginTop: '0.5rem' }}>
                      {award.comment}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)', marginTop: '0.5rem' }}>
                      От: {award.awarded_by?.full_name || 'Система'}
                    </p>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {feed.count > 20 && (
                <Pagination
                  totalItems={feed.count}
                  pageSize={20}
                  pageSizes={[20]}
                  page={page}
                  onChange={({ page: newPage }) => newPage && setPage(newPage)}
                  itemsPerPageText="Элементов на странице"
                  pageRangeText={(_current, total) => `из ${total} страниц`}
                  itemRangeText={(min, max, total) => `${min}–${max} из ${total} элементов`}
                />
              )}
            </div>
          ) : (
            <EmptyState
              icon={Trophy}
              title="Пока нет достижений"
              description="Наградите коллегу за отличную работу и станьте первым!"
              action={{
                label: 'Наградить коллегу',
                onClick: () => setShowCreateModal(true),
              }}
              size="sm"
            />
          )}
        </Tile>
      </div>

      <AwardAchievementModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  )
}
