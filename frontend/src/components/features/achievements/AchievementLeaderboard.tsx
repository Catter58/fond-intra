import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Select, SelectItem, Loading, Tile } from '@carbon/react'
import { Trophy, StarFilled } from '@carbon/icons-react'
import { achievementsApi } from '@/api/endpoints/achievements'
import { Avatar } from '@/components/ui/Avatar'
import type { LeaderboardEntry } from '@/types'

interface AchievementLeaderboardProps {
  limit?: number
  showFilters?: boolean
  compact?: boolean
}

const periodLabels = {
  week: 'За неделю',
  month: 'За месяц',
  quarter: 'За квартал',
  year: 'За год',
  all: 'За все время',
}

export function AchievementLeaderboard({
  limit = 20,
  showFilters = true,
  compact = false
}: AchievementLeaderboardProps) {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year' | 'all'>('month')

  const { data: leaderboard = [], isLoading } = useQuery({
    queryKey: ['achievement-leaderboard', period, limit],
    queryFn: () => achievementsApi.getLeaderboard({ period, limit }),
  })

  const getMedalColor = (rank: number) => {
    if (rank === 1) return '#FFD700' // Gold
    if (rank === 2) return '#C0C0C0' // Silver
    if (rank === 3) return '#CD7F32' // Bronze
    return 'transparent'
  }

  const getMedalIcon = (rank: number) => {
    if (rank <= 3) {
      return <Trophy size={24} style={{ color: getMedalColor(rank) }} />
    }
    return null
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <Loading withOverlay={false} />
      </div>
    )
  }

  return (
    <div>
      {showFilters && (
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'end' }}>
          <Select
            id="period-select"
            labelText="Период"
            value={period}
            onChange={(e) => setPeriod(e.target.value as typeof period)}
            size="md"
            style={{ maxWidth: '200px' }}
          >
            {Object.entries(periodLabels).map(([value, label]) => (
              <SelectItem key={value} value={value} text={label} />
            ))}
          </Select>
        </div>
      )}

      {leaderboard.length === 0 ? (
        <Tile>
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--cds-text-secondary)' }}>
            Пока нет данных за выбранный период
          </p>
        </Tile>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '0.5rem' : '0.75rem' }}>
          {leaderboard.map((entry: LeaderboardEntry) => (
            <Tile
              key={entry.user.id}
              style={{
                padding: compact ? '0.75rem 1rem' : '1rem 1.5rem',
                border: entry.rank <= 3 ? `2px solid ${getMedalColor(entry.rank)}` : undefined,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {/* Rank and Medal */}
                <div
                  style={{
                    width: compact ? '40px' : '48px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {entry.rank <= 3 ? (
                    <>
                      {getMedalIcon(entry.rank)}
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--cds-text-secondary)' }}>
                        #{entry.rank}
                      </span>
                    </>
                  ) : (
                    <span style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--cds-text-secondary)' }}>
                      #{entry.rank}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <Avatar
                  src={entry.user.avatar}
                  name={entry.user.full_name}
                  size={compact ? 40 : 48}
                  showIcon={false}
                />

                {/* User Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: compact ? '0.875rem' : '1rem', color: 'var(--cds-text-primary)' }}>
                    {entry.user.full_name}
                  </div>
                  {entry.user.position && (
                    <div style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
                      {entry.user.position.name}
                    </div>
                  )}
                  {!compact && entry.recent_achievement && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)', marginTop: '0.25rem' }}>
                      Последнее: {entry.recent_achievement.icon} {entry.recent_achievement.name}
                    </div>
                  )}
                </div>

                {/* Achievement Count */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    backgroundColor: 'var(--cds-layer-01)',
                    flexShrink: 0,
                  }}
                >
                  <StarFilled size={20} style={{ color: '#FFD700' }} />
                  <span style={{ fontSize: compact ? '1.25rem' : '1.5rem', fontWeight: 600, color: 'var(--cds-text-primary)' }}>
                    {entry.count}
                  </span>
                </div>
              </div>
            </Tile>
          ))}
        </div>
      )}
    </div>
  )
}
