import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Grid,
  Column,
  Tile,
  Button,
  Tag,
  DatePicker,
  DatePickerInput,
  Loading,
  InlineNotification,
} from '@carbon/react'
import {
  ArrowLeft,
  Location,
  Time,
  UserMultiple,
  Calendar,
  Add,
} from '@carbon/icons-react'
import { bookingsApi } from '../../api/endpoints/bookings'
import { BookingCard } from '../../components/features/bookings/BookingCard'
import { CreateBookingModal } from '../../components/features/bookings/CreateBookingModal'
import { TimeSlotPicker } from '../../components/features/bookings/TimeSlotPicker'

export default function ResourceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [notification, setNotification] = useState<{ kind: 'success' | 'error'; title: string } | null>(null)

  const resourceId = parseInt(id || '0')
  // Format date as YYYY-MM-DD in local timezone (not UTC)
  const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`

  const { data: resource, isLoading: loadingResource, error: resourceError } = useQuery({
    queryKey: ['resource', resourceId],
    queryFn: () => bookingsApi.getResource(resourceId),
    enabled: resourceId > 0,
  })

  const { data: availability, isLoading: loadingAvailability } = useQuery({
    queryKey: ['resourceAvailability', resourceId, dateStr],
    queryFn: () => bookingsApi.getResourceAvailability(resourceId, dateStr),
    enabled: resourceId > 0,
  })

  const { data: todayBookings, isLoading: loadingBookings } = useQuery({
    queryKey: ['resourceBookings', resourceId, dateStr],
    queryFn: () => bookingsApi.getBookings({
      resource: resourceId,
      date_from: dateStr,
      date_to: dateStr,
    }),
    enabled: resourceId > 0,
  })

  const cancelMutation = useMutation({
    mutationFn: bookingsApi.cancelBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resourceBookings'] })
      queryClient.invalidateQueries({ queryKey: ['resourceAvailability'] })
      queryClient.invalidateQueries({ queryKey: ['myBookings'] })
      setNotification({ kind: 'success', title: 'Бронирование отменено' })
    },
    onError: () => {
      setNotification({ kind: 'error', title: 'Ошибка отмены бронирования' })
    },
  })

  const formatTime = (time: string) => time.slice(0, 5)

  if (loadingResource) {
    return (
      <Grid fullWidth>
        <Column lg={16} md={8} sm={4}>
          <Loading withOverlay={false} />
        </Column>
      </Grid>
    )
  }

  if (resourceError || !resource) {
    return (
      <Grid fullWidth>
        <Column lg={16} md={8} sm={4}>
          <InlineNotification
            kind="error"
            title="Ошибка"
            subtitle="Ресурс не найден"
            lowContrast
          />
          <Button
            kind="ghost"
            renderIcon={ArrowLeft}
            onClick={() => navigate('/bookings')}
            style={{ marginTop: '1rem' }}
          >
            Назад к списку
          </Button>
        </Column>
      </Grid>
    )
  }

  const resourceType = typeof resource.type === 'object' ? resource.type : null

  return (
    <Grid fullWidth className="resource-detail-page">
      <Column lg={16} md={8} sm={4}>
        {notification && (
          <InlineNotification
            kind={notification.kind}
            title={notification.title}
            onClose={() => setNotification(null)}
            lowContrast
            style={{ marginBottom: '1rem' }}
          />
        )}
        <Button
          kind="ghost"
          renderIcon={ArrowLeft}
          onClick={() => navigate('/bookings')}
          style={{ marginBottom: '1rem' }}
        >
          Назад к списку
        </Button>
      </Column>

      <Column lg={10} md={5} sm={4}>
        <Tile style={{ marginBottom: '1.5rem' }}>
          {resource.image && (
            <div style={{ marginBottom: '1rem' }}>
              <img
                src={resource.image}
                alt={resource.name}
                style={{
                  width: '100%',
                  height: '200px',
                  objectFit: 'cover',
                  borderRadius: '4px',
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: '0.5rem' }}>
            <Tag type="blue">
              {resource.type_name || (resourceType && resourceType.name)}
            </Tag>
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            {resource.name}
          </h1>

          {resource.description && (
            <p style={{ color: 'var(--cds-text-secondary)', marginBottom: '1.5rem' }}>
              {resource.description}
            </p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {resource.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Location size={20} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                    Расположение
                  </div>
                  <div>{resource.location}</div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Time size={20} />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                  Рабочие часы
                </div>
                <div>
                  {formatTime(resource.work_hours_start)} - {formatTime(resource.work_hours_end)}
                </div>
              </div>
            </div>

            {resource.capacity && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserMultiple size={20} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                    Вместимость
                  </div>
                  <div>до {resource.capacity} человек</div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={20} />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                  Длительность
                </div>
                <div>
                  {resource.min_booking_duration} - {resource.max_booking_duration} мин.
                </div>
              </div>
            </div>
          </div>

          {resource.amenities && resource.amenities.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <h3 style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Удобства</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {resource.amenities.map((amenity, index) => (
                  <Tag key={index} type="gray">
                    {amenity}
                  </Tag>
                ))}
              </div>
            </div>
          )}
        </Tile>

        {/* Bookings for selected date */}
        <Tile>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
            Бронирования на {selectedDate.toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long',
            })}
          </h3>

          {loadingBookings ? (
            <Loading withOverlay={false} small />
          ) : !todayBookings || todayBookings.length === 0 ? (
            <p style={{ color: 'var(--cds-text-secondary)' }}>
              Нет бронирований на эту дату
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {todayBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  showResource={false}
                  onCancel={(id) => cancelMutation.mutate(id)}
                />
              ))}
            </div>
          )}
        </Tile>
      </Column>

      <Column lg={6} md={3} sm={4}>
        <Tile style={{ position: 'sticky', top: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Доступность</h3>
            <Button
              kind="primary"
              size="sm"
              renderIcon={Add}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Забронировать
            </Button>
          </div>

          <DatePicker
            datePickerType="single"
            dateFormat="d.m.Y"
            value={selectedDate}
            onChange={(dates: Date[]) => {
              if (dates[0]) {
                setSelectedDate(dates[0])
              }
            }}
            minDate={new Date().toISOString()}
          >
            <DatePickerInput
              id="availability-date"
              labelText="Выберите дату"
              placeholder="дд.мм.гггг"
            />
          </DatePicker>

          <div style={{ marginTop: '1.5rem' }}>
            {loadingAvailability ? (
              <Loading withOverlay={false} small />
            ) : availability ? (
              <TimeSlotPicker
                slots={availability.slots}
                selectedStart={null}
                selectedEnd={null}
                onSlotClick={() => setIsCreateModalOpen(true)}
                workHoursStart={availability.work_hours_start}
                workHoursEnd={availability.work_hours_end}
              />
            ) : null}
          </div>
        </Tile>
      </Column>

      <CreateBookingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        resource={resource}
      />
    </Grid>
  )
}
