import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Tile, Button, Tag, Loading } from '@carbon/react'
import { Edit, Email, Phone, Calendar, Events, Catalog, ArrowRight, UserAvatar } from '@carbon/icons-react'
import { useAuthStore } from '@/store/authStore'
import { skillsApi } from '@/api/endpoints/skills'
import { formatDate } from '@/lib/utils'
import { levelLabels } from '@/components/features/skills'

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

  const { data: mySkills = [] } = useQuery({
    queryKey: ['my-skills'],
    queryFn: skillsApi.getMySkills,
  })

  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <Loading withOverlay={false} />
      </div>
    )
  }

  return (
    <div>
      {/* Header with Edit button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Мой профиль</h1>
        <Button renderIcon={Edit} as={Link} to="/profile/edit">
          Редактировать
        </Button>
      </div>

      {/* Profile Header */}
      <Tile style={{ marginBottom: '1.5rem', padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: '2rem' }}>
          {/* Large Photo */}
          <div style={{
            width: '280px',
            minHeight: '320px',
            flexShrink: 0,
            background: 'var(--cds-layer-02)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}>
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.full_name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
                background: 'linear-gradient(135deg, #4589ff 0%, #0f62fe 50%, #0043ce 100%)',
              }}>
                <UserAvatar size={80} style={{ color: 'rgba(255,255,255,0.9)' }} />
                <span style={{
                  fontSize: '2rem',
                  fontWeight: 600,
                  color: '#ffffff',
                  letterSpacing: '0.1em',
                }}>
                  {getInitials(user.full_name)}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, padding: '1.5rem 1.5rem 1.5rem 0' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 600, margin: 0 }}>{user.full_name}</h2>
                {user.current_status && (
                  <Tag type="blue" size="sm">
                    {user.current_status.status_display}
                  </Tag>
                )}
              </div>
              <p style={{ fontSize: '1.125rem', color: 'var(--cds-text-secondary)' }}>
                {user.position?.name || 'Должность не указана'}
              </p>
              {user.department && (
                <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-helper)', marginTop: '0.25rem' }}>
                  {user.department.name}
                </p>
              )}
            </div>

            {/* Contact Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Email size={20} style={{ color: 'var(--cds-text-secondary)' }} />
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)' }}>Email</p>
                  <p style={{ fontSize: '0.875rem' }}>{user.email}</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Phone size={20} style={{ color: 'var(--cds-text-secondary)' }} />
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)' }}>Телефон</p>
                  <p style={{ fontSize: '0.875rem' }}>{user.phone_personal || 'Не указан'}</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Calendar size={20} style={{ color: 'var(--cds-text-secondary)' }} />
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)' }}>День рождения</p>
                  <p style={{ fontSize: '0.875rem' }}>
                    {user.birth_date ? formatDate(user.birth_date) : 'Не указан'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Events size={20} style={{ color: 'var(--cds-text-secondary)' }} />
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)' }}>Дата найма</p>
                  <p style={{ fontSize: '0.875rem' }}>
                    {user.hire_date ? formatDate(user.hire_date) : 'Не указана'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Tile>

      {/* Skills section */}
      <Tile>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
            <Catalog size={20} />
            Мои навыки ({mySkills.length})
          </h3>
          <Button kind="ghost" size="sm" renderIcon={ArrowRight} as={Link} to="/profile/skills">
            Управление навыками
          </Button>
        </div>
        {mySkills.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {mySkills.map((skill) => (
              <div
                key={skill.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '4px',
                  backgroundColor: 'var(--cds-layer-02)',
                }}
              >
                <span style={{ fontWeight: 500 }}>{skill.skill_name}</span>
                <span style={{
                  fontSize: '0.75rem',
                  padding: '0.125rem 0.5rem',
                  borderRadius: '10px',
                  backgroundColor: skill.level === 'expert' ? '#8a3ffc'
                    : skill.level === 'advanced' ? '#198038'
                    : skill.level === 'intermediate' ? '#0043ce'
                    : '#6f6f6f',
                  color: '#ffffff',
                }}>
                  {levelLabels[skill.level]}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: 'var(--cds-text-secondary)', marginBottom: '1rem' }}>
              У вас пока нет добавленных навыков
            </p>
            <Button kind="tertiary" size="sm" as={Link} to="/profile/skills">
              Добавить навыки
            </Button>
          </div>
        )}
      </Tile>

      {/* Bio */}
      {user.bio && (
        <Tile style={{ marginTop: '1.5rem' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>О себе</h3>
          <p style={{ color: 'var(--cds-text-secondary)', whiteSpace: 'pre-wrap' }}>{user.bio}</p>
        </Tile>
      )}
    </div>
  )
}
