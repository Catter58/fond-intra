import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Grid, Column, Tile, ProgressBar, Tag } from '@carbon/react'
import {
  UserMultiple,
  Trophy,
  Document,
  Events,
  Favorite,
  ChartBullet,
  Calendar,
  Idea,
} from '@carbon/icons-react'
import { useAuthStore } from '@/store/authStore'
import { usersApi } from '@/api/endpoints/users'
import { newsApi } from '@/api/endpoints/news'
import { achievementsApi } from '@/api/endpoints/achievements'
import { kudosApi } from '@/api/endpoints/kudos'
import { ideasApi } from '@/api/endpoints/ideas'
import { bookingsApi } from '@/api/endpoints/bookings'
import * as okrApi from '@/api/endpoints/okr'
import { formatDate } from '@/lib/utils'
import { AchievementLeaderboard } from '@/components/features/achievements'

export function DashboardPage() {
  const { user } = useAuthStore()

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

  // OKR - my objectives
  const { data: myOkrData } = useQuery({
    queryKey: ['okr', 'my', 'dashboard'],
    queryFn: () => okrApi.getMyObjectives({ status: 'active' }),
  })

  // Bookings - my upcoming
  const { data: myBookingsData } = useQuery({
    queryKey: ['bookings', 'my', 'dashboard'],
    queryFn: () => bookingsApi.getMyBookings(true),
  })

  // Ideas - top by votes
  const { data: topIdeasData } = useQuery({
    queryKey: ['ideas', 'top', 'dashboard'],
    queryFn: () => ideasApi.getList({ ordering: '-votes_score', status: 'new' }),
  })

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">
          Добро пожаловать, {user?.first_name}!
        </h1>
        <p className="page-subtitle">
          Главная страница корпоративного портала
        </p>
      </div>

      {/* Stats Grid */}
      <Grid style={{ marginBottom: '2rem' }}>
        <Column sm={4} md={2} lg={4}>
          <Tile>
            <div className="stat-tile">
              <div className="stat-icon stat-icon--blue">
                <UserMultiple size={24} />
              </div>
              <div>
                <div className="stat-value">{statsData?.users_count ?? '--'}</div>
                <div className="stat-label">Сотрудников</div>
              </div>
            </div>
          </Tile>
        </Column>

        <Column sm={4} md={2} lg={4}>
          <Tile>
            <div className="stat-tile">
              <div className="stat-icon stat-icon--green">
                <Trophy size={24} />
              </div>
              <div>
                <div className="stat-value">{statsData?.achievements_count ?? '--'}</div>
                <div className="stat-label">Достижений</div>
              </div>
            </div>
          </Tile>
        </Column>

        <Column sm={4} md={2} lg={4}>
          <Tile>
            <div className="stat-tile">
              <div className="stat-icon stat-icon--purple">
                <Document size={24} />
              </div>
              <div>
                <div className="stat-value">{statsData?.news_count ?? '--'}</div>
                <div className="stat-label">Новостей</div>
              </div>
            </div>
          </Tile>
        </Column>

        <Column sm={4} md={2} lg={4}>
          <Tile>
            <div className="stat-tile">
              <div className="stat-icon stat-icon--orange">
                <Events size={24} />
              </div>
              <div>
                <div className="stat-value">{birthdaysData?.length || 0}</div>
                <div className="stat-label">ДР на этой неделе</div>
              </div>
            </div>
          </Tile>
        </Column>
      </Grid>

      {/* Content Cards - Row 1 */}
      <Grid>
        {/* Birthdays */}
        <Column sm={4} md={4} lg={4}>
          <Tile>
          <h3 style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
            fontSize: '1rem',
            fontWeight: 600
          }}>
            <Events size={20} />
            Ближайшие дни рождения
          </h3>
          {birthdaysData && birthdaysData.length > 0 ? (
            <div>
              {birthdaysData.map((person) => (
                <Link
                  key={person.id}
                  to={`/employees/${person.id}`}
                  className="list-item"
                >
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
          )}
        </Tile>
        </Column>

        {/* Latest news */}
        <Column sm={4} md={4} lg={4}>
          <Tile>
          <h3 style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
            fontSize: '1rem',
            fontWeight: 600
          }}>
            <Document size={20} />
            Последние новости
          </h3>
          {newsData?.results && newsData.results.length > 0 ? (
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
            <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
              Нет новостей
            </p>
          )}
          </Tile>
        </Column>

        {/* Latest achievements */}
        <Column sm={4} md={4} lg={4}>
          <Tile>
          <h3 style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
            fontSize: '1rem',
            fontWeight: 600
          }}>
            <Trophy size={20} />
            Последние достижения
          </h3>
          {achievementsData?.results && achievementsData.results.length > 0 ? (
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
            <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
              Нет достижений
            </p>
          )}
          </Tile>
        </Column>

        {/* Leaderboard Top 3 */}
        <Column sm={4} md={8} lg={4}>
          <Tile>
            <h3 style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem',
              fontSize: '1rem',
              fontWeight: 600
            }}>
              <Trophy size={20} />
              Топ-3 лидера месяца
            </h3>
            <AchievementLeaderboard limit={3} showFilters={false} compact />
          </Tile>
        </Column>

        {/* Latest kudos */}
        <Column sm={4} md={4} lg={4}>
          <Tile>
            <h3 style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem',
              fontSize: '1rem',
              fontWeight: 600
            }}>
              <Favorite size={20} style={{ color: 'var(--cds-support-error)' }} />
              Последние благодарности
            </h3>
            {kudosData?.results && kudosData.results.length > 0 ? (
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
              <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
                Нет благодарностей
              </p>
            )}
          </Tile>
        </Column>

        {/* My OKR Progress */}
        <Column sm={4} md={4} lg={4}>
          <Tile>
            <h3 style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem',
              fontSize: '1rem',
              fontWeight: 600
            }}>
              <ChartBullet size={20} />
              Мои цели (OKR)
            </h3>
            {myOkrData && myOkrData.length > 0 ? (
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
              <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
                Нет активных целей
              </p>
            )}
          </Tile>
        </Column>

        {/* My Upcoming Bookings */}
        <Column sm={4} md={4} lg={4}>
          <Tile>
            <h3 style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem',
              fontSize: '1rem',
              fontWeight: 600
            }}>
              <Calendar size={20} />
              Мои бронирования
            </h3>
            {myBookingsData && myBookingsData.length > 0 ? (
              <div>
                {myBookingsData.slice(0, 3).map((booking) => (
                  <Link
                    key={booking.id}
                    to={`/bookings/resources/${booking.resource}`}
                    className="list-item"
                    style={{ flexDirection: 'column', alignItems: 'flex-start' }}
                  >
                    <div className="list-item-title">
                      {booking.title}
                    </div>
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
              <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
                Нет предстоящих бронирований
              </p>
            )}
          </Tile>
        </Column>

        {/* Top Ideas */}
        <Column sm={4} md={4} lg={4}>
          <Tile>
            <h3 style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem',
              fontSize: '1rem',
              fontWeight: 600
            }}>
              <Idea size={20} />
              Топ идеи
            </h3>
            {topIdeasData?.results && topIdeasData.results.length > 0 ? (
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
              <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
                Нет новых идей
              </p>
            )}
          </Tile>
        </Column>
      </Grid>
    </div>
  )
}
