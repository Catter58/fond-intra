import { Link } from 'react-router-dom'
import { Tile, Tag } from '@carbon/react'
import { Favorite, Help, Star, Education, Partnership } from '@carbon/icons-react'
import type { Kudos, KudosCategory } from '@/types'

interface KudosCardProps {
  kudos: Kudos
  showRecipient?: boolean
}

const categoryIcons: Record<KudosCategory, React.ReactNode> = {
  help: <Help size={16} />,
  great_job: <Star size={16} />,
  initiative: <Favorite size={16} />,
  mentorship: <Education size={16} />,
  teamwork: <Partnership size={16} />,
}

const categoryColors: Record<KudosCategory, 'blue' | 'green' | 'purple' | 'teal' | 'cyan'> = {
  help: 'blue',
  great_job: 'green',
  initiative: 'purple',
  mentorship: 'teal',
  teamwork: 'cyan',
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function KudosCard({ kudos, showRecipient = true }: KudosCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Tile style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', gap: '1rem' }}>
        {/* Sender Avatar */}
        <Link to={`/employees/${kudos.sender.id}`}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'var(--cds-link-primary)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.875rem',
              fontWeight: 600,
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {kudos.sender.avatar ? (
              <img
                src={kudos.sender.avatar}
                alt={kudos.sender.full_name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              getInitials(kudos.sender.full_name)
            )}
          </div>
        </Link>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div>
              <Link
                to={`/employees/${kudos.sender.id}`}
                style={{ fontWeight: 600, color: 'var(--cds-text-primary)', textDecoration: 'none' }}
              >
                {kudos.sender.full_name}
              </Link>
              {showRecipient && (
                <>
                  <span style={{ color: 'var(--cds-text-secondary)', margin: '0 0.5rem' }}>→</span>
                  <Link
                    to={`/employees/${kudos.recipient.id}`}
                    style={{ fontWeight: 600, color: 'var(--cds-text-primary)', textDecoration: 'none' }}
                  >
                    {kudos.recipient.full_name}
                  </Link>
                </>
              )}
            </div>
            <Tag type={categoryColors[kudos.category]} renderIcon={() => categoryIcons[kudos.category]}>
              {kudos.category_display}
            </Tag>
          </div>

          {/* Sender info */}
          {kudos.sender.position && (
            <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', marginBottom: '0.75rem' }}>
              {kudos.sender.position}
              {kudos.sender.department && ` · ${kudos.sender.department}`}
            </p>
          )}

          {/* Message */}
          <p style={{ fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '0.75rem' }}>
            {kudos.message}
          </p>

          {/* Footer */}
          <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
            {formatDate(kudos.created_at)}
          </p>
        </div>
      </div>
    </Tile>
  )
}
