import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Heart } from 'lucide-react'
import Navbar from '../components/Navbar.tsx'
import Container from '../components/home/Container.tsx'
import PhotoLightbox from '../components/PhotoLightbox.tsx'
import { useGallery } from '../hooks/useGallery.ts'
import type { Gallery, GalleryImage } from '../types/gallery.ts'

interface LikeBadgeProps {
  image: GalleryImage
  albumTitle: string
}

function LikeBadge({ image, albumTitle }: LikeBadgeProps) {
  const { t } = useTranslation()
  const count = image.likeCount ?? 0

  return (
    <span
      className="absolute bottom-[10px] right-[10px] flex items-center gap-[6px] rounded-full bg-white px-[10px] py-[5px] shadow-md"
      aria-label={`${t('home.galeria.likes', { count })} · ${albumTitle}`}
    >
      <Heart size={14} className="text-red-500" fill="currentColor" aria-hidden="true" />
      <span className="font-body text-[12px] font-bold text-neutral-800">{count}</span>
    </span>
  )
}

function AlbumDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const { categories, galleriesByCategory, loading, error } = useGallery()
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const albumEntry = id
    ? Object.entries(galleriesByCategory).find(([, galleries]) =>
        galleries.some((gallery) => gallery.id === id),
      )
    : undefined

  const album: Gallery | undefined = albumEntry?.[1].find((gallery) => gallery.id === id)
  const category = categories.find((candidate) => candidate.id === albumEntry?.[0])

  const notFound = !loading && !error && !album

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
          {loading && (
            <p className="m-0 text-center font-body text-base text-green-500">
              {t('common.loading')}
            </p>
          )}

          {error && (
            <p className="m-0 text-center font-body text-base text-green-500">{error}</p>
          )}

          {notFound && (
            <p className="m-0 text-center font-body text-base text-green-500">
              {t('home.galeria.notFoundAlbum')}
            </p>
          )}

          {album && album.galleryImages.length === 0 && (
            <p className="m-0 text-center font-body text-base text-green-500">
              {t('home.galeria.emptyPhotos')}
            </p>
          )}

          {album && album.galleryImages.length > 0 && (
            <div className="grid grid-cols-2 gap-[12px] md:grid-cols-4 md:gap-[14px]">
              {album.galleryImages.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setLightboxIndex(index)}
                  className={`group relative aspect-square overflow-hidden rounded-[14px] shadow transition focus-visible:outline-2 focus-visible:outline-orange-500 focus-visible:outline-offset-2 ${
                    index === 0 ? 'col-span-2 row-span-2' : ''
                  }`}
                  aria-label={`${t('home.galeria.imageGallery')}: ${album.title} ${index + 1}`}
                >
                  <img
                    src={image.fileUrl}
                    alt={`${album.title} ${index + 1}`}
                    className="absolute inset-0 h-full w-full object-cover transition duration-300 ease-in-out group-hover:scale-[1.04]"
                    loading="lazy"
                  />
                  <LikeBadge image={image} albumTitle={album.title} />
                </button>
              ))}
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