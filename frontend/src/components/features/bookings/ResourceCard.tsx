import { FC, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Tile, Tag, Button, Modal, InlineNotification } from '@carbon/react'
import { Location, Time, UserMultiple, Calendar, Edit, TrashCan } from '@carbon/icons-react'
import { bookingsApi } from '../../../api/endpoints/bookings'
import type { Resource } from '../../../types'

interface ResourceCardProps {
  resource: Resource
  isAdmin?: boolean
  onEdit?: (resource: Resource) => void
}

export const ResourceCard: FC<ResourceCardProps> = ({ resource, isAdmin, onEdit }) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const deleteMutation = useMutation({
    mutationFn: () => bookingsApi.deleteResource(resource.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] })
      queryClient.invalidateQueries({ queryKey: ['resourceTypes'] })
      setShowDeleteModal(false)
    },
    onError: (err: any) => {
      setDeleteError(err.response?.data?.detail || 'Ошибка удаления ресурса')
    },
  })

  const formatTime = (time: string) => {
    return time.slice(0, 5)
  }

  return (
    <Tile className="resource-card" style={{ padding: '1rem', height: '100%' }}>
      {resource.image && (
        <div style={{ marginBottom: '1rem' }}>
          <img
            src={resource.image}
            alt={resource.name}
            style={{
              width: '100%',
              height: '120px',
              objectFit: 'cover',
              borderRadius: '4px',
            }}
          />
        </div>
      )}

      <div style={{ marginBottom: '0.5rem' }}>
        <Tag type="blue" size="sm">
          {resource.type_name}
        </Tag>
      </div>

      <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem', fontWeight: 600 }}>
        {resource.name}
      </h4>

      {resource.description && (
        <p
          style={{
            color: 'var(--cds-text-secondary)',
            fontSize: '0.875rem',
            marginBottom: '1rem',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {resource.description}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
        {resource.location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <Location size={16} />
            <span>{resource.location}</span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
          <Time size={16} />
          <span>
            {formatTime(resource.work_hours_start)} - {formatTime(resource.work_hours_end)}
          </span>
        </div>

        {resource.capacity && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <UserMultiple size={16} />
            <span>до {resource.capacity} чел.</span>
          </div>
        )}
      </div>

      {resource.amenities && resource.amenities.length > 0 && (
        <div style={{ marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
          {resource.amenities.slice(0, 3).map((amenity, index) => (
            <Tag key={index} type="gray" size="sm">
              {amenity}
            </Tag>
          ))}
          {resource.amenities.length > 3 && (
            <Tag type="gray" size="sm">
              +{resource.amenities.length - 3}
            </Tag>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Button
          kind="primary"
          size="sm"
          renderIcon={Calendar}
          onClick={() => navigate(`/bookings/resources/${resource.id}`)}
          style={{ flex: 1 }}
        >
          Забронировать
        </Button>
        {isAdmin && onEdit && (
          <>
            <Button
              kind="ghost"
              size="sm"
              renderIcon={Edit}
              hasIconOnly
              iconDescription="Редактировать"
              onClick={() => onEdit(resource)}
            />
            <Button
              kind="danger--tertiary"
              size="sm"
              renderIcon={TrashCan}
              hasIconOnly
              iconDescription="Удалить"
              onClick={() => setShowDeleteModal(true)}
            />
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        onRequestClose={() => {
          setShowDeleteModal(false)
          setDeleteError(null)
        }}
        modalHeading="Удалить ресурс?"
        primaryButtonText="Удалить"
        secondaryButtonText="Отмена"
        danger
        onRequestSubmit={() => deleteMutation.mutate()}
        primaryButtonDisabled={deleteMutation.isPending}
      >
        {deleteError && (
          <InlineNotification
            kind="error"
            title="Ошибка"
            subtitle={deleteError}
            onClose={() => setDeleteError(null)}
            lowContrast
            style={{ marginBottom: '1rem' }}
          />
        )}
        <p>
          Вы уверены, что хотите удалить ресурс <strong>{resource.name}</strong>?
        </p>
        <p style={{ color: 'var(--cds-text-secondary)', marginTop: '0.5rem' }}>
          Это действие нельзя отменить. Все связанные бронирования также будут удалены.
        </p>
      </Modal>
    </Tile>
  )
}
