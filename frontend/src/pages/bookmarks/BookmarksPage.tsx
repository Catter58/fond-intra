import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ContentSwitcher, Switch, Tile, Button, Loading } from '@carbon/react'
import { Bookmark, User, Document, TrashCan } from '@carbon/icons-react'
import { interactionsApi, BookmarkedUser, BookmarkedNews } from '@/api/endpoints/interactions'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toaster'
import { formatDate } from '@/lib/utils'

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function BookmarksPage() {
  const [activeTab, setActiveTab] = useState(0) // 0 = users, 1 = news
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const { data: bookmarkedUsers, isLoading: usersLoading } = useQuery({
    queryKey: ['bookmarked-users'],
    queryFn: interactionsApi.getBookmarkedUsers,
  })

  const { data: bookmarkedNews, isLoading: newsLoading } = useQuery({
    queryKey: ['bookmarked-news'],
    queryFn: interactionsApi.getBookmarkedNews,
  })

  const removeBookmarkMutation = useMutation({
    mutationFn: (id: number) => interactionsApi.deleteBookmark(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarked-users'] })
      queryClient.invalidateQueries({ queryKey: ['bookmarked-news'] })
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
      showToast({ title: 'Удалено из избранного', kind: 'success' })
    },
    onError: () => {
      showToast({ title: 'Ошибка удаления', kind: 'error' })
    },
  })

  const isLoading = activeTab === 0 ? usersLoading : newsLoading

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Bookmark size={28} />
          Избранное
        </h1>
      </div>

      <ContentSwitcher
        onChange={({ index }) => setActiveTab(index as number)}
        selectedIndex={activeTab}
        size="lg"
        style={{ marginBottom: '1.5rem' }}
      >
        <Switch name="users">
          <User size={16} style={{ marginRight: '0.5rem' }} />
          Сотрудники ({bookmarkedUsers?.length || 0})
        </Switch>
        <Switch name="news">
          <Document size={16} style={{ marginRight: '0.5rem' }} />
          Новости ({bookmarkedNews?.length || 0})
        </Switch>
      </ContentSwitcher>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loading withOverlay={false} />
        </div>
      ) : activeTab === 0 ? (
        // Users tab
        bookmarkedUsers && bookmarkedUsers.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {bookmarkedUsers.map((user: BookmarkedUser) => (
              <Tile key={user.id} style={{ padding: 0, overflow: 'hidden' }}>
                <Link
                  to={`/employees/${user.id}`}
                  style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
                >
                  <div style={{ display: 'flex', gap: '1rem', padding: '1rem' }}>
                    <div
                      className="list-item-avatar"
                      style={{ width: '56px', height: '56px', flexShrink: 0 }}
                    >
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.full_name} />
                      ) : (
                        getInitials(user.full_name || '')
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{user.full_name}</p>
                      {user.position && (
                        <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)', marginBottom: '0.25rem' }}>
                          {user.position.name}
                        </p>
                      )}
                      {user.department && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)' }}>
                          {user.department.name}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 1rem',
                  borderTop: '1px solid var(--cds-border-subtle-01)',
                  background: 'var(--cds-layer-02)',
                }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)' }}>
                    Добавлено: {formatDate(user.bookmarked_at)}
                  </span>
                  <Button
                    kind="ghost"
                    size="sm"
                    hasIconOnly
                    renderIcon={TrashCan}
                    iconDescription="Удалить"
                    onClick={(e) => {
                      e.preventDefault()
                      removeBookmarkMutation.mutate(user.bookmark_id)
                    }}
                  />
                </div>
              </Tile>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={User}
            title="Нет избранных сотрудников"
            description="Добавляйте сотрудников в избранное, чтобы быстро находить их профили"
          />
        )
      ) : (
        // News tab
        bookmarkedNews && bookmarkedNews.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {bookmarkedNews.map((news: BookmarkedNews) => (
              <Tile key={news.id} style={{ padding: 0, overflow: 'hidden' }}>
                <Link
                  to={`/news/${news.id}`}
                  style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
                >
                  {news.cover_image && (
                    <div style={{ height: '140px', overflow: 'hidden' }}>
                      <img
                        src={news.cover_image}
                        alt={news.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  )}
                  <div style={{ padding: '1rem' }}>
                    <p style={{ fontWeight: 600, marginBottom: '0.5rem', lineHeight: 1.3 }}>{news.title}</p>
                    {news.excerpt && (
                      <p style={{
                        fontSize: '0.875rem',
                        color: 'var(--cds-text-secondary)',
                        marginBottom: '0.5rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {news.excerpt}
                      </p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--cds-text-helper)' }}>
                      {news.author && (
                        <>
                          <span>{news.author.full_name}</span>
                          <span>•</span>
                        </>
                      )}
                      <span>{formatDate(news.published_at)}</span>
                    </div>
                  </div>
                </Link>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 1rem',
                  borderTop: '1px solid var(--cds-border-subtle-01)',
                  background: 'var(--cds-layer-02)',
                }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)' }}>
                    В избранном с: {formatDate(news.bookmarked_at)}
                  </span>
                  <Button
                    kind="ghost"
                    size="sm"
                    hasIconOnly
                    renderIcon={TrashCan}
                    iconDescription="Удалить"
                    onClick={(e) => {
                      e.preventDefault()
                      removeBookmarkMutation.mutate(news.bookmark_id)
                    }}
                  />
                </div>
              </Tile>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Document}
            title="Нет избранных новостей"
            description="Добавляйте новости в избранное, чтобы легко возвращаться к ним"
          />
        )
      )}
    </div>
  )
}
