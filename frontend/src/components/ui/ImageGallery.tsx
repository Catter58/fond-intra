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
        <div className="image-gallery image-gallery--single">
          <div className="image-gallery__item" onClick={() => openLightbox(0)}>
            <img
              src={images[0].thumbnail || images[0].file}
              alt={images[0].file_name}
              loading="lazy"
            />
            <div className="image-gallery__overlay">
              <ZoomIn size={24} />
            </div>
          </div>
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
      <div className={`image-gallery image-gallery--grid image-gallery--count-${Math.min(images.length, 4)}`}>
        {images.slice(0, 4).map((image, index) => (
          <div
            key={image.id}
            className={`image-gallery__item ${index === 0 ? 'image-gallery__item--main' : ''}`}
            onClick={() => openLightbox(index)}
          >
            <img
              src={image.thumbnail || image.file}
              alt={image.file_name}
              loading="lazy"
            />
            <div className="image-gallery__overlay">
              {index === 3 && images.length > 4 ? (
                <span className="image-gallery__more">+{images.length - 4}</span>
              ) : (
                <ZoomIn size={24} />
              )}
            </div>
          </div>
        ))}
      </div>

      {showThumbnails && images.length > 4 && (
        <div className="image-gallery__thumbnails">
          {images.slice(4).map((image, index) => (
            <div
              key={image.id}
              className="image-gallery__thumbnail"
              onClick={() => openLightbox(index + 4)}
            >
              <img
                src={image.thumbnail || image.file}
                alt={image.file_name}
                loading="lazy"
              />
            </div>
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
    <div className="lightbox" onClick={onClose}>
      <div className="lightbox__content" onClick={(e) => e.stopPropagation()}>
        <Button
          kind="ghost"
          hasIconOnly
          renderIcon={Close}
          iconDescription="Закрыть"
          className="lightbox__close"
          onClick={onClose}
        />

        {images.length > 1 && (
          <>
            <Button
              kind="ghost"
              hasIconOnly
              renderIcon={ChevronLeft}
              iconDescription="Предыдущее"
              className="lightbox__nav lightbox__nav--prev"
              onClick={onPrevious}
            />
            <Button
              kind="ghost"
              hasIconOnly
              renderIcon={ChevronRight}
              iconDescription="Следующее"
              className="lightbox__nav lightbox__nav--next"
              onClick={onNext}
            />
          </>
        )}

        <div className="lightbox__image-container">
          <img
            src={currentImage.file}
            alt={currentImage.file_name}
          />
        </div>

        {images.length > 1 && (
          <div className="lightbox__counter">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {images.length > 1 && (
          <div className="lightbox__thumbnails">
            {images.map((image, index) => (
              <div
                key={image.id}
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
                  alt={image.file_name}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ImageGallery
