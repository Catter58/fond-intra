import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Grid,
  Column,
  Tile,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Search,
  Dropdown,
  Tag,
  Loading,
  Button,
  InlineNotification,
} from '@carbon/react'
import { Calendar, Building, Add } from '@carbon/icons-react'
import { bookingsApi } from '../../api/endpoints/bookings'
import { ResourceCard } from '../../components/features/bookings/ResourceCard'
import { BookingCard } from '../../components/features/bookings/BookingCard'
import { ResourceModal } from '../../components/features/bookings/ResourceModal'
import { EmptyState } from '../../components/ui/EmptyState'
import { useAuthStore } from '../../store/authStore'
import type { Resource } from '../../types'

export default function BookingsPage() {
  const { user } = useAuthStore()
  const isAdmin = user?.role?.is_admin || user?.is_superuser
  const queryClient = useQueryClient()

  const [selectedTab, setSelectedTab] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<number | null>(null)
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<Resource | null>(null)
  const [cancelSuccess, setCancelSuccess] = useState(false)

  const { data: resourceTypes } = useQuery({
    queryKey: ['resourceTypes'],
    queryFn: bookingsApi.getResourceTypes,
  })

  const { data: resources, isLoading: loadingResources } = useQuery({
    queryKey: ['resources', selectedType, searchQuery],
    queryFn: () => bookingsApi.getResources({
      type: selectedType || undefined,
      search: searchQuery || undefined,
    }),
  })

  const { data: myBookings, isLoading: loadingMyBookings } = useQuery({
    queryKey: ['myBookings'],
    queryFn: () => bookingsApi.getMyBookings(true),
  })

  const { data: stats } = useQuery({
    queryKey: ['bookingStats'],
    queryFn: bookingsApi.getStats,
  })

  const cancelMutation = useMutation({
    mutationFn: bookingsApi.cancelBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBookings'] })
      queryClient.invalidateQueries({ queryKey: ['bookingStats'] })
      setCancelSuccess(true)
      setTimeout(() => setCancelSuccess(false), 3000)
    },
  })

  const handleCancelBooking = (bookingId: number) => {
    if (window.confirm('Вы уверены, что хотите отменить это бронирование?')) {
      cancelMutation.mutate(bookingId)
    }
  }

  const filteredResources = resources || []

  const typeOptions = [
    { id: null, text: 'Все типы' },
    ...(resourceTypes || []).map((t) => ({ id: t.id, text: t.name })),
  ]

  return (
    <Grid fullWidth className="bookings-page">
      <Column lg={16} md={8} sm={4}>
        <div className="page-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 600 }}>Бронирование ресурсов</h1>
            <p style={{ color: 'var(--cds-text-secondary)', marginTop: '0.5rem' }}>
              Забронируйте переговорную, оборудование или рабочее место
            </p>
          </div>
          {isAdmin && (
            <Button
              kind="primary"
              renderIcon={Add}
              onClick={() => {
                setEditingResource(null)
                setIsResourceModalOpen(true)
              }}
            >
              Добавить ресурс
            </Button>
          )}
        </div>

        {/* Stats */}
        {stats && (
          <Grid condensed style={{ marginBottom: '2rem' }}>
            <Column lg={4} md={2} sm={4}>
              <Tile style={{ textAlign: 'center', padding: '1rem' }}>
                <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--cds-interactive-01)' }}>
                  {stats.my_upcoming}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
                  Мои бронирования
                </div>
              </Tile>
            </Column>
            <Column lg={4} md={2} sm={4}>
              <Tile style={{ textAlign: 'center', padding: '1rem' }}>
                <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--cds-support-success)' }}>
                  {stats.today_bookings}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
                  Сегодня
                </div>
              </Tile>
            </Column>
            <Column lg={4} md={2} sm={4}>
              <Tile style={{ textAlign: 'center', padding: '1rem' }}>
                <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--cds-support-warning)' }}>
                  {stats.week_bookings}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
                  На этой неделе
                </div>
              </Tile>
            </Column>
            <Column lg={4} md={2} sm={4}>
              <Tile style={{ textAlign: 'center', padding: '1rem' }}>
                <div style={{ fontSize: '2rem', fontWeight: 600 }}>
                  {stats.month_bookings}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
                  В этом месяце
                </div>
              </Tile>
            </Column>
          </Grid>
        )}

        <Tabs selectedIndex={selectedTab} onChange={({ selectedIndex }) => setSelectedTab(selectedIndex)}>
          <TabList aria-label="Booking tabs">
            <Tab renderIcon={Building}>Ресурсы</Tab>
            <Tab renderIcon={Calendar}>Мои бронирования</Tab>
          </TabList>

          <TabPanels>
            {/* Resources Tab */}
            <TabPanel>
              <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 300px' }}>
                  <Search
                    id="resource-search"
                    placeholder="Поиск ресурсов..."
                    labelText=""
                    closeButtonLabelText="Очистить"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div style={{ minWidth: '200px' }}>
                  <Dropdown
                    id="resource-type-filter"
                    titleText=""
                    label="Тип ресурса"
                    items={typeOptions}
                    itemToString={(item) => item?.text || ''}
                    selectedItem={typeOptions.find((t) => t.id === selectedType) || typeOptions[0]}
                    onChange={({ selectedItem }) => setSelectedType(selectedItem?.id || null)}
                  />
                </div>
              </div>

              {/* Resource Type Pills */}
              {resourceTypes && resourceTypes.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  <Tag
                    type={selectedType === null ? 'blue' : 'gray'}
                    onClick={() => setSelectedType(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    Все ({resources?.length || 0})
                  </Tag>
                  {resourceTypes.map((type) => (
                    <Tag
                      key={type.id}
                      type={selectedType === type.id ? 'blue' : 'gray'}
                      onClick={() => setSelectedType(type.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      {type.name} ({type.resources_count})
                    </Tag>
                  ))}
                </div>
              )}

              {loadingResources ? (
                <Loading withOverlay={false} />
              ) : filteredResources.length === 0 ? (
                <EmptyState
                  icon={Building}
                  title="Ресурсы не найдены"
                  description="Попробуйте изменить параметры поиска"
                />
              ) : (
                <Grid condensed>
                  {filteredResources.map((resource) => (
                    <Column key={resource.id} lg={4} md={4} sm={4} style={{ marginBottom: '1rem' }}>
                      <ResourceCard
                        resource={resource}
                        isAdmin={isAdmin}
                        onEdit={(r) => {
                          setEditingResource(r)
                          setIsResourceModalOpen(true)
                        }}
                      />
                    </Column>
                  ))}
                </Grid>
              )}
            </TabPanel>

            {/* My Bookings Tab */}
            <TabPanel>
              {cancelSuccess && (
                <InlineNotification
                  kind="success"
                  title="Бронирование отменено"
                  subtitle="Ваше бронирование успешно отменено"
                  lowContrast
                  style={{ marginBottom: '1rem' }}
                  onClose={() => setCancelSuccess(false)}
                />
              )}
              {loadingMyBookings ? (
                <Loading withOverlay={false} />
              ) : !myBookings || myBookings.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="У вас нет предстоящих бронирований"
                  description="Выберите ресурс и создайте новое бронирование"
                  action={{
                    label: 'Перейти к ресурсам',
                    onClick: () => setSelectedTab(0),
                  }}
                />
              ) : (
                <Grid condensed>
                  {myBookings.map((booking) => (
                    <Column key={booking.id} lg={8} md={4} sm={4} style={{ marginBottom: '1rem' }}>
                      <BookingCard booking={booking} onCancel={handleCancelBooking} />
                    </Column>
                  ))}
                </Grid>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Column>

      {isAdmin && (
        <ResourceModal
          isOpen={isResourceModalOpen}
          onClose={() => {
            setIsResourceModalOpen(false)
            setEditingResource(null)
          }}
          resource={editingResource}
        />
      )}
    </Grid>
  )
}
