import { FC } from 'react'
import { Tile, Button } from '@carbon/react'
import type { TimeSlot } from '../../../types'

interface TimeSlotPickerProps {
  slots: TimeSlot[]
  selectedStart: string | null
  selectedEnd: string | null
  onSlotClick: (slot: TimeSlot) => void
  workHoursStart: string
  workHoursEnd: string
}

export const TimeSlotPicker: FC<TimeSlotPickerProps> = ({
  slots,
  selectedStart,
  selectedEnd,
  onSlotClick,
  workHoursStart,
  workHoursEnd,
}) => {
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }


  const isSlotSelected = (slot: TimeSlot) => {
    if (!selectedStart || !selectedEnd) return false
    const slotStart = new Date(slot.start).getTime()
    const selStart = new Date(selectedStart).getTime()
    const selEnd = new Date(selectedEnd).getTime()
    return slotStart >= selStart && slotStart < selEnd
  }

  if (slots.length === 0) {
    return (
      <Tile style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--cds-text-secondary)' }}>
          Нет доступных слотов на выбранную дату
        </p>
        <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Рабочие часы: {workHoursStart.slice(0, 5)} - {workHoursEnd.slice(0, 5)}
        </p>
      </Tile>
    )
  }

  return (
    <div className="time-slot-picker">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '0.5rem',
          fontSize: '0.75rem',
          color: 'var(--cds-text-secondary)',
        }}
      >
        <span>{workHoursStart.slice(0, 5)}</span>
        <span>{workHoursEnd.slice(0, 5)}</span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
          gap: '0.5rem',
          marginBottom: '1rem',
        }}
      >
        {slots.map((slot, index) => {
          const isSelected = isSlotSelected(slot)
          return (
            <Button
              key={index}
              kind={isSelected ? 'primary' : slot.is_available ? 'tertiary' : 'ghost'}
              size="sm"
              disabled={!slot.is_available}
              onClick={() => onSlotClick(slot)}
              style={{
                width: '100%',
                opacity: slot.is_available ? 1 : 0.5,
                backgroundColor: !slot.is_available
                  ? 'var(--cds-layer-02)'
                  : isSelected
                  ? undefined
                  : undefined,
              }}
            >
              {formatTime(slot.start)}
            </Button>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              backgroundColor: 'var(--cds-button-tertiary)',
              borderRadius: '2px',
            }}
          />
          <span>Свободно</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              backgroundColor: 'var(--cds-layer-02)',
              borderRadius: '2px',
            }}
          />
          <span>Занято</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              backgroundColor: 'var(--cds-button-primary)',
              borderRadius: '2px',
            }}
          />
          <span>Выбрано</span>
        </div>
      </div>
    </div>
  )
}
