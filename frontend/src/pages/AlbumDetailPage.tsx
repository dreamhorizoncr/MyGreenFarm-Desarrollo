import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { HeartIcon } from '@animateicons/react/lucide'
import Navbar from '../components/Navbar.tsx'
import Container from '../components/home/Container.tsx'
import PhotoLightbox from '../components/PhotoLightbox.tsx'
import { useGallery } from '../hooks/useGallery.ts'
import type { Gallery } from '../types/gallery.ts'
import { galleryService } from '../services/gallery.ts'
import { useImageLikes } from '../hooks/useImageLikes.ts'

interface LikeBadgeProps {
  albumTitle: string
  liked: boolean
  totalLikes: number
  loading: boolean
  onToggle: () => void
}

function LikeBadge({ albumTitle, liked, totalLikes, loading, onToggle }: LikeBadgeProps) {
  const { t } = useTranslation()

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
      disabled={loading}
      className="absolute bottom-[10px] right-[10px] flex items-center gap-[6px] rounded-full bg-white px-[10px] py-[5px] shadow-md transition hover:scale-105 disabled:opacity-70"
      aria-label={`${liked ? t('home.galeria.unlike') : t('home.galeria.like')} · ${albumTitle}`}
      aria-pressed={liked}
    >
      <HeartIcon
        size={14}
        className={liked ? 'fill-current text-red-500' : 'text-neutral-400'}
        aria-hidden="true"
      />
      <span className="font-body text-[12px] font-bold text-neutral-800">{totalLikes}</span>
    </button>
  )
}


function AlbumDetailPage() {
  const { t, i18n } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const { categories, galleriesByCategory, fetchGallery } = useGallery()
  const { imageLikes, initializeLikes, toggleReaction } = useImageLikes()
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  useEffect(() => {
    void fetchGallery(i18n.language)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language])

  const albumEntry = id
    ? Object.entries(galleriesByCategory).find(([, galleries]) =>
      galleries.some((gallery) => gallery.id === id),
    )
    : undefined

  const album: Gallery | undefined = albumEntry?.[1].find((gallery) => gallery.id === id)
  const category = categories.find((candidate) => candidate.id === albumEntry?.[0])

  // inicializa likes cuando el álbum ya tiene imágenes cargadas
  useEffect(() => {
    if (album && album.galleryImages.length > 0) {
      galleryService.getMyLikes().then((likedImageIds) => {
        initializeLikes(album.galleryImages, likedImageIds)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [album?.id])

  return (
    <div id="album-detail-page" className="min-h-screen bg-bg-page">
      <Navbar />

      {/* Encabezado del álbum */}
      <section className="bg-white px-[30px] py-[50px] md:py-[70px]">
        <Container>
          <nav
            aria-label="breadcrumb"
            className="flex flex-wrap items-center gap-[6px] font-body text-[16px] text-neutral-500"
          >
            <Link className="transition hover:text-green-500" to="/multimedia">
              {t('home.galeria.breadcrumbGallery')}
            </Link>
            <span aria-hidden="true">/</span>
            <Link className="transition hover:text-green-500" to="/multimedia">
              {t('home.galeria.breadcrumbAlbums')}
            </Link>
            {category && (
              <>
                <span aria-hidden="true">/</span>
                <Link className="transition hover:text-green-500" to="/multimedia">
                  {category.title}
                </Link>
              </>
            )}
            {album && (
              <>
                <span aria-hidden="true">/</span>
                <span className="text-green-500">{album.title}</span>
              </>
            )}
          </nav>

          {album && (
            <header className="mx-auto mt-[32px] max-w-[760px] text-center">
              <h1 className="mt-0 font-heading text-[30px] font-bold leading-tight text-green-500 md:text-[42px]">
                {album.title}
              </h1>

              <p className="mt-[16px] font-body text-[13px] leading-[1.7] text-green-500 md:text-[15px]">
                {album.description}
              </p>
            </header>
          )}
        </Container>
      </section>

      {/* Fotos del álbum */}
      <main>
        <Container className="py-[60px] md:py-[80px]">
          {/* ... loading / error / notFound sin cambios ... */}

          {album && album.galleryImages.length > 0 && (
            <div className="grid grid-cols-2 gap-[12px] md:grid-cols-4 md:gap-[14px]">
              {album.galleryImages.map((image, index) => {
                const likeState = imageLikes[image.id]
                return (
                  <div
                    key={image.id}
                    className={`group relative aspect-square overflow-hidden rounded-[14px] shadow ${index === 0 ? 'col-span-2 row-span-2' : ''
                      }`}
                  >
                    <button
                      type="button"
                      onClick={() => setLightboxIndex(index)}
                      className="absolute inset-0 h-full w-full focus-visible:outline-2 focus-visible:outline-orange-500 focus-visible:outline-offset-2"
                      aria-label={`${t('home.galeria.imageGallery')}: ${album.title} ${index + 1}`}
                    >
                      <img
                        src={image.fileUrl}
                        alt={`${album.title} ${index + 1}`}
                        className="h-full w-full object-cover transition duration-300 ease-in-out group-hover:scale-[1.04]"
                        loading="lazy"
                      />
                    </button>
                    <LikeBadge
                      albumTitle={album.title}
                      liked={likeState?.liked ?? false}
                      totalLikes={likeState?.totalLikes ?? image.likeCount ?? 0}
                      loading={likeState?.loading ?? false}
                      onToggle={() => toggleReaction(image.id)}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </Container>
      </main>

      {album && lightboxIndex !== null && album.galleryImages[lightboxIndex] && (
        <PhotoLightbox
          images={album.galleryImages}
          initialIndex={lightboxIndex}
          alt={album.title}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  )
}

export default AlbumDetailPage