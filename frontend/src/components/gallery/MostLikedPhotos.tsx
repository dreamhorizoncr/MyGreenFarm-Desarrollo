import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Heart, ZoomIn } from 'lucide-react'
import Container from '../home/Container.tsx'
import PhotoLightbox from '../PhotoLightbox.tsx'
import { galleryService } from '../../services/gallery.ts'
import type { Gallery, GalleryImage } from '../../types/gallery.ts'

const PHOTO_LIMIT = 10

const COLUMN_BREAKPOINTS = [
  { query: '(min-width: 64rem)', columns: 5 },
  { query: '(min-width: 48rem)', columns: 3 },
]

const columnCount = () => COLUMN_BREAKPOINTS.find(({ query }) => window.matchMedia(query).matches)?.columns ?? 2

interface MostLikedPhotosProps {
  galleries: Gallery[]
}

function MostLikedPhotos({ galleries }: Readonly<MostLikedPhotosProps>) {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const [columns, setColumns] = useState(columnCount)
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [ranked, setRanked] = useState<GalleryImage[] | null>(null)

  useEffect(() => {
    const lists = COLUMN_BREAKPOINTS.map(({ query }) => window.matchMedia(query))
    const update = () => setColumns(columnCount())
    lists.forEach((list) => list.addEventListener('change', update))
    return () => lists.forEach((list) => list.removeEventListener('change', update))
  }, [])

  useEffect(() => {
    let active = true
    galleryService
      .getMostLikedImages(PHOTO_LIMIT)
      .then((images) => active && setRanked(images))
      .catch(() => active && setRanked([]))
    return () => {
      active = false
    }
  }, [])

  const albumTitles = new Map(galleries.map((gallery) => [gallery.id, gallery.title]))
  const loading = ranked === null
  const photos = (ranked ?? []).map((image) => ({ ...image, albumTitle: albumTitles.get(image.galleryId) ?? '' }))

  if (!loading && photos.length === 0) return null

  const slots = loading ? Array.from({ length: PHOTO_LIMIT }, () => null) : photos
  const grouped = Array.from({ length: columns }, (_, column) =>
    slots.map((photo, index) => ({ photo, index })).filter(({ index }) => index % columns === column),
  )

  return (
    <section className="w-full bg-white py-1000 md:py-1200">
      <Container className="flex flex-col items-center gap-xl">
        <div className="flex w-full flex-col items-start gap-sm text-left">
          <h2 className="m-0 font-heading text-h2 font-bold text-heading">{t('home.galeria.mostLikedTitle')}</h2>
          <div className="h-1 w-12 rounded-full bg-orange-500" aria-hidden="true" />
          <p className="m-0 max-w-[30rem] font-body text-body text-body-text">{t('home.galeria.mostLikedDescription')}</p>
        </div>

        <div className="flex w-full gap-sm pb-8 md:gap-md md:pb-10">
          {grouped.map((column, columnIndex) => (
            <div
              key={columnIndex}
              className={`flex min-w-0 flex-1 flex-col gap-sm md:gap-md ${columnIndex % 2 === 1 ? 'translate-y-8 md:translate-y-10' : ''}`}
            >
              {column.map(({ photo, index }) =>
                photo ? (
                  <motion.button
                    key={photo.id}
                    type="button"
                    onClick={() => setOpenIndex(index)}
                    aria-label={t('home.galeria.openPhoto', { title: photo.altText || photo.albumTitle || photo.title })}
                    initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '0px 0px -10% 0px' }}
                    transition={{ duration: 0.5, delay: (index % columns) * 0.08, ease: 'easeOut' }}
                    className="group relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-2xl bg-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--orange-500)]"
                  >
                    <img
                      src={photo.fileUrl}
                      alt={photo.altText || photo.albumTitle || photo.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                    <span className="absolute bottom-3 right-3 flex size-10 items-center justify-center rounded-full bg-black/55 text-white opacity-0 shadow transition group-hover:scale-105 group-hover:bg-black/70 group-hover:opacity-100 group-focus-visible:opacity-100">
                      <ZoomIn size={20} aria-hidden="true" />
                    </span>
                    {(photo.likeCount ?? 0) > 0 && (
                      <span className="absolute bottom-xs left-xs inline-flex items-center gap-2xs rounded-full bg-white/90 px-xs py-2xs font-body text-caption font-semibold text-pink-400 shadow-sm">
                        <Heart size={14} className="fill-current" aria-hidden="true" />
                        <span aria-hidden="true">{photo.likeCount}</span>
                        <span className="sr-only">{t('home.galeria.likeCount', { count: photo.likeCount })}</span>
                      </span>
                    )}
                  </motion.button>
                ) : (
                  <div key={`skeleton-${index}`} className="aspect-square w-full animate-pulse rounded-2xl bg-neutral-200" />
                ),
              )}
            </div>
          ))}
        </div>
      </Container>

      {openIndex !== null && (
        <PhotoLightbox
          images={photos.map((photo) => ({ id: photo.id, fileUrl: photo.fileUrl, title: photo.albumTitle, altText: photo.altText }))}
          initialIndex={openIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </section>
  )
}

export default MostLikedPhotos
