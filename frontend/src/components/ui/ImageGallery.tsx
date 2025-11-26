import { useState, useEffect, useCallback } from 'react'
import { Button } from '@carbon/react'
import { ChevronLeft, ChevronRight, Close, ZoomIn } from '@carbon/icons-react'
import type { NewsAttachment } from '@/types'
import './ImageGallery.scss'

interface ImageGalleryProps {
  images: NewsAttachment[]
  showThumbnails?: boolean
}

export function ImageGallery({ images, showThumbnails = true }: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const openLightbox = (index: number) => {
    setCurrentIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
  }

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
  }, [images.length])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
  }, [images.length])

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          closeLightbox()
          break
        case 'ArrowLeft':
          goToPrevious()
          break
        case 'ArrowRight':
          goToNext()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [lightboxOpen, goToPrevious, goToNext])

  if (images.length === 0) return null

  // Single image layout
  if (images.length === 1) {
    return (
      <>
        <div className="image-gallery image-gallery--single" role="group" aria-label="Галерея изображений">
          <button
            className="image-gallery__item"
            onClick={() => openLightbox(0)}
            type="button"
            aria-label={`Открыть изображение: ${images[0].file_name}`}
          >
            <img
              src={images[0].thumbnail || images[0].file}
              alt={images[0].file_name || 'Изображение'}
              loading="lazy"
            />
            <div className="image-gallery__overlay" aria-hidden="true">
              <ZoomIn size={24} />
            </div>
          </button>
        </div>
        {lightboxOpen && (
          <Lightbox
            images={images}
            currentIndex={currentIndex}
            onClose={closeLightbox}
            onPrevious={goToPrevious}
            onNext={goToNext}
          />
        )}
      </>
    )
  }

  // Grid layout for multiple images
  return (
    <>
      <div
        className={`image-gallery image-gallery--grid image-gallery--count-${Math.min(images.length, 4)}`}
        role="group"
        aria-label={`Галерея изображений (${images.length} фото)`}
      >
        {images.slice(0, 4).map((image, index) => (
          <button
            key={image.id}
            type="button"
            className={`image-gallery__item ${index === 0 ? 'image-gallery__item--main' : ''}`}
            onClick={() => openLightbox(index)}
            aria-label={`Открыть изображение ${index + 1} из ${images.length}: ${image.file_name || 'Изображение'}`}
          >
            <img
              src={image.thumbnail || image.file}
              alt={image.file_name || 'Изображение'}
              loading="lazy"
            />
            <div className="image-gallery__overlay" aria-hidden="true">
              {index === 3 && images.length > 4 ? (
                <span className="image-gallery__more">+{images.length - 4}</span>
              ) : (
                <ZoomIn size={24} />
              )}
            </div>
          </button>
        ))}
      </div>

      {showThumbnails && images.length > 4 && (
        <div className="image-gallery__thumbnails" role="group" aria-label="Миниатюры">
          {images.slice(4).map((image, index) => (
            <button
              key={image.id}
              type="button"
              className="image-gallery__thumbnail"
              onClick={() => openLightbox(index + 4)}
              aria-label={`Открыть изображение ${index + 5} из ${images.length}`}
            >
              <img
                src={image.thumbnail || image.file}
                alt={image.file_name || 'Изображение'}
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && (
        <Lightbox
          images={images}
          currentIndex={currentIndex}
          onClose={closeLightbox}
          onPrevious={goToPrevious}
          onNext={goToNext}
        />
      )}
    </>
  )
}

interface LightboxProps {
  images: NewsAttachment[]
  currentIndex: number
  onClose: () => void
  onPrevious: () => void
  onNext: () => void
}

function Lightbox({ images, currentIndex, onClose, onPrevious, onNext }: LightboxProps) {
  const currentImage = images[currentIndex]

  return (
    <div
      className="lightbox"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Просмотр изображения ${currentIndex + 1} из ${images.length}`}
    >
      <div className="lightbox__content" onClick={(e) => e.stopPropagation()}>
        <Button
          kind="ghost"
          hasIconOnly
          renderIcon={Close}
          iconDescription="Закрыть (Escape)"
          className="lightbox__close"
          onClick={onClose}
          autoFocus
        />

        {images.length > 1 && (
          <>
            <Button
              kind="ghost"
              hasIconOnly
              renderIcon={ChevronLeft}
              iconDescription="Предыдущее изображение (←)"
              className="lightbox__nav lightbox__nav--prev"
              onClick={onPrevious}
            />
            <Button
              kind="ghost"
              hasIconOnly
              renderIcon={ChevronRight}
              iconDescription="Следующее изображение (→)"
              className="lightbox__nav lightbox__nav--next"
              onClick={onNext}
            />
          </>
        )}

        <div className="lightbox__image-container">
          <img
            src={currentImage.file}
            alt={currentImage.file_name || 'Изображение'}
          />
        </div>

        {images.length > 1 && (
          <div className="lightbox__counter" aria-live="polite" aria-atomic="true">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {images.length > 1 && (
          <div className="lightbox__thumbnails" role="tablist" aria-label="Миниатюры изображений">
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                role="tab"
                aria-selected={index === currentIndex}
                aria-label={`Изображение ${index + 1}`}
                className={`lightbox__thumbnail ${index === currentIndex ? 'lightbox__thumbnail--active' : ''}`}
                onClick={() => {
                  const diff = index - currentIndex
                  if (diff > 0) {
                    for (let i = 0; i < diff; i++) onNext()
                  } else {
                    for (let i = 0; i < -diff; i++) onPrevious()
                  }
                }}
              >
                <img
                  src={image.thumbnail || image.file}
                  alt=""
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ImageGallery
