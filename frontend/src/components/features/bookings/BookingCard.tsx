import { FC } from 'react'
import { Tile, Tag, Button } from '@carbon/react'
import { Time, Close, Checkmark, Calendar } from '@carbon/icons-react'
import type { BookingListItem } from '../../../types'
import { Avatar } from '../../ui/Avatar'

interface BookingCardProps {
  booking: BookingListItem
  onCancel?: (id: number) => void
  showResource?: boolean
}

export const BookingCard: FC<BookingCardProps> = ({
  booking,
  onCancel,
  showResource = true,
}) => {
  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return {
      date: date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
      }),
      time: date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }
  }

  const startDateTime = formatDateTime(booking.starts_at)
  const endDateTime = formatDateTime(booking.ends_at)

  const getStatusTag = () => {
    if (booking.status === 'cancelled') {
      return <Tag type="gray">Отменено</Tag>
    }
    if (booking.is_active) {
      return <Tag type="green">Сейчас</Tag>
    }
    if (booking.is_past) {
      return <Tag type="gray">Завершено</Tag>
    }
    return <Tag type="blue">Предстоит</Tag>
  }

  const canCancel = booking.status === 'confirmed' && !booking.is_past

  return (
    <Tile className="booking-card" style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            {booking.title}
          </h4>
          {showResource && (
            <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.875rem' }}>
              {booking.resource_name}
              {booking.resource_type && (
                <span style={{ marginLeft: '0.5rem' }}>
                  <Tag type="outline" size="sm">{booking.resource_type}</Tag>
                </span>
              )}
            </p>
          )}
        </div>
        {getStatusTag()}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
          <Calendar size={16} />
          <span>{startDateTime.date}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
          <Time size={16} />
          <span>
            {startDateTime.time} - {endDateTime.time}
            <span style={{ color: 'var(--cds-text-secondary)', marginLeft: '0.5rem' }}>
              ({booking.duration_minutes} мин.)
            </span>
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <Avatar
          src={booking.user.avatar}
          name={booking.user.full_name}
          size={32}
        />
        <div>
          <div style={{ fontSize: '0.875rem' }}>{booking.user.full_name}</div>
          {booking.user.department_name && (
            <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
              {booking.user.department_name}
            </div>
          )}
        </div>
      </div>

      {booking.is_recurring && (
        <Tag type="purple" size="sm" style={{ marginBottom: '0.5rem' }}>
          Повторяющееся
        </Tag>
      )}

      {canCancel && onCancel && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <Button
            kind="danger--tertiary"
            size="sm"
            renderIcon={Close}
            onClick={() => onCancel(booking.id)}
          >
            Отменить
          </Button>
        </div>
      )}

      {booking.is_active && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem',
            backgroundColor: 'var(--cds-support-success)',
            borderRadius: '4px',
            color: 'white',
            marginTop: '0.5rem',
          }}
        >
          <Checkmark size={16} />
          <span style={{ fontSize: '0.875rem' }}>Бронирование активно</span>
        </div>
      )}
    </Tile>
  )
}
