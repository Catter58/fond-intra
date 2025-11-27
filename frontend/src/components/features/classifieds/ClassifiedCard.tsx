import { ClickableTile, Tag, AspectRatio } from '@carbon/react'
import { View, Image as ImageIcon, ArrowRight } from '@carbon/icons-react'
import { Avatar } from '@/components/ui/Avatar'
import type { Classified, ClassifiedStatus } from '@/types'

interface ClassifiedCardProps {
  classified: Classified
  onClick?: () => void
}

const statusColors: Record<ClassifiedStatus, 'gray' | 'green' | 'red'> = {
  active: 'green',
  closed: 'gray',
  expired: 'red',
}

export function ClassifiedCard({ classified, onClick }: ClassifiedCardProps) {
  const formatPrice = (price: number | null) => {
    if (!price) return null
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <ClickableTile onClick={onClick} className="classified-card">
      {/* Image section */}
      <div className="classified-card__image-wrapper">
        <AspectRatio ratio="16x9">
          {classified.first_image ? (
            <img
              src={classified.first_image}
              alt={classified.title}
              className="classified-card__image"
            />
          ) : (
            <div className="classified-card__placeholder">
              <ImageIcon size={32} />
            </div>
          )}
        </AspectRatio>
        {classified.images_count && classified.images_count > 1 && (
          <span className="classified-card__image-count">
            +{classified.images_count - 1}
          </span>
        )}
      </div>

      {/* Content section */}
      <div className="classified-card__content">
        {/* Tags */}
        <div className="classified-card__tags">
          <Tag type="blue" size="sm">{classified.category_name}</Tag>
          <Tag type={statusColors[classified.status]} size="sm">
            {classified.status_display}
          </Tag>
        </div>

        {/* Title */}
        <h3 className="classified-card__title">{classified.title}</h3>

        {/* Price */}
        {classified.price && (
          <div className="classified-card__price">
            {formatPrice(classified.price)}
          </div>
        )}

        {/* Description */}
        <p className="classified-card__description">
          {classified.description}
        </p>

        {/* Footer */}
        <div className="classified-card__footer">
          <div className="classified-card__author">
            <Avatar
              name={classified.author.full_name}
              src={classified.author.avatar}
              size={24}
            />
            <span className="classified-card__author-name">
              {classified.author.full_name}
            </span>
          </div>

          <div className="classified-card__meta">
            <span className="classified-card__views">
              <View size={14} />
              <span>{classified.views_count}</span>
            </span>
            <span className="classified-card__date">
              {new Date(classified.created_at).toLocaleDateString('ru-RU')}
            </span>
          </div>
        </div>
      </div>

      {/* Arrow indicator */}
      <div className="classified-card__arrow">
        <ArrowRight size={16} />
      </div>
    </ClickableTile>
  )
}
