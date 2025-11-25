import { FC, useState, useEffect } from 'react'
import {
  Modal,
  TextInput,
  TextArea,
  DatePicker,
  DatePickerInput,
  InlineNotification,
  Loading,
  Toggle,
  RadioButtonGroup,
  RadioButton,
  Checkbox,
} from '@carbon/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bookingsApi } from '../../../api/endpoints/bookings'
import type { Resource, TimeSlot } from '../../../types'
import { TimeSlotPicker } from './TimeSlotPicker'

interface CreateBookingModalProps {
  isOpen: boolean
  onClose: () => void
  resource: Resource
}

export const CreateBookingModal: FC<CreateBookingModalProps> = ({
  isOpen,
  onClose,
  resource,
}) => {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedStart, setSelectedStart] = useState<string | null>(null)
  const [selectedEnd, setSelectedEnd] = useState<string | null>(null)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Recurring booking state
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly'>('weekly')
  const [weekDays, setWeekDays] = useState<number[]>([])
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | null>(null)

  // Format date as YYYY-MM-DD in local timezone (not UTC)
  const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`

  const { data: availability, isLoading: loadingAvailability } = useQuery({
    queryKey: ['resourceAvailability', resource.id, dateStr],
    queryFn: () => bookingsApi.getResourceAvailability(resource.id, dateStr),
    enabled: isOpen,
  })

  const createMutation = useMutation({
    mutationFn: bookingsApi.createBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['myBookings'] })
      queryClient.invalidateQueries({ queryKey: ['resourceAvailability'] })
      handleClose()
    },
    onError: (err: any) => {
      setError(err.response?.data?.starts_at || err.response?.data?.ends_at || 'Ошибка создания бронирования')
    },
  })

  useEffect(() => {
    if (isOpen) {
      setTitle('')
      setDescription('')
      setSelectedDate(new Date())
      setSelectedStart(null)
      setSelectedEnd(null)
      setStartTime('')
      setEndTime('')
      setError(null)
      setIsRecurring(false)
      setRecurrenceType('weekly')
      setWeekDays([])
      setRecurrenceEndDate(null)
    }
  }, [isOpen])

  const handleClose = () => {
    setError(null)
    onClose()
  }

  const handleSlotClick = (slot: TimeSlot) => {
    if (!slot.is_available) return

    // If no start selected, set start
    if (!selectedStart) {
      setSelectedStart(slot.start)
      setSelectedEnd(slot.end)
      setStartTime(new Date(slot.start).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }))
      setEndTime(new Date(slot.end).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }))
      return
    }

    // If clicking the same slot, deselect
    if (selectedStart === slot.start) {
      setSelectedStart(null)
      setSelectedEnd(null)
      setStartTime('')
      setEndTime('')
      return
    }

    // If clicking after current selection, extend end
    const slotStartTime = new Date(slot.start).getTime()
    const currentEndTime = new Date(selectedEnd!).getTime()

    if (slotStartTime >= currentEndTime) {
      // Check if all slots between current end and new slot are available
      const slots = availability?.slots || []
      let canExtend = true
      for (const s of slots) {
        const sStart = new Date(s.start).getTime()
        if (sStart >= currentEndTime && sStart < new Date(slot.end).getTime() && !s.is_available) {
          canExtend = false
          break
        }
      }

      if (canExtend) {
        setSelectedEnd(slot.end)
        setEndTime(new Date(slot.end).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }))
      }
    } else {
      // Start new selection
      setSelectedStart(slot.start)
      setSelectedEnd(slot.end)
      setStartTime(new Date(slot.start).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }))
      setEndTime(new Date(slot.end).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }))
    }
  }

  const handleWeekDayToggle = (day: number) => {
    setWeekDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    )
  }

  const handleSubmit = () => {
    if (!title.trim()) {
      setError('Введите название бронирования')
      return
    }
    if (!selectedStart || !selectedEnd) {
      setError('Выберите время бронирования')
      return
    }
    if (isRecurring && recurrenceType === 'weekly' && weekDays.length === 0) {
      setError('Выберите дни недели для повторения')
      return
    }
    if (isRecurring && !recurrenceEndDate) {
      setError('Выберите дату окончания повторения')
      return
    }

    const bookingData: Parameters<typeof bookingsApi.createBooking>[0] = {
      title: title.trim(),
      description: description.trim(),
      resource: resource.id,
      starts_at: selectedStart,
      ends_at: selectedEnd,
    }

    if (isRecurring && recurrenceEndDate) {
      const untilStr = `${recurrenceEndDate.getFullYear()}-${String(recurrenceEndDate.getMonth() + 1).padStart(2, '0')}-${String(recurrenceEndDate.getDate()).padStart(2, '0')}`
      bookingData.is_recurring = true
      bookingData.recurrence_rule = {
        type: recurrenceType,
        until: untilStr,
        ...(recurrenceType === 'weekly' && { days: weekDays }),
      }
    }

    createMutation.mutate(bookingData)
  }

  const duration = selectedStart && selectedEnd
    ? Math.round((new Date(selectedEnd).getTime() - new Date(selectedStart).getTime()) / 60000)
    : 0

  return (
    <Modal
      open={isOpen}
      onRequestClose={handleClose}
      modalHeading={`Бронирование: ${resource.name}`}
      primaryButtonText="Забронировать"
      secondaryButtonText="Отмена"
      onRequestSubmit={handleSubmit}
      primaryButtonDisabled={createMutation.isPending || !title.trim() || !selectedStart || !selectedEnd}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && (
          <InlineNotification
            kind="error"
            title="Ошибка"
            subtitle={error}
            onClose={() => setError(null)}
            lowContrast
          />
        )}

        <TextInput
          id="booking-title"
          labelText="Название"
          placeholder="Например: Совещание команды"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <TextArea
          id="booking-description"
          labelText="Описание (необязательно)"
          placeholder="Дополнительная информация о бронировании"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />

        <DatePicker
          datePickerType="single"
          dateFormat="d.m.Y"
          value={selectedDate}
          onChange={(dates: Date[]) => {
            if (dates[0]) {
              setSelectedDate(dates[0])
              setSelectedStart(null)
              setSelectedEnd(null)
            }
          }}
          minDate={new Date().toISOString()}
        >
          <DatePickerInput
            id="booking-date"
            labelText="Дата"
            placeholder="дд.мм.гггг"
          />
        </DatePicker>

        <div>
          <label
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.75rem',
              color: 'var(--cds-text-secondary)',
            }}
          >
            Выберите время
          </label>

          {loadingAvailability ? (
            <Loading withOverlay={false} small />
          ) : availability ? (
            <TimeSlotPicker
              slots={availability.slots}
              selectedStart={selectedStart}
              selectedEnd={selectedEnd}
              onSlotClick={handleSlotClick}
              workHoursStart={availability.work_hours_start}
              workHoursEnd={availability.work_hours_end}
            />
          ) : null}
        </div>

        {selectedStart && selectedEnd && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--cds-layer-02)',
              borderRadius: '4px',
            }}
          >
            <p style={{ fontWeight: 500, marginBottom: '0.5rem' }}>
              Выбранное время:
            </p>
            <p>
              {startTime} - {endTime}
              <span style={{ color: 'var(--cds-text-secondary)', marginLeft: '0.5rem' }}>
                ({duration} мин.)
              </span>
            </p>
            {duration < resource.min_booking_duration && (
              <p style={{ color: 'var(--cds-support-error)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                Минимальная длительность: {resource.min_booking_duration} мин.
              </p>
            )}
            {duration > resource.max_booking_duration && (
              <p style={{ color: 'var(--cds-support-error)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                Максимальная длительность: {resource.max_booking_duration} мин.
              </p>
            )}
          </div>
        )}

        {/* Recurring booking section */}
        <Toggle
          id="booking-recurring"
          labelText="Повторяющееся бронирование"
          labelA="Нет"
          labelB="Да"
          toggled={isRecurring}
          onToggle={(checked) => setIsRecurring(checked)}
        />

        {isRecurring && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--cds-layer-02)',
              borderRadius: '4px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <RadioButtonGroup
              legendText="Тип повторения"
              name="recurrence-type"
              valueSelected={recurrenceType}
              onChange={(value) => setRecurrenceType(value as 'daily' | 'weekly')}
            >
              <RadioButton labelText="Ежедневно" value="daily" id="recurrence-daily" />
              <RadioButton labelText="Еженедельно" value="weekly" id="recurrence-weekly" />
            </RadioButtonGroup>

            {recurrenceType === 'weekly' && (
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontSize: '0.75rem',
                    color: 'var(--cds-text-secondary)',
                  }}
                >
                  Дни недели
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {[
                    { day: 0, label: 'Пн' },
                    { day: 1, label: 'Вт' },
                    { day: 2, label: 'Ср' },
                    { day: 3, label: 'Чт' },
                    { day: 4, label: 'Пт' },
                    { day: 5, label: 'Сб' },
                    { day: 6, label: 'Вс' },
                  ].map(({ day, label }) => (
                    <Checkbox
                      key={day}
                      id={`weekday-${day}`}
                      labelText={label}
                      checked={weekDays.includes(day)}
                      onChange={() => handleWeekDayToggle(day)}
                    />
                  ))}
                </div>
              </div>
            )}

            <DatePicker
              datePickerType="single"
              dateFormat="d.m.Y"
              value={recurrenceEndDate || undefined}
              onChange={(dates: Date[]) => {
                if (dates[0]) {
                  setRecurrenceEndDate(dates[0])
                }
              }}
              minDate={selectedDate.toISOString()}
            >
              <DatePickerInput
                id="recurrence-end-date"
                labelText="Повторять до"
                placeholder="дд.мм.гггг"
              />
            </DatePicker>

            {recurrenceEndDate && (
              <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
                Бронирование будет повторяться{' '}
                {recurrenceType === 'daily' ? 'каждый день' : `по выбранным дням недели`} до{' '}
                {recurrenceEndDate.toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
