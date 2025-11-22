import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Check, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { notificationsApi } from '@/api/endpoints/notifications'
import { formatDate } from '@/lib/utils'
import type { Notification } from '@/types'

export function NotificationDropdown() {
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)

  const { data: notifications } = useQuery({
    queryKey: ['notifications', 'dropdown'],
    queryFn: () => notificationsApi.getList({ page_size: 5 }),
    refetchInterval: 30000, // Poll every 30 seconds
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

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id)
    }
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-support-error text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-80 bg-card border rounded-sm shadow-lg z-50">
            <div className="flex items-center justify-between p-3 border-b">
              <span className="font-medium">Уведомления</span>
              {unreadCount && unreadCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {unreadCount} новых
                </span>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications?.results && notifications.results.length > 0 ? (
                notifications.results.map((notification) => (
                  <Link
                    key={notification.id}
                    to={notification.link || '/notifications'}
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex items-start gap-3 p-3 hover:bg-secondary transition-colors border-b last:border-b-0 ${
                      !notification.is_read ? 'bg-secondary' : ''
                    }`}
                  >
                    <span className="text-xl shrink-0">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm line-clamp-2 ${!notification.is_read ? 'font-medium' : ''}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
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
                        className="p-1 hover:bg-accent rounded"
                      >
                        <Check className="h-4 w-4 text-muted-foreground" />
                      </button>
                    )}
                  </Link>
                ))
              ) : (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  Нет уведомлений
                </div>
              )}
            </div>

            <div className="p-2 border-t">
              <Link
                to="/notifications"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 p-2 text-sm text-primary hover:bg-secondary rounded transition-colors"
              >
                Все уведомления
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
