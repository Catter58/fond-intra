import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Tile, Button, Tag, Loading } from '@carbon/react'
import { ArrowLeft, Email, Phone, Calendar, Building, UserAvatar, Events, Trophy } from '@carbon/icons-react'
import { usersApi } from '@/api/endpoints/users'
import { achievementsApi } from '@/api/endpoints/achievements'
import { formatDate } from '@/lib/utils'

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: employee, isLoading, error } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => usersApi.getById(Number(id)),
    enabled: !!id,
  })

  const { data: achievements } = useQuery({
    queryKey: ['employee-achievements', id],
    queryFn: () => achievementsApi.getUserAchievements(Number(id)),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <Loading withOverlay={false} />
      </div>
    )
  }

  if (error || !employee) {
    return (
      <div>
        <Button
          kind="ghost"
          renderIcon={ArrowLeft}
          onClick={() => navigate('/employees')}
          style={{ marginBottom: '1rem' }}
        >
          Назад к списку
        </Button>
        <Tile>
          <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--cds-text-secondary)' }}>
            Сотрудник не найден
          </p>
        </Tile>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Button
            kind="ghost"
            hasIconOnly
            renderIcon={ArrowLeft}
            iconDescription="Назад"
            onClick={() => navigate('/employees')}
          />
          <h1 className="page-title">Профиль сотрудника</h1>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        {/* Main info */}
        <Tile>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1rem' }}>
            <div className="list-item-avatar" style={{ width: '128px', height: '128px', fontSize: '2rem', marginBottom: '1rem' }}>
              {employee.avatar ? (
                <img src={employee.avatar} alt={employee.full_name} />
              ) : (
                getInitials(employee.full_name)
              )}
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{employee.full_name}</h2>
            <p style={{ color: 'var(--cds-text-secondary)' }}>
              {employee.position?.name || 'Должность не указана'}
            </p>
            {employee.department && (
              <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-helper)', marginTop: '0.25rem' }}>
                {employee.department.name}
              </p>
            )}
            {employee.current_status && (
              <Tag type="blue" size="sm" style={{ marginTop: '0.75rem' }}>
                {employee.current_status.status_display}
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
                <a
                  href={`mailto:${employee.email}`}
                  style={{ fontSize: '0.875rem', color: 'var(--cds-link-primary)' }}
                >
                  {employee.email}
                </a>
              </div>
            </div>

            {employee.phone_personal && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--cds-layer-02)' }}>
                <Phone size={20} style={{ color: 'var(--cds-text-secondary)' }} />
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)' }}>Телефон</p>
                  <a
                    href={`tel:${employee.phone_personal}`}
                    style={{ fontSize: '0.875rem', color: 'var(--cds-link-primary)' }}
                  >
                    {employee.phone_personal}
                  </a>
                </div>
              </div>
            )}

            {employee.birth_date && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--cds-layer-02)' }}>
                <Calendar size={20} style={{ color: 'var(--cds-text-secondary)' }} />
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)' }}>День рождения</p>
                  <p style={{ fontSize: '0.875rem' }}>{formatDate(employee.birth_date)}</p>
                </div>
              </div>
            )}

            {employee.hire_date && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--cds-layer-02)' }}>
                <Events size={20} style={{ color: 'var(--cds-text-secondary)' }} />
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)' }}>Дата найма</p>
                  <p style={{ fontSize: '0.875rem' }}>{formatDate(employee.hire_date)}</p>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--cds-layer-02)' }}>
              <Building size={20} style={{ color: 'var(--cds-text-secondary)' }} />
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)' }}>Отдел</p>
                <p style={{ fontSize: '0.875rem' }}>{employee.department?.name || 'Не указан'}</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--cds-layer-02)' }}>
              <UserAvatar size={20} style={{ color: 'var(--cds-text-secondary)' }} />
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)' }}>Должность</p>
                <p style={{ fontSize: '0.875rem' }}>{employee.position?.name || 'Не указана'}</p>
              </div>
            </div>
          </div>
        </Tile>

        {/* Bio */}
        {employee.bio && (
          <Tile style={{ gridColumn: 'span 2' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>О сотруднике</h3>
            <p style={{ color: 'var(--cds-text-secondary)', whiteSpace: 'pre-wrap' }}>{employee.bio}</p>
          </Tile>
        )}

        {/* Achievements */}
        <Tile style={{ gridColumn: 'span 2' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, marginBottom: '1rem' }}>
            <Trophy size={20} />
            Достижения ({achievements?.length || 0})
          </h3>
          {achievements && achievements.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              {achievements.map((award) => (
                <div key={award.id} style={{ padding: '1rem', background: 'var(--cds-layer-02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '2rem' }}>{award.achievement?.icon || '🏆'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {award.achievement?.name || 'Достижение'}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                        {formatDate(award.awarded_at)}
                      </p>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)', marginTop: '0.5rem' }}>
                    {award.comment}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.875rem' }}>
              У сотрудника пока нет достижений
            </p>
          )}
        </Tile>
      </div>
    </div>
  )
}
