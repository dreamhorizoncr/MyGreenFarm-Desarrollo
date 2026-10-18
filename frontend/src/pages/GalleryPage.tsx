import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import useEmblaCarousel from 'embla-carousel-react'
import Navbar from '../components/Navbar.tsx'
import Container from '../components/home/Container.tsx'
import MultimediaCard from '../components/home/MultimediaCard.tsx'
import { useGallery } from '../hooks/useGallery.ts'
import ninos2 from '../assets/imgs/ninos2.svg'
import SkeletonList from '../components/ui/SkeletonList.tsx'
import { useSkeletonCount } from '../hooks/useSkeletonCount.ts'
import TabHighlight from '../components/ui/TabHighlight.tsx'

function GalleryPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { categories, allGalleries, getGalleriesByCategory, loading, error, fetchGallery } = useGallery()
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  useEffect(() => {
    void fetchGallery(i18n.language)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language])

  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start' })
  const [fits, setFits] = useState(true)

  useEffect(() => {
    if (!emblaApi) return
    const updateFits = () => setFits(!emblaApi.canScrollPrev() && !emblaApi.canScrollNext())
    updateFits()
    emblaApi.on('select', updateFits)
    emblaApi.on('reInit', updateFits)
    return () => {
      emblaApi.off('select', updateFits)
      emblaApi.off('reInit', updateFits)
    }
  }, [emblaApi])

  const visibleGalleries = activeCategory ? getGalleriesByCategory(activeCategory) : allGalleries
  const galleriesInYearOrder = [...categories]
    .sort((a, b) => b.title.localeCompare(a.title, undefined, { numeric: true }))
    .map((category) => ({
      category,
      galleries: getGalleriesByCategory(category.id),
    }))
    .filter((group) => group.galleries.length > 0)
    .flatMap((group) => group.galleries)

  const selectCategory = (categoryId: string | null) => {
    setActiveCategory(categoryId)
  }

  const skeletonCount = useSkeletonCount('gallery', loading, visibleGalleries.length, 3)

  return (
    <div id="gallery-page" className="min-h-screen bg-bg-page">
      <Navbar />

      <section className="flex min-h-[280px] items-start bg-white px-[30px] pt-[48px] pb-[40px] text-center md:min-h-[320px] md:pt-[72px]">
        <div className="mx-auto w-full max-w-[700px]">
          <h1 className="m-0 font-heading text-h1 font-bold leading-tight text-green-500">
            {t('home.galeria.title')}
          </h1>

          <p className="mx-auto mt-[20px] max-w-[560px] font-body text-body-sm leading-[1.6] text-green-500 md:text-body-sm">
            {t('home.galeria.description')}
          </p>

          <div className="mt-[24px] w-full overflow-hidden" ref={emblaRef}>
            <div className={`isolate flex items-center gap-[10px] ${fits ? 'w-full justify-center' : ''}`}>
              <button
                type="button"
                onClick={() => selectCategory(null)}
                className={`relative shrink-0 rounded-full border px-md py-xs font-body text-body-sm font-semibold transition-colors duration-300 ${
                  activeCategory === null
                    ? 'border-orange-500 text-white'
                    : 'border-orange-500 bg-transparent text-orange-600 hover:bg-orange-50'
                }`}
              >
                {activeCategory === null && <TabHighlight layoutId="gallery-category-tab" className="bg-orange-500" />}
                {t('home.galeria.filterAll')}
              </button>

              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => selectCategory(category.id)}
                  className={`relative shrink-0 rounded-full border px-md py-xs font-body text-body-sm font-semibold transition-colors duration-300 ${
                    activeCategory === category.id
                      ? 'border-orange-500 text-white'
                      : 'border-orange-500 bg-transparent text-orange-600 hover:bg-orange-50'
                  }`}
                >
                  {activeCategory === category.id && <TabHighlight layoutId="gallery-category-tab" className="bg-orange-500" />}
                  {category.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section data-scroll-bg="green" className="relative w-full bg-green-500 py-10 md:py-12">
        <div className="flex w-full flex-col gap-[24px]">
          <Container className="flex flex-col items-start gap-[16px] text-left">
            <h2 className="m-0 font-heading text-h2 font-bold text-white">
              {t('home.galeria.albumTitle')}
            </h2>

            <div className="h-1 w-12 rounded-full bg-orange-500" aria-hidden="true" />

            <p className="max-w-[25rem] font-body text-body font-normal text-white">
              {t('home.galeria.description')}
            </p>
          </Container>

          <Container className="flex flex-col gap-[32px]">
            {loading && (
              <div className="grid grid-cols-1 gap-[24px] md:grid-cols-3">
                <SkeletonList count={skeletonCount}>{() => <MultimediaCard loading />}</SkeletonList>
              </div>
            )}

            {error && (
              <p className="col-span-full m-0 p-xl text-center font-body text-body text-white">
                {error}
              </p>
            )}

            {!loading && !error && visibleGalleries.length === 0 && (
              <p className="col-span-full m-0 p-xl text-center font-body text-body text-white">
                {activeCategory ? t('home.galeria.empty') : t('home.galeria.noGalleries')}
              </p>
            )}

            {!loading && !error && (
              <div className="grid grid-cols-1 gap-[24px] md:grid-cols-3">
                {(activeCategory ? visibleGalleries : galleriesInYearOrder).map((gallery) => (
                  <MultimediaCard
                    key={gallery.id}
                    imageSrc={gallery.galleryImages[0]?.fileUrl ?? ninos2}
                    alt={gallery.title}
                    badge={t('home.galeria.photoCount', { count: gallery.galleryImages.length })}
                    title={gallery.title}
                    description={gallery.description}
                    onClick={() => navigate(`/albumes/${gallery.id}`)}
                  />
                ))}
              </div>
            )}
          </Container>
        </div>
      </section>

      <section
        aria-hidden="true"
        className="h-[280px] w-full bg-white md:h-[320px]"
      />

    </div>
  )
}

export default GalleryPage
