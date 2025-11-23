import { useQuery } from '@tanstack/react-query'
import { Tile, ClickableTile } from '@carbon/react'
import { UserMultiple, Building, Security, Trophy, Document, ChartLineSmooth, Archive } from '@carbon/icons-react'
import { apiClient } from '@/api/client'

interface AdminStats {
  total_users: number
  active_users: number
  archived_users: number
  departments: number
  positions: number
  roles: number
  achievement_types: number
  audit_entries: number
}

export function AdminDashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const response = await apiClient.get<AdminStats>('/admin/stats/')
      return response.data
    },
  })

  const adminCards = [
    {
      title: 'Пользователи',
      description: 'Управление сотрудниками',
      icon: UserMultiple,
      href: '/admin/users',
      stats: `${stats?.active_users || 0} активных`,
    },
    {
      title: 'Отделы',
      description: 'Организационная структура',
      icon: Building,
      href: '/admin/departments',
      stats: `${stats?.departments || 0} отделов`,
    },
    {
      title: 'Роли',
      description: 'Права и доступы',
      icon: Security,
      href: '/admin/roles',
      stats: `${stats?.roles || 0} ролей`,
    },
    {
      title: 'Достижения',
      description: 'Типы наград',
      icon: Trophy,
      href: '/admin/achievements',
      stats: `${stats?.achievement_types || 0} типов`,
    },
    {
      title: 'Аудит',
      description: 'Журнал действий',
      icon: Document,
      href: '/admin/audit',
      stats: 'Просмотр логов',
    },
  ]

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Администрирование</h1>
        <p className="page-subtitle">Управление порталом и настройки системы</p>
      </div>

      {/* Stats overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <Tile className="stat-tile">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', background: 'rgba(15, 98, 254, 0.1)', borderRadius: '4px' }}>
              <UserMultiple size={20} style={{ color: '#0f62fe' }} />
            </div>
            <div>
              <p style={{ fontSize: '1.5rem', fontWeight: 600 }}>{stats?.total_users || 0}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>Всего сотрудников</p>
            </div>
          </div>
        </Tile>
        <Tile className="stat-tile">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', background: 'rgba(36, 161, 72, 0.1)', borderRadius: '4px' }}>
              <ChartLineSmooth size={20} style={{ color: '#24a148' }} />
            </div>
            <div>
              <p style={{ fontSize: '1.5rem', fontWeight: 600 }}>{stats?.active_users || 0}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>Активных</p>
            </div>
          </div>
        </Tile>
        <Tile className="stat-tile">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', background: 'rgba(255, 131, 43, 0.1)', borderRadius: '4px' }}>
              <Building size={20} style={{ color: '#ff832b' }} />
            </div>
            <div>
              <p style={{ fontSize: '1.5rem', fontWeight: 600 }}>{stats?.departments || 0}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>Отделов</p>
            </div>
          </div>
        </Tile>
        <Tile className="stat-tile">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', background: 'rgba(82, 82, 82, 0.1)', borderRadius: '4px' }}>
              <Archive size={20} style={{ color: '#525252' }} />
            </div>
            <div>
              <p style={{ fontSize: '1.5rem', fontWeight: 600 }}>{stats?.archived_users || 0}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>В архиве</p>
            </div>
          </div>
        </Tile>
      </div>

      {/* Admin sections */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {adminCards.map((card) => (
          <ClickableTile
            key={card.href}
            href={card.href}
            onClick={(e) => {
              e.preventDefault()
              window.location.href = card.href
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '0.5rem' }}>
              <div style={{ padding: '0.75rem', background: 'var(--cds-layer-02)' }}>
                <card.icon size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontWeight: 600 }}>{card.title}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)', marginTop: '0.25rem' }}>
                  {card.description}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)', marginTop: '0.5rem' }}>{card.stats}</p>
              </div>
            </div>
          </ClickableTile>
        ))}
      </div>
    </div>
  )
}
