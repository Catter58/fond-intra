import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Tile, Button, Tag, Loading } from '@carbon/react'
import { ArrowLeft, Email, Phone, Calendar, Events, Trophy, Catalog, UserAvatar, Edit } from '@carbon/icons-react'
import { usersApi } from '@/api/endpoints/users'
import { achievementsApi } from '@/api/endpoints/achievements'
import { skillsApi } from '@/api/endpoints/skills'
import { interactionsApi } from '@/api/endpoints/interactions'
import { useAuthStore } from '@/store/authStore'
import { formatDate } from '@/lib/utils'
import { SkillBadge } from '@/components/features/skills'
import { BookmarkButton } from '@/components/ui/BookmarkButton'

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
  const { user } = useAuthStore()

  // Check if current user can edit (HR or admin)
  const canEdit = user?.role?.is_admin || user?.is_superuser || user?.role?.name?.toLowerCase() === 'hr'

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

  const { data: userSkills } = useQuery({
    queryKey: ['user-skills', Number(id)],
    queryFn: () => skillsApi.getUserSkills(Number(id)),
    enabled: !!id,
  })

  const isOwnProfile = user?.id === Number(id)

  // Check if bookmarked
  const { data: bookmarkStatus } = useQuery({
    queryKey: ['bookmark-check', 'user', id],
    queryFn: () => interactionsApi.checkBookmarks('user', [Number(id)]),
    enabled: !!id && !isOwnProfile,
  })
  const isBookmarked = bookmarkStatus?.[id as string] ?? false

  // Record profile view
  const recordViewMutation = useMutation({
    mutationFn: (userId: number) => interactionsApi.recordProfileView(userId),
  })

  useEffect(() => {
    if (id && !isOwnProfile) {
      recordViewMutation.mutate(Number(id))
    }
  }, [id, isOwnProfile])

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
      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <Button
          kind="ghost"
          renderIcon={ArrowLeft}
          onClick={() => navigate('/employees')}
        >
          Назад к списку
        </Button>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {!isOwnProfile && (
            <BookmarkButton
              contentType="user"
              objectId={Number(id)}
              initialBookmarked={isBookmarked}
              size="md"
              kind="tertiary"
            />
          )}
          {canEdit && (
            <Button
              kind="primary"
              renderIcon={Edit}
              onClick={() => navigate(`/admin/users/${id}/edit`)}
            >
              Редактировать
            </Button>
          )}
        </div>
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
            {employee.avatar ? (
              <img
                src={employee.avatar}
                alt={employee.full_name}
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
                  {getInitials(employee.full_name)}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, padding: '1.5rem 1.5rem 1.5rem 0' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 600, margin: 0 }}>{employee.full_name}</h1>
                {employee.current_status && (
                  <Tag type="blue" size="sm">
                    {employee.current_status.status_display}
                  </Tag>
                )}
              </div>
              <p style={{ fontSize: '1.125rem', color: 'var(--cds-text-secondary)' }}>
                {employee.position?.name || 'Должность не указана'}
              </p>
              {employee.department && (
                <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-helper)', marginTop: '0.25rem' }}>
                  {employee.department.name}
                </p>
              )}
            </div>

            {/* Contact Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Email size={20} style={{ color: 'var(--cds-text-secondary)' }} />
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)' }}>Email</p>
                  <a href={`mailto:${employee.email}`} style={{ fontSize: '0.875rem', color: 'var(--cds-link-primary)' }}>
                    {employee.email}
                  </a>
                </div>
              </div>

              {employee.phone_personal && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Phone size={20} style={{ color: 'var(--cds-text-secondary)' }} />
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)' }}>Телефон</p>
                    <a href={`tel:${employee.phone_personal}`} style={{ fontSize: '0.875rem', color: 'var(--cds-link-primary)' }}>
                      {employee.phone_personal}
                    </a>
                  </div>
                </div>
              )}

              {employee.birth_date && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Calendar size={20} style={{ color: 'var(--cds-text-secondary)' }} />
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)' }}>День рождения</p>
                    <p style={{ fontSize: '0.875rem' }}>{formatDate(employee.birth_date)}</p>
                  </div>
                </div>
              )}

              {employee.hire_date && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Events size={20} style={{ color: 'var(--cds-text-secondary)' }} />
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)' }}>Дата найма</p>
                    <p style={{ fontSize: '0.875rem' }}>{formatDate(employee.hire_date)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Tile>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
        {/* Skills */}
        <Tile>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, marginBottom: '1rem' }}>
            <Catalog size={20} />
            Навыки ({userSkills?.length || 0})
          </h3>
          {userSkills && userSkills.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {userSkills.map((skill) => (
                <SkillBadge
                  key={skill.id}
                  skill={skill}
                  userId={Number(id)}
                  isOwnProfile={isOwnProfile}
                />
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.875rem' }}>
              Навыки не указаны
            </p>
          )}
        </Tile>

        {/* Achievements */}
        <Tile>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, marginBottom: '1rem' }}>
            <Trophy size={20} />
            Достижения ({achievements?.length || 0})
          </h3>
          {achievements && achievements.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {achievements.map((award) => (
                <div key={award.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--cds-layer-02)' }}>
                  <span style={{ fontSize: '1.5rem' }}>{award.achievement?.icon || '🏆'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 500 }}>{award.achievement?.name || 'Достижение'}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                      {formatDate(award.awarded_at)}
                      {award.comment && ` — ${award.comment}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.875rem' }}>
              У сотрудника пока нет достижений
            </p>
          )}
        </Tile>

        {/* Bio - full width if exists */}
        {employee.bio && (
          <Tile style={{ gridColumn: 'span 2' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>О сотруднике</h3>
            <p style={{ color: 'var(--cds-text-secondary)', whiteSpace: 'pre-wrap' }}>{employee.bio}</p>
          </Tile>
        )}
      </div>
    </div>
  )
}
