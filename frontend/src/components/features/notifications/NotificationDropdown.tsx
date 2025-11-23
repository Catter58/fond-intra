import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@carbon/react'
import { Notification, Checkmark, ArrowRight } from '@carbon/icons-react'
import { notificationsApi } from '@/api/endpoints/notifications'
import { formatDate } from '@/lib/utils'
import type { Notification as NotificationType } from '@/types'

export function NotificationDropdown() {
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)

  const { data: notifications } = useQuery({
    queryKey: ['notifications', 'dropdown'],
    queryFn: () => notificationsApi.getList({ page_size: 5 }),
    refetchInterval: 30000,
  })

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationsApi.getUnreadCount,
    refetchInterval: 30000,
  })

  const markAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'achievement': return '🏆'
      case 'news': return '📰'
      case 'comment': return '💬'
      case 'birthday': return '🎂'
      default: return '🔔'
    }
  }

  const handleNotificationClick = (notification: NotificationType) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id)
    }
    setIsOpen(false)
  }

  return (
    <div style={{ position: 'relative' }}>
      <Button
        kind="ghost"
        hasIconOnly
        renderIcon={Notification}
        iconDescription="Уведомления"
        onClick={() => setIsOpen(!isOpen)}
        style={{ position: 'relative' }}
      >
        {unreadCount && unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              width: '20px',
              height: '20px',
              background: 'var(--cds-support-error)',
              color: 'white',
              fontSize: '0.75rem',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 40,
            }}
            onClick={() => setIsOpen(false)}
          />
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: '100%',
              marginTop: '0.5rem',
              width: '320px',
              background: 'var(--cds-layer-01)',
              border: '1px solid var(--cds-border-subtle-01)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              zIndex: 50,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderBottom: '1px solid var(--cds-border-subtle-01)',
              }}
            >
              <span style={{ fontWeight: 500 }}>Уведомления</span>
              {unreadCount && unreadCount > 0 && (
                <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                  {unreadCount} новых
                </span>
              )}
            </div>

            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
              {notifications?.results && notifications.results.length > 0 ? (
                notifications.results.map((notification) => (
                  <Link
                    key={notification.id}
                    to={notification.link || '/notifications'}
                    onClick={() => handleNotificationClick(notification)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      borderBottom: '1px solid var(--cds-border-subtle-01)',
                      background: !notification.is_read ? 'var(--cds-layer-02)' : 'transparent',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: !notification.is_read ? 500 : 400,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {notification.title}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)', marginTop: '0.25rem' }}>
                        {formatDate(notification.created_at)}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          markAsReadMutation.mutate(notification.id)
                        }}
                        style={{
                          padding: '0.25rem',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--cds-text-secondary)',
                        }}
                      >
                        <Checkmark size={16} />
                      </button>
                    )}
                  </Link>
                ))
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--cds-text-secondary)', fontSize: '0.875rem' }}>
                  Нет уведомлений
                </div>
              )}
            </div>

            <div style={{ padding: '0.5rem', borderTop: '1px solid var(--cds-border-subtle-01)' }}>
              <Link
                to="/notifications"
                onClick={() => setIsOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem',
                  fontSize: '0.875rem',
                  color: 'var(--cds-link-primary)',
                  textDecoration: 'none',
                }}
              >
                Все уведомления
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
