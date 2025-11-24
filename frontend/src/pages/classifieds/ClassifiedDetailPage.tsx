import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Grid,
  Column,
  Tile,
  Tag,
  Button,
  Modal,
  Loading,
  InlineNotification,
} from '@carbon/react'
import {
  ArrowLeft,
  TrashCan,
  Phone,
  Send,
  View,
  Calendar,
  Close as CloseIcon,
  Time,
  Renew,
  User,
} from '@carbon/icons-react'
import { classifiedsApi } from '@/api/endpoints/classifieds'
import { Avatar } from '@/components/ui/Avatar'
import { ImageGallery } from '@/components/ui/ImageGallery'
import { useAuthStore } from '@/store/authStore'
import type { ClassifiedStatus } from '@/types'

const statusColors: Record<ClassifiedStatus, 'gray' | 'green' | 'red'> = {
  active: 'green',
  closed: 'gray',
  expired: 'red',
}

export default function ClassifiedDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const { data: classified, isLoading, error } = useQuery({
    queryKey: ['classified', id],
    queryFn: () => classifiedsApi.getById(Number(id)),
    enabled: !!id,
  })

  const closeMutation = useMutation({
    mutationFn: () => classifiedsApi.close(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classified', id] })
      queryClient.invalidateQueries({ queryKey: ['classifieds'] })
    },
  })

  const extendMutation = useMutation({
    mutationFn: () => classifiedsApi.extend(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classified', id] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => classifiedsApi.delete(Number(id)),
    onSuccess: () => {
      navigate('/classifieds')
    },
  })

  const formatPrice = (price: number | null) => {
    if (!price) return null
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(price)
  }

  if (isLoading) {
    return <Loading description="Загрузка объявления..." withOverlay />
  }

  if (error || !classified) {
    return (
      <Grid className="dashboard-page">
        <Column lg={16} md={8} sm={4}>
          <InlineNotification
            kind="error"
            title="Ошибка"
            subtitle="Объявление не найдено"
            hideCloseButton
          />
          <Button kind="ghost" renderIcon={ArrowLeft} onClick={() => navigate('/classifieds')} className="mt-4">
            Вернуться к объявлениям
          </Button>
        </Column>
      </Grid>
    )
  }

  const isOwner = user?.id === classified.author.id
  const isExpiringSoon = classified.expires_at && new Date(classified.expires_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  // Convert classified images to NewsAttachment format for ImageGallery
  const galleryImages = classified.images?.map(img => ({
    id: img.id,
    file: img.image,
    thumbnail: img.image,
    file_name: `Image ${img.id}`,
    file_type: 'image/jpeg',
    file_size: 0,
    order: img.order,
    is_cover: img.order === 0,
    is_image: true,
    uploaded_at: img.uploaded_at,
  })) || []

  return (
    <Grid className="dashboard-page">
      <Column lg={16} md={8} sm={4}>
        <Button
          kind="ghost"
          renderIcon={ArrowLeft}
          onClick={() => navigate('/classifieds')}
          className="mb-4"
        >
          Назад к объявлениям
        </Button>

        <div className="classified-detail">
          {/* Main content */}
          <div className="classified-detail__main">
            <Tile className="classified-detail__content">
              {/* Images */}
              {galleryImages.length > 0 && (
                <div className="classified-detail__gallery">
                  <ImageGallery images={galleryImages} />
                </div>
              )}

              {/* Body */}
              <div className="classified-detail__body">
                {/* Tags */}
                <div className="classified-detail__tags">
                  <Tag type="blue" size="md">{classified.category_name}</Tag>
                  <Tag type={statusColors[classified.status]} size="md">
                    {classified.status_display}
                  </Tag>
                  {isExpiringSoon && classified.status === 'active' && (
                    <Tag type="red" size="sm">Скоро истекает</Tag>
                  )}
                </div>

                {/* Title */}
                <h1 className="classified-detail__title">{classified.title}</h1>

                {/* Price */}
                {classified.price && (
                  <div className="classified-detail__price">
                    {formatPrice(classified.price)}
                  </div>
                )}

                {/* Description */}
                <div className="classified-detail__description">
                  {classified.description}
                </div>

                {/* Meta info */}
                <div className="classified-detail__meta">
                  <div className="classified-detail__meta-item">
                    <View size={16} />
                    <span>{classified.views_count} просмотров</span>
                  </div>
                  <div className="classified-detail__meta-item">
                    <Calendar size={16} />
                    <span>Создано: {new Date(classified.created_at).toLocaleDateString('ru-RU')}</span>
                  </div>
                  {classified.expires_at && (
                    <div className="classified-detail__meta-item">
                      <Time size={16} />
                      <span>Истекает: {new Date(classified.expires_at).toLocaleDateString('ru-RU')}</span>
                    </div>
                  )}
                </div>

                {/* Owner actions */}
                {isOwner && (
                  <div className="classified-detail__actions">
                    {classified.status === 'active' && (
                      <Button
                        kind="secondary"
                        size="md"
                        onClick={() => closeMutation.mutate()}
                        disabled={closeMutation.isPending}
                        renderIcon={CloseIcon}
                      >
                        Закрыть объявление
                      </Button>
                    )}
                    {(classified.status === 'expired' || isExpiringSoon) && (
                      <Button
                        kind="secondary"
                        size="md"
                        onClick={() => extendMutation.mutate()}
                        disabled={extendMutation.isPending}
                        renderIcon={Renew}
                      >
                        Продлить на 30 дней
                      </Button>
                    )}
                    <Button
                      kind="danger--ghost"
                      size="md"
                      hasIconOnly
                      renderIcon={TrashCan}
                      iconDescription="Удалить"
                      onClick={() => setIsDeleteModalOpen(true)}
                    />
                  </div>
                )}
              </div>
            </Tile>
          </div>

          {/* Sidebar - Contact card */}
          <div className="classified-detail__sidebar">
            <Tile className="classified-detail__contact-card">
              <h3 className="classified-detail__contact-title">Контакты</h3>

              <div className="classified-detail__author">
                <Avatar
                  name={classified.author.full_name}
                  src={classified.author.avatar}
                  size={56}
                />
                <div className="classified-detail__author-info">
                  <div className="classified-detail__author-name">
                    {classified.author.full_name}
                  </div>
                  {classified.author.department && (
                    <div className="classified-detail__author-dept">
                      {classified.author.department}
                    </div>
                  )}
                </div>
              </div>

              {/* Contact info */}
              {classified.contact_info && (
                <div className="classified-detail__contact-info">
                  <div className="classified-detail__contact-label">Контактная информация</div>
                  <div className="classified-detail__contact-value">{classified.contact_info}</div>
                </div>
              )}

              {/* Contact links */}
              <div className="classified-detail__contact-links">
                {classified.author.phone_work && (
                  <a href={`tel:${classified.author.phone_work}`} className="classified-detail__contact-link">
                    <Phone size={18} />
                    <span>{classified.author.phone_work}</span>
                  </a>
                )}

                {classified.author.telegram && (
                  <a
                    href={`https://t.me/${classified.author.telegram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="classified-detail__contact-link"
                  >
                    <Send size={18} />
                    <span>{classified.author.telegram}</span>
                  </a>
                )}
              </div>

              <Button
                kind="primary"
                renderIcon={User}
                onClick={() => navigate(`/employees/${classified.author.id}`)}
                className="classified-detail__profile-btn"
              >
                Профиль автора
              </Button>
            </Tile>
          </div>
        </div>
      </Column>

      {/* Delete modal */}
      <Modal
        open={isDeleteModalOpen}
        onRequestClose={() => setIsDeleteModalOpen(false)}
        modalHeading="Удалить объявление?"
        primaryButtonText="Удалить"
        secondaryButtonText="Отмена"
        danger
        onRequestSubmit={() => deleteMutation.mutate()}
        primaryButtonDisabled={deleteMutation.isPending}
      >
        <p>Вы уверены, что хотите удалить это объявление? Это действие нельзя отменить.</p>
      </Modal>
    </Grid>
  )
}
