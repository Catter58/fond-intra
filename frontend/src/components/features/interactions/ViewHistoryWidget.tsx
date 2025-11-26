import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Tile, Button } from '@carbon/react'
import { Time, TrashCan, User } from '@carbon/icons-react'
import { interactionsApi, ViewHistoryItem } from '@/api/endpoints/interactions'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toaster'

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'только что'
  if (minutes < 60) return `${minutes} мин. назад`
  if (hours < 24) return `${hours} ч. назад`
  if (days < 7) return `${days} дн. назад`
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

interface ViewHistoryWidgetProps {
  standalone?: boolean
}

export function ViewHistoryWidget({ standalone = false }: ViewHistoryWidgetProps) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const { data: history, isLoading } = useQuery({
    queryKey: ['view-history'],
    queryFn: interactionsApi.getViewHistory,
  })

  const clearMutation = useMutation({
    mutationFn: interactionsApi.clearViewHistory,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['view-history'] })
      showToast({ title: `Очищено ${data.cleared} записей`, kind: 'success' })
    },
  })

  const content = (
    <>
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: '48px', background: 'var(--cds-skeleton-background)', borderRadius: '4px' }} />
          ))}
        </div>
      ) : !history || history.length === 0 ? (
        <EmptyState
          icon={User}
          title="Нет просмотренных профилей"
          description="Здесь будут отображаться недавно просмотренные профили сотрудников"
          size="sm"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {history.slice(0, 5).map((item: ViewHistoryItem) => (
            <Link
              key={item.id}
              to={`/employees/${item.viewed_user.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.5rem',
                textDecoration: 'none',
                color: 'inherit',
                background: 'var(--cds-layer-02)',
                borderRadius: '4px',
              }}
            >
              <div
                className="list-item-avatar"
                style={{ width: '36px', height: '36px', fontSize: '0.75rem', flexShrink: 0 }}
              >
                {item.viewed_user.avatar ? (
                  <img src={item.viewed_user.avatar} alt={item.viewed_user.full_name} />
                ) : (
                  getInitials(item.viewed_user.full_name || '')
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 500, fontSize: '0.875rem', margin: 0 }}>
                  {item.viewed_user.full_name}
                </p>
                {item.viewed_user.position && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)', margin: 0 }}>
                    {item.viewed_user.position.name}
                  </p>
                )}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)', flexShrink: 0 }}>
                {formatTimeAgo(item.viewed_at)}
              </span>
            </Link>
          ))}
          {history.length > 0 && (
            <Button
              kind="ghost"
              size="sm"
              renderIcon={TrashCan}
              onClick={() => clearMutation.mutate()}
              disabled={clearMutation.isPending}
              style={{ marginTop: '0.5rem' }}
            >
              Очистить историю
            </Button>
          )}
        </div>
      )}
    </>
  )

  // For dashboard integration (no wrapper)
  if (!standalone) {
    return content
  }

  // Standalone version with Tile wrapper
  return (
    <Tile style={{ height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <Time size={20} />
        <h3 style={{ fontWeight: 600, margin: 0 }}>Недавно просмотренные</h3>
      </div>
      {content}
    </Tile>
  )
}
