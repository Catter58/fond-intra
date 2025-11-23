import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Tile, Button, ContentSwitcher, Switch, Loading } from '@carbon/react'
import { Notification, Checkmark, CheckmarkOutline, Settings } from '@carbon/icons-react'
import { notificationsApi } from '@/api/endpoints/notifications'
import { formatDate } from '@/lib/utils'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Notification as NotificationType } from '@/types'

export function NotificationsPage() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState(0) // 0 = all, 1 = unread

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: () => notificationsApi.getList({ is_read: filter === 0 ? undefined : false }),
  })

  const markAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'achievement':
        return '🏆'
      case 'news':
        return '📰'
      case 'comment':
        return '💬'
      case 'birthday':
        return '🎂'
      default:
        return '🔔'
    }
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="page-title">Уведомления</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Button
              kind="tertiary"
              size="sm"
              renderIcon={CheckmarkOutline}
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              Прочитать все
            </Button>
            <Button
              kind="ghost"
              hasIconOnly
              renderIcon={Settings}
              iconDescription="Настройки"
              as={Link}
              to="/notifications/settings"
            />
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ marginBottom: '1.5rem' }}>
        <ContentSwitcher
          onChange={(e) => e.index !== undefined && setFilter(e.index)}
          selectedIndex={filter}
          size="sm"
        >
          <Switch name="all">Все</Switch>
          <Switch name="unread">Непрочитанные</Switch>
        </ContentSwitcher>
      </div>

      {/* Notifications list */}
      <Tile>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <Loading withOverlay={false} />
          </div>
        ) : data?.results && data.results.length > 0 ? (
          <div>
            {data.results.map((notification: NotificationType, index: number) => (
              <div
                key={notification.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  padding: '1rem',
                  background: !notification.is_read ? 'var(--cds-layer-02)' : 'transparent',
                  borderBottom: index < data.results.length - 1 ? '1px solid var(--cds-border-subtle-01)' : 'none',
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>{getNotificationIcon(notification.type)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: !notification.is_read ? 500 : 400 }}>
                    {notification.title}
                  </p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)', marginTop: '0.25rem' }}>
                    {notification.message}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)', marginTop: '0.5rem' }}>
                    {formatDate(notification.created_at)}
                  </p>
                </div>
                {!notification.is_read && (
                  <Button
                    kind="ghost"
                    hasIconOnly
                    renderIcon={Checkmark}
                    iconDescription="Отметить как прочитанное"
                    size="sm"
                    onClick={() => markAsReadMutation.mutate(notification.id)}
                    disabled={markAsReadMutation.isPending}
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Notification}
            title={filter === 1 ? 'Нет непрочитанных уведомлений' : 'Уведомлений пока нет'}
            description={
              filter === 1
                ? 'Все уведомления прочитаны!'
                : 'Здесь будут появляться уведомления о важных событиях.'
            }
            size="sm"
          />
        )}
      </Tile>
    </div>
  )
}
