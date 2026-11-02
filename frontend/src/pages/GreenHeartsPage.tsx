import { BookOpen, Heart, HandHeart, Handshake, ShieldCheck, Users, Utensils, Gift, Sprout, Eye, Target } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'motion/react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { A11y, Grid, Pagination } from 'swiper/modules'
import type { Swiper as SwiperInstance } from 'swiper'
import 'swiper/css'
import 'swiper/css/pagination'
import Navbar from '../components/Navbar.tsx'
import Container from '../components/home/Container.tsx'
import CarouselArrowIcon from '../components/ui/CarouselArrowIcon.tsx'
import Skeleton from '../components/ui/Skeleton.tsx'
import greenKids from '../assets/imgs/greenKids.png'
import puzzlePiece1 from '../assets/imgs/PIEZA1.svg'
import puzzlePiece2 from '../assets/imgs/PIEZA2.svg'
import puzzlePiece3 from '../assets/imgs/PIEZA3.svg'
import puzzlePiece4 from '../assets/imgs/PIEZA4.svg'
import puzzlePiece5 from '../assets/imgs/PIEZA5.svg'
import puzzlePiece6 from '../assets/imgs/PIEZA6.svg'
import './greenHearts.css'

const PURPOSE_UNDERLINE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 16' preserveAspectRatio='none'%3E%3Cpath d='M4 11C70 4 160 3 296 8' fill='none' stroke='%23F37B25' stroke-width='6' stroke-linecap='round'/%3E%3C/svg%3E")`

const values = [
  { labelKey: 'greenHearts.values.items.solidarity', icon: Handshake },
  { labelKey: 'greenHearts.values.items.empathy', icon: Heart },
  { labelKey: 'greenHearts.values.items.respect', icon: ShieldCheck },
  { labelKey: 'greenHearts.values.items.equity', icon: Users },
  { labelKey: 'greenHearts.values.items.commitment', icon: Target },
  { labelKey: 'greenHearts.values.items.transparency', icon: Eye },
] as const

const puzzlePieces = [
  { src: puzzlePiece1, left: '0%', top: '0%', width: '31.83%', height: '63.32%' },
  { src: puzzlePiece2, left: '22.01%', top: '0%', width: '51.68%', height: '48.97%' },
  { src: puzzlePiece3, left: '64.23%', top: '0%', width: '35.77%', height: '63.32%' },
  { src: puzzlePiece4, left: '0%', top: '48.87%', width: '31.76%', height: '51.24%' },
  { src: puzzlePiece5, left: '22.01%', top: '33.5%', width: '52.69%', height: '66.67%' },
  { src: puzzlePiece6, left: '64.23%', top: '48.87%', width: '35.77%', height: '51.13%' },
]

const actions = [
  { titleKey: 'greenHearts.actions.items.scholarships.title', textKey: 'greenHearts.actions.items.scholarships.text', icon: BookOpen, number: '01' },
  { titleKey: 'greenHearts.actions.items.financialAid.title', textKey: 'greenHearts.actions.items.financialAid.text', icon: HandHeart, number: '02' },
  { titleKey: 'greenHearts.actions.items.foodDonations.title', textKey: 'greenHearts.actions.items.foodDonations.text', icon: Utensils, number: '03' },
  { titleKey: 'greenHearts.actions.items.giftCampaigns.title', textKey: 'greenHearts.actions.items.giftCampaigns.text', icon: Gift, number: '04' },
  { titleKey: 'greenHearts.actions.items.communityActions.title', textKey: 'greenHearts.actions.items.communityActions.text', icon: Sprout, number: '05' },
] as const

