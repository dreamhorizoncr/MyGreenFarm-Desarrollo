import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { GalleryImage } from '../types/gallery.ts'

interface PhotoLightboxProps {
  images: GalleryImage[]
  initialIndex: number
  alt?: string
  onClose: () => void
}

function PhotoLightbox({ images, initialIndex, alt, onClose }: PhotoLightboxProps) {
  const { t } = useTranslation()
  const [index, setIndex] = useState(initialIndex)
  const total = images.length

  const goPrev = () => {
    setIndex((current) => (current - 1 + total) % total)
  }

  const goNext = () => {
    setIndex((current) => (current + 1) % total)
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      } else if (event.key === 'ArrowLeft') {
        goPrev()
      } else if (event.key === 'ArrowRight') {
        goNext()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
 
  }, [onClose, total])

  const image = images[index]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-[16px] md:p-[30px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={image?.title || alt}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={t('home.galeria.closePhoto')}
        className="absolute right-md top-md flex size-[42px] items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
      >
        <X size={20} />
      </button>

      <figure
        className="flex max-h-full max-w-full flex-col items-center gap-md"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative">
          <img
            src={image?.fileUrl}
            alt={image?.title || alt || ''}
            className="max-h-[80vh] max-w-full rounded-[16px] object-contain"
          />

          {total > 1 && (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  goPrev()
                }}
                aria-label={t('home.galeria.prevPhoto')}
                className="absolute left-[12px] top-1/2 flex size-[36px] -translate-y-1/2 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg transition hover:scale-105 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 md:size-[44px]"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[40%] rotate-180">
                  <polygon
                    points="7,4 20,12 7,20"
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  goNext()
                }}
                aria-label={t('home.galeria.nextPhoto')}
                className="absolute right-[12px] top-1/2 flex size-[36px] -translate-y-1/2 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg transition hover:scale-105 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 md:size-[44px]"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[40%]">
                  <polygon
                    points="7,4 20,12 7,20"
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </>
          )}
        </div>

        {total > 1 && (
          <figcaption className="font-body text-body-sm font-semibold text-white">
            {index + 1} / {total}
          </figcaption>
        )}
      </figure>
    </div>
  )
}

export default PhotoLightbox