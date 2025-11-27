import { useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { Tile, ProgressBar, Tag, Button } from '@carbon/react'
import {
  UserMultiple,
  Trophy,
  Document,
  Events,
  Favorite,
  ChartBullet,
  Calendar,
  Idea,
  Settings,
  Checkmark,
  Reset,
  Time,
  Help,
} from '@carbon/icons-react'
import { useAuthStore } from '@/store/authStore'
import { useDashboardStore, getOrderedWidgets, type WidgetId } from '@/store/dashboardStore'
import { usersApi } from '@/api/endpoints/users'
import { newsApi } from '@/api/endpoints/news'
import { achievementsApi } from '@/api/endpoints/achievements'
import { kudosApi } from '@/api/endpoints/kudos'
import { ideasApi } from '@/api/endpoints/ideas'
import { bookingsApi } from '@/api/endpoints/bookings'
import * as okrApi from '@/api/endpoints/okr'
import { formatDate } from '@/lib/utils'
import { AchievementLeaderboard } from '@/components/features/achievements'
import { DashboardWidget } from '@/components/features/dashboard'
import { ViewHistoryWidget } from '@/components/features/interactions'
import { OnboardingTour, useModuleTour } from '@/components/ui/OnboardingTour'

export function DashboardPage() {
  const { user } = useAuthStore()
  const dashboardStore = useDashboardStore()
  const orderedWidgets = getOrderedWidgets(dashboardStore)
  const { showTour, handleComplete, resetTour } = useModuleTour('dashboard')

  // Load settings from server on mount
  useEffect(() => {
    if (!dashboardStore.isSynced) {
      dashboardStore.loadFromServer()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboardStore.isSynced])

  // Data queries
  const { data: birthdaysData } = useQuery({
    queryKey: ['birthdays'],
    queryFn: () => usersApi.getBirthdays(7),
  })

  const { data: newsData } = useQuery({
    queryKey: ['news', 'latest'],
    queryFn: () => newsApi.getList({ page_size: 5 }),
  })

  const { data: achievementsData } = useQuery({
    queryKey: ['achievements', 'feed'],
    queryFn: () => achievementsApi.getFeed({ page_size: 5 }),
  })

  const { data: statsData } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => usersApi.getDashboardStats(),
  })

  const { data: kudosData } = useQuery({
    queryKey: ['kudos', 'feed', 'latest'],
    queryFn: () => kudosApi.getList({ page_size: 5 }),
  })

  const { data: myOkrData } = useQuery({
    queryKey: ['okr', 'my', 'dashboard'],
    queryFn: () => okrApi.getMyObjectives({ status: 'active' }),
  })

  const { data: myBookingsData } = useQuery({
    queryKey: ['bookings', 'my', 'dashboard'],
    queryFn: () => bookingsApi.getMyBookings(true),
  })

  const { data: topIdeasData } = useQuery({
    queryKey: ['ideas', 'top', 'dashboard'],
    queryFn: () => ideasApi.getList({ ordering: '-votes_score', status: 'new' }),
  })

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = dashboardStore.widgetOrder.indexOf(active.id as WidgetId)
      const newIndex = dashboardStore.widgetOrder.indexOf(over.id as WidgetId)

      const newOrder = [...dashboardStore.widgetOrder]
      newOrder.splice(oldIndex, 1)
      newOrder.splice(newIndex, 0, active.id as WidgetId)

      dashboardStore.reorderWidgets(newOrder)
    }
  }, [dashboardStore])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Widgets content - defined as regular object, not memoized (JSX in useMemo causes issues)
  const widgetContent: Record<WidgetId, { icon: JSX.Element; content: JSX.Element }> = {
    stats: {
      icon: <UserMultiple size={20} />,
      content: (
        <div className="stats-grid">
          <div className="stat-tile">
            <div className="stat-icon stat-icon--blue">
              <UserMultiple size={24} />
            </div>
            <div>
              <div className="stat-value">{statsData?.users_count ?? '--'}</div>
              <div className="stat-label">Сотрудников</div>
            </div>
          </div>
          <div className="stat-tile">
            <div className="stat-icon stat-icon--green">
              <Trophy size={24} />
            </div>
            <div>
              <div className="stat-value">{statsData?.achievements_count ?? '--'}</div>
              <div className="stat-label">Достижений</div>
            </div>
          </div>
          <div className="stat-tile">
            <div className="stat-icon stat-icon--purple">
              <Document size={24} />
            </div>
            <div>
              <div className="stat-value">{statsData?.news_count ?? '--'}</div>
              <div className="stat-label">Новостей</div>
            </div>
          </div>
          <div className="stat-tile">
            <div className="stat-icon stat-icon--orange">
              <Events size={24} />
            </div>
            <div>
              <div className="stat-value">{birthdaysData?.length || 0}</div>
              <div className="stat-label">ДР на этой неделе</div>
            </div>
          </div>
        </div>
      ),
    },
    birthdays: {
      icon: <Events size={20} />,
      content: birthdaysData && birthdaysData.length > 0 ? (
        <div>
          {birthdaysData.map((person) => (
            <Link key={person.id} to={`/employees/${person.id}`} className="list-item">
              <div className="list-item-avatar">
                {person.avatar ? (
                  <img src={person.avatar} alt={person.full_name} />
                ) : (
                  getInitials(person.full_name)
                )}
              </div>
              <div className="list-item-content">
                <div className="list-item-title">{person.full_name}</div>
                <div className="list-item-subtitle">
                  {person.birth_date && formatDate(person.birth_date)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
          Нет ближайших дней рождения
        </p>
      ),
    },
    news: {
      icon: <Document size={20} />,
      content: newsData?.results && newsData.results.length > 0 ? (
        <div>
          {newsData.results.map((item) => (
            <Link
              key={item.id}
              to={`/news/${item.id}`}
              className="list-item"
              style={{ flexDirection: 'column', alignItems: 'flex-start' }}
            >
              <div className="list-item-title" style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                whiteSpace: 'normal'
              }}>
                {item.title}
              </div>
              <div className="list-item-subtitle" style={{ marginTop: '0.25rem' }}>
                {formatDate(item.created_at)}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>Нет новостей</p>
      ),
    },
    achievements: {
      icon: <Trophy size={20} />,
      content: achievementsData?.results && achievementsData.results.length > 0 ? (
        <div>
          {achievementsData.results.slice(0, 3).map((award) => (
            <div key={award.id} className="list-item">
              <div className="list-item-avatar">
                {award.recipient?.avatar ? (
                  <img src={award.recipient.avatar} alt={award.recipient.full_name} />
                ) : (
                  getInitials(award.recipient?.full_name || '')
                )}
              </div>
              <div className="list-item-content">
                <div className="list-item-title">
                  {award.recipient?.full_name || 'Неизвестный'}
                </div>
                <div className="list-item-subtitle">
                  {award.achievement?.name || 'Достижение'}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>Нет достижений</p>
      ),
    },
    leaderboard: {
      icon: <Trophy size={20} />,
      content: <AchievementLeaderboard limit={3} showFilters={false} compact />,
    },
    kudos: {
      icon: <Favorite size={20} style={{ color: 'var(--cds-support-error)' }} />,
      content: kudosData?.results && kudosData.results.length > 0 ? (
        <div>
          {kudosData.results.slice(0, 3).map((kudos) => (
            <div key={kudos.id} className="list-item">
              <div className="list-item-avatar">
                {kudos.recipient?.avatar ? (
                  <img src={kudos.recipient.avatar} alt={kudos.recipient.full_name} />
                ) : (
                  getInitials(kudos.recipient?.full_name || '')
                )}
              </div>
              <div className="list-item-content">
                <div className="list-item-title">
                  {kudos.recipient?.full_name || 'Неизвестный'}
                </div>
                <div className="list-item-subtitle" style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  от {kudos.sender?.full_name}
                </div>
              </div>
            </div>
          ))}
          <Link
            to="/kudos"
            style={{
              display: 'block',
              marginTop: '0.75rem',
              fontSize: '0.875rem',
              color: 'var(--cds-link-primary)',
              textDecoration: 'none'
            }}
          >
            Все благодарности →
          </Link>
        </div>
      ) : (
        <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>Нет благодарностей</p>
      ),
    },
    okr: {
      icon: <ChartBullet size={20} />,
      content: myOkrData && myOkrData.length > 0 ? (
        <div>
          {myOkrData.slice(0, 3).map((objective) => (
            <Link
              key={objective.id}
              to={`/okr/${objective.id}`}
              className="list-item"
              style={{ flexDirection: 'column', alignItems: 'stretch' }}
            >
              <div className="list-item-title" style={{
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                marginBottom: '0.5rem'
              }}>
                {objective.title}
              </div>
              <ProgressBar
                label=""
                value={objective.progress}
                max={100}
                size="small"
                status={objective.progress >= 70 ? 'finished' : objective.progress >= 30 ? 'active' : 'error'}
                hideLabel
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', marginTop: '0.25rem' }}>
                {objective.progress}% выполнено
              </div>
            </Link>
          ))}
          <Link
            to="/okr"
            style={{
              display: 'block',
              marginTop: '0.75rem',
              fontSize: '0.875rem',
              color: 'var(--cds-link-primary)',
              textDecoration: 'none'
            }}
          >
            Все цели →
          </Link>
        </div>
      ) : (
        <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>Нет активных целей</p>
      ),
    },
    bookings: {
      icon: <Calendar size={20} />,
      content: myBookingsData && myBookingsData.length > 0 ? (
        <div>
          {myBookingsData.slice(0, 3).map((booking) => (
            <Link
              key={booking.id}
              to={`/bookings/resources/${booking.resource}`}
              className="list-item"
              style={{ flexDirection: 'column', alignItems: 'flex-start' }}
            >
              <div className="list-item-title">{booking.title}</div>
              <div className="list-item-subtitle" style={{ marginTop: '0.25rem' }}>
                {booking.resource_name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', marginTop: '0.25rem' }}>
                {new Date(booking.starts_at).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'short',
                })}{' '}
                {new Date(booking.starts_at).toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
                {' - '}
                {new Date(booking.ends_at).toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </Link>
          ))}
          <Link
            to="/bookings"
            style={{
              display: 'block',
              marginTop: '0.75rem',
              fontSize: '0.875rem',
              color: 'var(--cds-link-primary)',
              textDecoration: 'none'
            }}
          >
            Все бронирования →
          </Link>
        </div>
      ) : (
        <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>Нет предстоящих бронирований</p>
      ),
    },
    ideas: {
      icon: <Idea size={20} />,
      content: topIdeasData?.results && topIdeasData.results.length > 0 ? (
        <div>
          {topIdeasData.results.slice(0, 3).map((idea) => (
            <Link
              key={idea.id}
              to={`/ideas/${idea.id}`}
              className="list-item"
              style={{ alignItems: 'flex-start' }}
            >
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '40px',
                padding: '0.25rem',
                backgroundColor: idea.votes_score > 0 ? 'var(--cds-support-success-inverse)' : 'var(--cds-layer-02)',
                borderRadius: '4px',
                marginRight: '0.75rem'
              }}>
                <span style={{
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: idea.votes_score > 0 ? 'var(--cds-support-success)' : 'var(--cds-text-secondary)'
                }}>
                  {idea.votes_score > 0 ? '+' : ''}{idea.votes_score}
                </span>
              </div>
              <div className="list-item-content">
                <div className="list-item-title" style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  whiteSpace: 'normal'
                }}>
                  {idea.title}
                </div>
                <Tag size="sm" type="gray" style={{ marginTop: '0.25rem' }}>
                  {idea.category_display}
                </Tag>
              </div>
            </Link>
          ))}
          <Link
            to="/ideas"
            style={{
              display: 'block',
              marginTop: '0.75rem',
              fontSize: '0.875rem',
              color: 'var(--cds-link-primary)',
              textDecoration: 'none'
            }}
          >
            Все идеи →
          </Link>
        </div>
      ) : (
        <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>Нет новых идей</p>
      ),
    },
    viewHistory: {
      icon: <Time size={20} />,
      content: <ViewHistoryWidget />,
    },
  }

  // Widget names
  const widgetNames: Record<WidgetId, string> = {
    stats: 'Статистика',
    birthdays: 'Ближайшие дни рождения',
    news: 'Последние новости',
    achievements: 'Последние достижения',
    leaderboard: 'Топ-3 лидера месяца',
    kudos: 'Последние благодарности',
    okr: 'Мои цели (OKR)',
    bookings: 'Мои бронирования',
    ideas: 'Топ идеи',
    viewHistory: 'Недавно просмотренные',
  }

  // Separate stats widget from others (stats is always first and full-width)
  const statsWidget = orderedWidgets.find(w => w.id === 'stats')
  const otherWidgets = orderedWidgets.filter(w => w.id !== 'stats')

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">
            Добро пожаловать, {user?.first_name}!
          </h1>
          <p className="page-subtitle">
            Главная страница корпоративного портала
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {dashboardStore.isEditMode ? (
            <>
              <Button
                kind="ghost"
                size="sm"
                renderIcon={Reset}
                onClick={() => dashboardStore.resetToDefault()}
              >
                Сбросить
              </Button>
              <Button
                kind="primary"
                size="sm"
                renderIcon={Checkmark}
                onClick={() => dashboardStore.setEditMode(false)}
              >
                Готово
              </Button>
            </>
          ) : (
            <>
              <Button
                kind="ghost"
                size="sm"
                hasIconOnly
                iconDescription="Справка по странице"
                renderIcon={Help}
                onClick={resetTour}
              />
              <Button
                kind="ghost"
                size="sm"
                renderIcon={Settings}
                onClick={() => dashboardStore.setEditMode(true)}
                className="settings-btn"
              >
                Настроить
              </Button>
            </>
          )}
        </div>
      </div>

      {dashboardStore.isEditMode && (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          background: 'var(--cds-layer-01)',
          borderRadius: '4px',
          border: '1px solid var(--cds-border-subtle-01)',
        }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)', marginBottom: '0.5rem' }}>
            Перетаскивайте виджеты для изменения порядка. Используйте иконку глаза для скрытия/показа виджетов.
          </p>
        </div>
      )}

      {/* Stats widget (always first, full width) */}
      {statsWidget && (dashboardStore.isEditMode || statsWidget.visible) && (
        <div className="dashboard-stats-widget">
          <Tile
            style={{
              border: dashboardStore.isEditMode ? '2px dashed var(--cds-border-subtle-01)' : undefined,
              opacity: statsWidget.visible ? 1 : 0.5,
            }}
          >
            {dashboardStore.isEditMode && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
                <Button
                  kind="ghost"
                  size="sm"
                  hasIconOnly
                  iconDescription={statsWidget.visible ? 'Скрыть' : 'Показать'}
                  onClick={() => dashboardStore.toggleWidgetVisibility('stats')}
                >
                  {statsWidget.visible ? <Settings size={16} /> : <Settings size={16} />}
                </Button>
              </div>
            )}
            {widgetContent.stats.content}
          </Tile>
        </div>
      )}

      {/* Other widgets with drag & drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={otherWidgets.map(w => w.id)}
          strategy={rectSortingStrategy}
        >
          <div className="dashboard-widgets-grid">
            {otherWidgets.map((widget) => {
              const content = widgetContent[widget.id]

              if (!dashboardStore.isEditMode && !widget.visible) {
                return null
              }

              return (
                <div key={widget.id} className="dashboard-widget">
                  <DashboardWidget
                    id={widget.id}
                    title={widgetNames[widget.id]}
                    icon={content.icon}
                    isEditMode={dashboardStore.isEditMode}
                    isVisible={widget.visible}
                    onToggleVisibility={() => dashboardStore.toggleWidgetVisibility(widget.id)}
                  >
                    {content.content}
                  </DashboardWidget>
                </div>
              )
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* Module-specific onboarding tour */}
      <OnboardingTour
        tourType="dashboard"
        forceRun={showTour}
        onComplete={handleComplete}
      />
    </div>
  )
}
