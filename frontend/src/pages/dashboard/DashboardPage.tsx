import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Grid, Column, Tile } from '@carbon/react'
import {
  UserMultiple,
  Trophy,
  Document,
  Events,
} from '@carbon/icons-react'
import { useAuthStore } from '@/store/authStore'
import { usersApi } from '@/api/endpoints/users'
import { newsApi } from '@/api/endpoints/news'
import { achievementsApi } from '@/api/endpoints/achievements'
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
      </Grid>
    </div>
  )
}
