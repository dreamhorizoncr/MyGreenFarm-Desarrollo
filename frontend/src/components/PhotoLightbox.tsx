import { useEffect, useRef, useState } from 'react'
import { XIcon } from '@animateicons/react/lucide'
import { useTranslation } from 'react-i18next'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Keyboard, Zoom } from 'swiper/modules'
import type { Swiper as SwiperInstance } from 'swiper'
import 'swiper/css'
import 'swiper/css/zoom'
import CarouselDots from './ui/CarouselDots.tsx'
import type { GalleryImage } from '../types/gallery.ts'

interface PhotoLightboxProps {
  images: GalleryImage[]
  initialIndex: number
  alt?: string
  onClose: () => void
}

// Las flechas van a los lados de la foto activa (no del carrusel), a esta distancia de su borde.
const ARROW_GAP = 12

function ArrowIcon({ flip = false }: Readonly<{ flip?: boolean }>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`size-[40%] ${flip ? 'rotate-180' : ''}`}>
      <polygon points="7,4 20,12 7,20" fill="currentColor" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  )
}

const arrowClassName =
  'absolute top-1/2 z-10 flex size-[36px] -translate-y-1/2 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg transition-[left,right,scale,opacity] duration-300 enabled:hover:scale-105 enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 md:size-[44px]'

// Visor de fotos con carrusel (Swiper): las fotos se deslizan al cambiar, se pueden
// arrastrar o deslizar con el dedo, y hacer zoom con doble click o pellizco.
function PhotoLightbox({ images, initialIndex, alt, onClose }: Readonly<PhotoLightboxProps>) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [swiper, setSwiper] = useState<SwiperInstance | null>(null)
  const [index, setIndex] = useState(initialIndex)
  // Mitad del ancho de la foto activa, para ubicar las flechas junto a ella.
  const [photoHalfWidth, setPhotoHalfWidth] = useState(0)
  const total = images.length

  useEffect(() => {
    dialogRef.current?.showModal()

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  const measurePhoto = (current: SwiperInstance | null) => {
    if (!current) return
    // offsetWidth no cambia con el zoom (transform), solo con el tamaño real de la foto.
    const photo = current.slides[current.activeIndex]?.querySelector('img')
    setPhotoHalfWidth((photo?.offsetWidth || current.width) / 2)
  }

  const arrowOffset = `calc(50% + ${photoHalfWidth + ARROW_GAP}px)`
  const image = images[index]
  // Sin vuelta: en la primera foto se bloquea "anterior" y en la última "siguiente".
  const isFirst = index === 0
  const isLast = index === total - 1

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose()
      }}
      aria-label={image?.title || alt}
      className="inset-0 m-0 flex h-full w-full max-h-none max-w-none items-center justify-center bg-transparent p-[16px] backdrop:bg-black/90 md:p-[30px]"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={t('home.galeria.closePhoto')}
        className="absolute right-md top-md z-10 flex size-[42px] items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
      >
        <XIcon size={20} />
      </button>

      <figure className="m-0 flex max-h-full max-w-full flex-col items-center gap-md">
        {/* El padding lateral deja lugar a las flechas, que siguen el borde de la foto activa */}
        <div className="relative px-[48px] md:px-[60px]">
          {total > 1 && (
            <button
              type="button"
              onClick={() => swiper?.slidePrev()}
              disabled={isFirst}
              aria-label={t('home.galeria.prevPhoto')}
              className={arrowClassName}
              style={{ right: arrowOffset }}
            >
              <ArrowIcon flip />
            </button>
          )}

          <Swiper
            modules={[Zoom, Keyboard]}
            initialSlide={initialIndex}
            spaceBetween={24}
            grabCursor
            zoom={{ maxRatio: 3 }}
            keyboard={{ enabled: true }}
            onSwiper={(current) => {
              setSwiper(current)
              measurePhoto(current)
            }}
            onSlideChange={(current) => {
              setIndex(current.activeIndex)
              measurePhoto(current)
            }}
            onResize={measurePhoto}
            // Click (no arrastre) en el espacio vacío alrededor de la foto: cierra, igual que el fondo.
            onClick={(_, event) => {
              if (!(event.target instanceof HTMLImageElement)) onClose()
            }}
            className="h-[80vh] w-[min(1100px,calc(100vw-128px))] md:w-[min(1100px,calc(100vw-180px))]"
          >
            {images.map((item) => (
              <SwiperSlide key={item.id}>
                <div className="swiper-zoom-container">
                  <img src={item.fileUrl} alt={item.title || alt || ''} onLoad={() => measurePhoto(swiper)} className="rounded-2xl" />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {total > 1 && (
            <button
              type="button"
              onClick={() => swiper?.slideNext()}
              disabled={isLast}
              aria-label={t('home.galeria.nextPhoto')}
              className={arrowClassName}
              style={{ left: arrowOffset }}
            >
              <ArrowIcon />
            </button>
          )}
        </div>

        {total > 1 && (
          <CarouselDots
            count={total}
            activeIndex={index}
            onSelect={(target) => swiper?.slideTo(target)}
            ariaLabel={t('home.galeria.photoNavigation')}
            getItemLabel={(target) => t('home.galeria.goToPhoto', { number: target + 1 })}
          />
        )}
      </figure>
    </dialog>
  )
}

export default PhotoLightbox
