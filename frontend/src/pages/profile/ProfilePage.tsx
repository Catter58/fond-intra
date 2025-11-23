import { Link } from 'react-router-dom'
import { Tile, Button, Tag, Loading } from '@carbon/react'
import { Edit, Email, Phone, Calendar, Building, UserAvatar, Events } from '@carbon/icons-react'
import { useAuthStore } from '@/store/authStore'
import { formatDate } from '@/lib/utils'

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function ProfilePage() {
  const { user } = useAuthStore()

  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <Loading withOverlay={false} />
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="page-title">Мой профиль</h1>
          <Button renderIcon={Edit} as={Link} to="/profile/edit">
            Редактировать
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        {/* Main info card */}
        <Tile>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1rem' }}>
            <div className="list-item-avatar" style={{ width: '128px', height: '128px', fontSize: '2rem', marginBottom: '1rem' }}>
              {user.avatar ? (
                <img src={user.avatar} alt={user.full_name} />
              ) : (
                getInitials(user.full_name)
              )}
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{user.full_name}</h2>
            <p style={{ color: 'var(--cds-text-secondary)' }}>
              {user.position?.name || 'Должность не указана'}
            </p>
            {user.department && (
              <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-helper)', marginTop: '0.25rem' }}>
                {user.department.name}
              </p>
            )}
            {user.current_status && (
              <Tag type="blue" size="sm" style={{ marginTop: '0.75rem' }}>
                {user.current_status.status_display}
              </Tag>
            )}
          </div>
        </Tile>

        {/* Contact info */}
        <Tile>
          <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Контактная информация</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--cds-layer-02)' }}>
              <Email size={20} style={{ color: 'var(--cds-text-secondary)' }} />
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)' }}>Email</p>
                <p style={{ fontSize: '0.875rem' }}>{user.email}</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--cds-layer-02)' }}>
              <Phone size={20} style={{ color: 'var(--cds-text-secondary)' }} />
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)' }}>Телефон</p>
                <p style={{ fontSize: '0.875rem' }}>{user.phone_personal || 'Не указан'}</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--cds-layer-02)' }}>
              <Calendar size={20} style={{ color: 'var(--cds-text-secondary)' }} />
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)' }}>День рождения</p>
                <p style={{ fontSize: '0.875rem' }}>
                  {user.birth_date ? formatDate(user.birth_date) : 'Не указан'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--cds-layer-02)' }}>
              <Events size={20} style={{ color: 'var(--cds-text-secondary)' }} />
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)' }}>Дата найма</p>
                <p style={{ fontSize: '0.875rem' }}>
                  {user.hire_date ? formatDate(user.hire_date) : 'Не указана'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--cds-layer-02)' }}>
              <Building size={20} style={{ color: 'var(--cds-text-secondary)' }} />
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)' }}>Отдел</p>
                <p style={{ fontSize: '0.875rem' }}>{user.department?.name || 'Не указан'}</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--cds-layer-02)' }}>
              <UserAvatar size={20} style={{ color: 'var(--cds-text-secondary)' }} />
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)' }}>Должность</p>
                <p style={{ fontSize: '0.875rem' }}>{user.position?.name || 'Не указана'}</p>
              </div>
            </div>
          </div>
        </Tile>

        {/* Bio */}
        {user.bio && (
          <Tile style={{ gridColumn: 'span 2' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>О себе</h3>
            <p style={{ color: 'var(--cds-text-secondary)', whiteSpace: 'pre-wrap' }}>{user.bio}</p>
          </Tile>
        )}
      </div>
    </div>
  )
}