function GreenHeartsPageSkeleton({ loadingLabel }: Readonly<{ loadingLabel: string }>) {
  return (
    <div role="status" aria-label={loadingLabel} aria-busy="true" className="min-h-screen bg-bg-page">
      <Navbar />
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-5 bg-white px-6 md:min-h-[320px]">
        <Skeleton shape="line" className="h-10 w-3/4 max-w-[520px]" />
        <Skeleton shape="line" className="h-4 w-5/6 max-w-[560px]" />
      </div>
      <Skeleton shape="rect" className="h-[360px] w-full rounded-none sm:h-[440px]" />
      <div className="mx-auto grid w-full max-w-[1200px] gap-6 px-6 py-20 md:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <article key={index} className="rounded-3xl border border-neutral-200 bg-white p-7 sm:p-10">
            <Skeleton shape="line" className="mb-8 h-8 w-2/5" />
            <Skeleton shape="line" className="mb-3 h-4 w-full" />
            <Skeleton shape="line" className="mb-3 h-4 w-full" />
            <Skeleton shape="line" className="h-4 w-3/4" />
          </article>
        ))}
      </div>
      <div className="bg-green-500 px-6 py-20">
        <div className="mx-auto grid max-w-[1200px] gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <article key={index} className="flex min-h-[320px] flex-col rounded-3xl bg-white p-7 sm:p-9">
              <div className="mb-8 flex items-center justify-between">
                <Skeleton shape="line" className="h-10 w-12" />
                <Skeleton shape="circle" className="size-20" />
              </div>
              <Skeleton shape="line" className="mb-4 h-6 w-3/4" />
              <Skeleton shape="line" className="mb-3 h-4 w-full" />
              <Skeleton shape="line" className="h-4 w-2/3" />
            </article>
          ))}
        </div>
      </div>
      <div className="mx-auto w-full max-w-[900px] px-6 py-20">
        <Skeleton shape="line" className="mx-auto mb-14 h-10 w-64" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <article key={index} className="flex min-h-[280px] flex-col items-center justify-center gap-5 rounded-3xl border border-neutral-200 bg-white p-6 shadow">
              <Skeleton shape="circle" className="size-14" />
              <Skeleton shape="line" className="h-6 w-3/4" />
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}

