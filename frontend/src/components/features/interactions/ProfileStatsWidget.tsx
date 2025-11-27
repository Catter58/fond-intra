import { useQuery } from '@tanstack/react-query'
import { Tile } from '@carbon/react'
import { Analytics, View, Trophy, ThumbsUp, Catalog, Chat, Document, Checkmark, type CarbonIconType } from '@carbon/icons-react'
import { interactionsApi } from '@/api/endpoints/interactions'

interface StatItemProps {
  icon: CarbonIconType
  label: string
  value: number
  color?: string
}

function StatItem({ icon: Icon, label, value, color }: StatItemProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.5rem',
      background: 'var(--cds-layer-02)',
      borderRadius: '4px',
    }}>
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        background: color || 'var(--cds-layer-selected-01)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={16} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)', margin: 0 }}>{label}</p>
        <p style={{ fontWeight: 600, margin: 0 }}>{value}</p>
      </div>
    </div>
  )
}

interface ProfileStatsWidgetProps {
  userId?: number
  compact?: boolean
}

export function ProfileStatsWidget({ userId, compact = false }: ProfileStatsWidgetProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['profile-stats', userId],
    queryFn: () => interactionsApi.getProfileStats(userId),
  })

  if (isLoading) {
    return (
      <Tile style={{ height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Analytics size={20} />
          <h3 style={{ fontWeight: 600, margin: 0 }}>Статистика профиля</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: '56px', background: 'var(--cds-skeleton-background)', borderRadius: '4px' }} />
          ))}
        </div>
      </Tile>
    )
  }

  if (!stats) return null

  const statItems: { icon: CarbonIconType; label: string; value: number; color?: string }[] = [
    { icon: View, label: 'Просмотры профиля', value: stats.profile_views, color: 'rgba(69, 137, 255, 0.2)' },
    { icon: Trophy, label: 'Достижения', value: stats.achievements_count, color: 'rgba(36, 161, 72, 0.2)' },
    { icon: ThumbsUp, label: 'Kudos получено', value: stats.kudos_received, color: 'rgba(250, 77, 86, 0.2)' },
    { icon: Catalog, label: 'Навыки', value: stats.skills_count, color: 'rgba(136, 104, 255, 0.2)' },
    { icon: Checkmark, label: 'Подтверждения навыков', value: stats.endorsements_received, color: 'rgba(0, 157, 154, 0.2)' },
    { icon: Document, label: 'Новости', value: stats.news_count, color: 'rgba(248, 131, 121, 0.2)' },
    { icon: Chat, label: 'Комментарии', value: stats.comments_count, color: 'rgba(255, 180, 0, 0.2)' },
  ]

  // Filter to top items for compact mode
  const displayItems = compact ? statItems.slice(0, 4) : statItems

  return (
    <Tile style={{ height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <Analytics size={20} />
        <h3 style={{ fontWeight: 600, margin: 0 }}>Статистика профиля</h3>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: compact ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '0.5rem',
      }}>
        {displayItems.map((item) => (
          <StatItem key={item.label} {...item} />
        ))}
      </div>
    </Tile>
  )
}
