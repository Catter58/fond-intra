import { FC, useState, useEffect } from 'react'
import {
  Modal,
  TextInput,
  TextArea,
  NumberInput,
  Dropdown,
  Toggle,
  Tag,
  Button,
  InlineNotification,
} from '@carbon/react'
import { Add } from '@carbon/icons-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bookingsApi } from '../../../api/endpoints/bookings'
import type { Resource, ResourceType } from '../../../types'

interface ResourceModalProps {
  isOpen: boolean
  onClose: () => void
  resource?: Resource | null
}

export const ResourceModal: FC<ResourceModalProps> = ({
  isOpen,
  onClose,
  resource,
}) => {
  const queryClient = useQueryClient()
  const isEditing = !!resource

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [capacity, setCapacity] = useState<number | null>(null)
  const [selectedType, setSelectedType] = useState<ResourceType | null>(null)
  const [isActive, setIsActive] = useState(true)
  const [workHoursStart, setWorkHoursStart] = useState('09:00')
  const [workHoursEnd, setWorkHoursEnd] = useState('18:00')
  const [minDuration, setMinDuration] = useState(30)
  const [maxDuration, setMaxDuration] = useState(240)
  const [amenities, setAmenities] = useState<string[]>([])
  const [newAmenity, setNewAmenity] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data: resourceTypes } = useQuery({
    queryKey: ['resourceTypes'],
    queryFn: bookingsApi.getResourceTypes,
  })

  const createMutation = useMutation({
    mutationFn: bookingsApi.createResource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] })
      queryClient.invalidateQueries({ queryKey: ['resourceTypes'] })
      handleClose()
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || err.response?.data?.name?.[0] || 'Ошибка создания ресурса')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      bookingsApi.updateResource(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] })
      queryClient.invalidateQueries({ queryKey: ['resource', resource?.id] })
      queryClient.invalidateQueries({ queryKey: ['resourceTypes'] })
      handleClose()
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || err.response?.data?.name?.[0] || 'Ошибка обновления ресурса')
    },
  })

  useEffect(() => {
    if (isOpen) {
      if (resource) {
        setName(resource.name)
        setDescription(resource.description || '')
        setLocation(resource.location || '')
        setCapacity(resource.capacity)
        setIsActive(resource.is_active)
        setWorkHoursStart(resource.work_hours_start.slice(0, 5))
        setWorkHoursEnd(resource.work_hours_end.slice(0, 5))
        setMinDuration(resource.min_booking_duration)
        setMaxDuration(resource.max_booking_duration)
        setAmenities(resource.amenities || [])

        // Set selected type
        if (resourceTypes) {
          const typeId = typeof resource.type === 'object' ? resource.type.id : resource.type
          const type = resourceTypes.find(t => t.id === typeId)
          setSelectedType(type || null)
        }
      } else {
        // Reset form for new resource
        setName('')
        setDescription('')
        setLocation('')
        setCapacity(null)
        setSelectedType(resourceTypes?.[0] || null)
        setIsActive(true)
        setWorkHoursStart('09:00')
        setWorkHoursEnd('18:00')
        setMinDuration(30)
        setMaxDuration(240)
        setAmenities([])
      }
      setNewAmenity('')
      setError(null)
    }
  }, [isOpen, resource, resourceTypes])

  const handleClose = () => {
    setError(null)
    onClose()
  }

  const handleAddAmenity = () => {
    if (newAmenity.trim() && !amenities.includes(newAmenity.trim())) {
      setAmenities([...amenities, newAmenity.trim()])
      setNewAmenity('')
    }
  }

  const handleRemoveAmenity = (amenity: string) => {
    setAmenities(amenities.filter(a => a !== amenity))
  }

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Введите название ресурса')
      return
    }
    if (!selectedType) {
      setError('Выберите тип ресурса')
      return
    }

    const data = {
      name: name.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      capacity: capacity || undefined,
      type: selectedType.id,
      is_active: isActive,
      work_hours_start: workHoursStart,
      work_hours_end: workHoursEnd,
      min_booking_duration: minDuration,
      max_booking_duration: maxDuration,
      amenities: amenities.length > 0 ? amenities : undefined,
    }

    if (isEditing && resource) {
      updateMutation.mutate({ id: resource.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Modal
      open={isOpen}
      onRequestClose={handleClose}
      modalHeading={isEditing ? 'Редактировать ресурс' : 'Добавить ресурс'}
      primaryButtonText={isEditing ? 'Сохранить' : 'Создать'}
      secondaryButtonText="Отмена"
      onRequestSubmit={handleSubmit}
      primaryButtonDisabled={isPending || !name.trim() || !selectedType}
      size="lg"
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
          id="resource-name"
          labelText="Название"
          placeholder="Например: Переговорная А"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <TextArea
          id="resource-description"
          labelText="Описание"
          placeholder="Описание ресурса"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Dropdown
            id="resource-type"
            titleText="Тип ресурса"
            label="Выберите тип"
            items={resourceTypes || []}
            itemToString={(item: ResourceType | null) => item?.name || ''}
            selectedItem={selectedType}
            onChange={({ selectedItem }) => setSelectedType(selectedItem || null)}
          />

          <TextInput
            id="resource-location"
            labelText="Расположение"
            placeholder="Например: Этаж 2, кабинет 201"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <NumberInput
            id="resource-capacity"
            label="Вместимость"
            min={1}
            max={1000}
            value={capacity || ''}
            onChange={(_e, { value }) => setCapacity(typeof value === 'number' ? value : null)}
            allowEmpty
          />

          <TextInput
            id="work-hours-start"
            labelText="Начало работы"
            type="time"
            value={workHoursStart}
            onChange={(e) => setWorkHoursStart(e.target.value)}
          />

          <TextInput
            id="work-hours-end"
            labelText="Конец работы"
            type="time"
            value={workHoursEnd}
            onChange={(e) => setWorkHoursEnd(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <NumberInput
            id="min-duration"
            label="Мин. длительность (мин)"
            min={15}
            max={480}
            step={15}
            value={minDuration}
            onChange={(_e, { value }) => setMinDuration(typeof value === 'number' ? value : 30)}
          />

          <NumberInput
            id="max-duration"
            label="Макс. длительность (мин)"
            min={30}
            max={1440}
            step={30}
            value={maxDuration}
            onChange={(_e, { value }) => setMaxDuration(typeof value === 'number' ? value : 240)}
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.75rem',
              color: 'var(--cds-text-secondary)',
            }}
          >
            Удобства
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <TextInput
              id="new-amenity"
              labelText=""
              placeholder="Добавить удобство"
              value={newAmenity}
              onChange={(e) => setNewAmenity(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddAmenity()
                }
              }}
              style={{ flex: 1 }}
            />
            <Button
              kind="tertiary"
              size="md"
              renderIcon={Add}
              hasIconOnly
              iconDescription="Добавить"
              onClick={handleAddAmenity}
              disabled={!newAmenity.trim()}
            />
          </div>
          {amenities.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
              {amenities.map((amenity, index) => (
                <Tag
                  key={index}
                  type="gray"
                  filter
                  onClose={() => handleRemoveAmenity(amenity)}
                >
                  {amenity}
                </Tag>
              ))}
            </div>
          )}
        </div>

        <Toggle
          id="resource-active"
          labelText="Статус"
          labelA="Неактивен"
          labelB="Активен"
          toggled={isActive}
          onToggle={(checked) => setIsActive(checked)}
        />
      </div>
    </Modal>
  )
}