function GreenHeartsPage() {
  const { t } = useTranslation()
  const [pageReady, setPageReady] = useState(false)
  const reduceMotion = useReducedMotion()
  const [actionsSwiper, setActionsSwiper] = useState<SwiperInstance | null>(null)
  const [actionsIndex, setActionsIndex] = useState(0)
  const [valuesSwiper, setValuesSwiper] = useState<SwiperInstance | null>(null)
  const [valuesIndex, setValuesIndex] = useState(0)
  const [hoveredPuzzlePiece, setHoveredPuzzlePiece] = useState<number | null>(null)
  const [puzzleInView, setPuzzleInView] = useState(false)
  const puzzleRef = useRef<HTMLDivElement | null>(null)
  const actionArrowClass = 'z-10 flex size-11 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg transition-[scale,opacity] duration-300 enabled:hover:scale-105 enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:bg-orange-500 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2'

  useEffect(() => {
    let cancelled = false
    const imageUrls = [greenKids, ...puzzlePieces.map(({ src }) => src)]
    const imageLoads = imageUrls.map((src) => new Promise<void>((resolve) => {
      const image = new Image()
      image.onload = () => resolve()
      image.onerror = () => resolve()
      image.src = src
      if (image.complete) resolve()
    }))
    const minimumSkeletonTime = new Promise<void>((resolve) => window.setTimeout(resolve, 250))

    void Promise.all([Promise.all(imageLoads), minimumSkeletonTime]).then(() => {
      if (!cancelled) setPageReady(true)
    })

    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const puzzle = puzzleRef.current
    if (!pageReady || !puzzle || puzzleInView) return

    if (!('IntersectionObserver' in window)) {
      setPuzzleInView(true)
      return
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setPuzzleInView(true)
        observer.disconnect()
      }
    }, { threshold: 0.3 })

    observer.observe(puzzle)
    return () => observer.disconnect()
  }, [pageReady, puzzleInView])

  if (!pageReady) return <GreenHeartsPageSkeleton loadingLabel={t('greenHearts.loading')} />

  return (
    <>
      <Navbar />
      <main className="overflow-hidden bg-bg-page text-body-text-dark">
        <section className="flex min-h-[280px] items-start bg-white px-[30px] pb-[40px] pt-[48px] text-center md:min-h-[320px] md:pt-[72px]">
          <div className="mx-auto w-full max-w-[700px]">
            <h1 className="m-0 font-heading text-h1 font-bold leading-tight text-green-500">{t('greenHearts.hero.title')}</h1>
            <p className="mx-auto mt-[20px] max-w-[560px] font-body text-body-sm leading-[1.6] text-green-500 md:text-body-sm">{t('greenHearts.hero.description')}</p>
          </div>
        </section>

        <section
          data-scroll-bg="green"
          className="green-hearts-hero relative overflow-hidden bg-cover bg-center py-20 text-white sm:py-28"
          style={{ backgroundImage: `url(${greenKids})` }}
        >
          <div className="absolute inset-0 bg-green-900/65" />
          <Container>
            <div className="relative mx-auto max-w-6xl text-center">
              <p className="mx-auto mb-6 w-fit rounded-full border border-orange-500 bg-orange-500 px-lg py-sm font-body text-body-sm font-semibold uppercase tracking-wide text-white">{t('greenHearts.purpose.label')}</p>
              <p className="m-0 font-heading text-h3 font-semibold leading-relaxed text-white">
                {t('greenHearts.purpose.beforeFirst')}{' '}
                <span className="bg-no-repeat pb-[0.12em] [background-position:0_100%] [background-size:100%_0.3em] [box-decoration-break:clone] [-webkit-box-decoration-break:clone]" style={{ backgroundImage: PURPOSE_UNDERLINE }}>{t('greenHearts.purpose.firstHighlight')}</span>
                {' '}{t('greenHearts.purpose.afterFirst')}<br className="hidden lg:block" /> {t('greenHearts.purpose.middle')}
                <br className="hidden lg:block" /> {t('greenHearts.purpose.beforeSecond')}{' '}
                <span className="bg-no-repeat pb-[0.12em] [background-position:0_100%] [background-size:100%_0.3em] [box-decoration-break:clone] [-webkit-box-decoration-break:clone]" style={{ backgroundImage: PURPOSE_UNDERLINE }}>{t('greenHearts.purpose.secondHighlight')}</span>
                {' '}{t('greenHearts.purpose.beforeThird')}{' '}
                <span className="bg-no-repeat pb-[0.12em] [background-position:0_100%] [background-size:100%_0.3em] [box-decoration-break:clone] [-webkit-box-decoration-break:clone]" style={{ backgroundImage: PURPOSE_UNDERLINE }}>{t('greenHearts.purpose.thirdHighlight')}</span>.
              </p>
            </div>
          </Container>
        </section>

        <section className="pb-2 pt-16 sm:pb-4 sm:pt-24" id="por-que-nace">
          <Container>
            <div className="w-full text-left">
              <h2 className="mb-5 font-heading text-h2 font-bold text-heading">{t('greenHearts.why.title')}</h2>
              <p className="mb-4 font-body text-body leading-[1.6] text-body-text-dark">{t('greenHearts.why.paragraph1')}</p>
              <p className="m-0 font-body text-body leading-[1.6] text-body-text-dark">{t('greenHearts.why.paragraph2')}</p>
            </div>
          </Container>
        </section>

        <section className="pb-16 pt-16 sm:pb-24 sm:pt-24">
          <Container>
            <div className="mb-10 text-left"><h2 className="m-0 font-heading text-h2 font-bold text-heading">{t('greenHearts.direction.title')}</h2><p className="mt-3 w-full max-w-[42rem] font-body text-body leading-[1.6] text-body-text-dark">{t('greenHearts.direction.description')}</p></div>
            <div className="grid gap-5 md:grid-cols-2">
              <article className="rounded-3xl border border-neutral-200 bg-white p-7 text-left shadow sm:p-10"><div className="mb-5 flex items-center gap-3 text-orange-500"><h3 className="m-0 font-heading text-h2 font-bold text-orange-500">{t('greenHearts.direction.missionTitle')}</h3></div><p className="m-0 font-body text-body leading-[1.6] text-body-text-dark">{t('greenHearts.direction.mission')}</p></article>
              <article className="rounded-3xl border border-neutral-200 bg-white p-7 text-left shadow sm:p-10"><div className="mb-5 flex items-center gap-3 text-orange-500"><h3 className="m-0 font-heading text-h2 font-bold text-orange-500">{t('greenHearts.direction.visionTitle')}</h3></div><p className="m-0 font-body text-body leading-[1.6] text-body-text-dark">{t('greenHearts.direction.vision')}</p></article>
            </div>
          </Container>
        </section>

        <section data-scroll-bg="green" className="bg-green-500 py-16 text-white sm:py-24" id="lineas-de-accion">
          <div className="mx-auto w-full max-w-[1200px] px-6">
            <div className="mb-10 text-left md:mb-12">
              <span className="mb-6 flex w-fit self-start rounded-full border border-orange-500 bg-orange-500 px-md py-xs text-left font-body text-body-sm font-semibold uppercase tracking-wide text-white">{t('greenHearts.actions.label')}</span>
              <div className="green-hearts-actions-header grid items-center gap-6 md:grid-cols-2 md:gap-12">
                <h2 className="m-0 w-full max-w-xl text-left font-heading text-h2 font-bold leading-tight text-white">{t('greenHearts.actions.title')}</h2>
                <p className="m-0 w-full max-w-2xl text-left font-body text-body leading-[1.6] text-white">{t('greenHearts.actions.description')}</p>
              </div>
            </div>
            <div className="relative">
              <button type="button" onClick={() => actionsSwiper?.slidePrev()} disabled={!actionsSwiper || actionsSwiper.isBeginning} aria-label={t('greenHearts.previousAction')} className={`${actionArrowClass} absolute -left-14 top-1/2 hidden -translate-y-1/2 lg:flex`}>
                <CarouselArrowIcon flip />
              </button>
              <Swiper
                className="green-hearts-actions-swiper"
                data-active-index={actionsIndex}
                modules={[A11y, Pagination]}
                spaceBetween={32}
                slidesPerView={1}
                pagination={{ clickable: true }}
                slidesPerGroup={1}
                onSwiper={(swiper) => { setActionsSwiper(swiper); setActionsIndex(swiper.activeIndex) }}
                onSlideChange={(swiper) => setActionsIndex(swiper.activeIndex)}
                onBreakpoint={(swiper) => setActionsIndex(swiper.activeIndex)}
                breakpoints={{
                  640: { slidesPerView: 2 },
                  1024: { slidesPerView: 3, slidesPerGroup: 3 },
                  1280: { slidesPerView: 3, slidesPerGroup: 3 },
                }}
                a11y={{ enabled: true }}
              >
                {actions.map(({ titleKey, textKey, icon: Icon, number }) => (
                  <SwiperSlide key={titleKey} className="!h-auto">
                    <article className="h-full min-h-[380px] rounded-3xl bg-white p-7 text-left sm:p-9">
                      <div className="mb-8 flex items-center justify-between gap-4">
                        <span className="font-heading text-h1 font-bold leading-none text-green-500">{number}</span>
                        <span className="flex size-20 shrink-0 items-center justify-center text-orange-500"><Icon size={38} strokeWidth={1.8} /></span>
                      </div>
                      <h3 className="mb-4 font-heading text-h4 font-bold text-green-500">{t(titleKey)}</h3>
                      <p className="m-0 font-body text-body leading-[1.6] text-body-text-dark">{t(textKey)}</p>
                    </article>
                  </SwiperSlide>
                ))}
              </Swiper>
              <button type="button" onClick={() => actionsSwiper?.slideNext()} disabled={!actionsSwiper || actionsSwiper.isEnd} aria-label={t('greenHearts.nextAction')} className={`${actionArrowClass} absolute -right-14 top-1/2 hidden -translate-y-1/2 lg:flex`}>
                <CarouselArrowIcon />
              </button>
              <div className="mt-3 flex justify-center gap-3 lg:hidden">
                <button type="button" onClick={() => actionsSwiper?.slidePrev()} disabled={!actionsSwiper || actionsSwiper.isBeginning} aria-label={t('greenHearts.previousAction')} className={actionArrowClass}>
                  <CarouselArrowIcon flip />
                </button>
                <button type="button" onClick={() => actionsSwiper?.slideNext()} disabled={!actionsSwiper || actionsSwiper.isEnd} aria-label={t('greenHearts.nextAction')} className={actionArrowClass}>
                  <CarouselArrowIcon />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24" id="valores">
          <Container>
            <h2 className="mb-16 text-center font-heading text-h1 font-bold leading-tight text-green-500">
              <span className="bg-no-repeat pb-[0.12em] [background-position:0_100%] [background-size:100%_0.3em] [box-decoration-break:clone] [-webkit-box-decoration-break:clone]" style={{ backgroundImage: PURPOSE_UNDERLINE }}>{t('greenHearts.values.title')}</span>
            </h2>
            <div ref={puzzleRef} className={`green-hearts-values-puzzle mx-auto hidden lg:block${puzzleInView ? ' is-in-view' : ''}`}>
              <div className="green-hearts-values-puzzle-art" aria-hidden="true">
                {puzzlePieces.map(({ src, left, top, width, height }, index) => (
                  <img key={index} src={src} alt="" className={hoveredPuzzlePiece === index ? 'is-raised' : undefined} style={{ left, top, width, height }} />
                ))}
              </div>
              <div className="green-hearts-values-puzzle-content">
                {values.map(({ labelKey, icon: Icon }, index) => (
                  <article key={labelKey} onMouseEnter={() => setHoveredPuzzlePiece(index)} onMouseLeave={() => setHoveredPuzzlePiece(null)} className={`green-hearts-puzzle-value green-hearts-puzzle-value-${index + 1} green-hearts-puzzle-value-${index % 3 === 0 ? 'left' : index % 3 === 1 ? 'center' : 'right'}${hoveredPuzzlePiece === index ? ' is-raised' : ''}`}>
                    <span className="mb-3 flex w-fit items-center text-white" aria-hidden="true">
                      <Icon size={32} strokeWidth={1.8} />
                    </span>
                    <h3 className="mb-2 font-heading text-h6 font-bold text-white">{t(labelKey)}</h3>
                  </article>
                ))}
              </div>
            </div>
            <div className="green-hearts-values-carousel">
            <Swiper
              className="green-hearts-values-swiper"
              modules={[A11y, Grid, Pagination]}
                spaceBetween={0}
              slidesPerView={1}
              slidesPerGroup={1}
              slidesPerGroupSkip={1}
              grabCursor
              pagination={{ clickable: true }}
              onSwiper={(swiper) => { setValuesSwiper(swiper); setValuesIndex(swiper.activeIndex) }}
              onSlideChange={(swiper) => setValuesIndex(swiper.activeIndex)}
              breakpoints={{
                '@0.75': { slidesPerView: 2, slidesPerGroup: 2 },
              }}
              a11y={{ enabled: true }}
            >
              {values.map(({ labelKey, icon: Icon }, index) => {
                return (
                  <SwiperSlide key={labelKey} className="!h-auto px-4">
                    <motion.article
                      initial={reduceMotion ? false : 'hidden'}
                      whileInView="visible"
                      whileHover={reduceMotion ? undefined : 'hover'}
                      viewport={{ once: true, amount: 0.2 }}
                      variants={{
                        hidden: { opacity: 0, y: 18 },
                        visible: { opacity: 1, y: 0 },
                        hover: { y: -4, scale: 1.015 },
                      }}
                      transition={{ duration: reduceMotion ? 0 : 0.45, delay: reduceMotion ? 0 : index * 0.08, ease: 'easeOut' }}
                      className={`green-hearts-value-card group flex h-full min-h-[280px] min-w-0 flex-col items-center justify-center gap-5 rounded-3xl p-5 text-white shadow sm:p-6 ${['bg-orange-500', 'bg-green-500', 'bg-pink-300', 'bg-green-500', 'bg-pink-300', 'bg-orange-500'][index]}`}
                    >
                      <div className="flex items-center justify-center">
                        <span className="flex size-16 shrink-0 items-center justify-center text-white" aria-hidden="true">
                          <Icon size={40} strokeWidth={1.8} />
                        </span>
                      </div>
                      <h3 className="m-0 text-center font-heading text-h4 font-bold text-white">{t(labelKey)}</h3>
                    </motion.article>
                  </SwiperSlide>
                )
              })}
            </Swiper>
            <div className="green-hearts-values-controls mt-5 flex justify-center gap-4">
              <button type="button" onClick={() => valuesSwiper?.slidePrev()} disabled={!valuesSwiper || valuesSwiper.isBeginning || valuesIndex === 0} aria-label={t('greenHearts.previousValue')} className={actionArrowClass}>
                <CarouselArrowIcon flip />
              </button>
              <button type="button" onClick={() => valuesSwiper?.slideNext()} disabled={!valuesSwiper || valuesSwiper.isEnd} aria-label={t('greenHearts.nextValue')} className={actionArrowClass}>
                <CarouselArrowIcon />
              </button>
            </div>
            </div>
          </Container>
        </section>

        <section className="w-full bg-white py-14 text-center text-green-500 sm:py-20">
          <Container className="flex w-full flex-col items-center">
            <h2 className="mb-3 w-full font-heading text-h2 font-bold text-green-500">{t('greenHearts.closing.title')}</h2>
            <p className="mb-0 w-full max-w-[900px] font-body text-body leading-[1.6] text-green-500">{t('greenHearts.closing.description')}</p>
          </Container>
        </section>
      </main>
    </>
  )
}

export default GreenHeartsPage
