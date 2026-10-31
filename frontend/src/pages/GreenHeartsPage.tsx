import { BookOpen, Heart, HandHeart, Handshake, ShieldCheck, Users, Utensils, Gift, Sprout, Eye, Target } from 'lucide-react'
import { useEffect, useState } from 'react'
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
  { title: 'Solidaridad', text: 'Unimos esfuerzos para responder a las necesidades de los demás.', icon: Handshake },
  { title: 'Empatía', text: 'Escuchamos y comprendemos cada realidad con sensibilidad y sin juzgar.', icon: Heart },
  { title: 'Respeto y dignidad', text: 'Acompañamos cuidando la privacidad y el valor de cada persona.', icon: ShieldCheck },
  { title: 'Equidad', text: 'Reconocemos que cada persona puede necesitar apoyos distintos.', icon: Users },
  { title: 'Compromiso', text: 'Actuamos con responsabilidad y damos seguimiento a nuestras iniciativas.', icon: Target },
  { title: 'Transparencia', text: 'Gestionamos las ayudas y donaciones con claridad y responsabilidad.', icon: Eye },
]

const puzzlePieces = [
  { src: puzzlePiece1, left: '0%', top: '0%', width: '31.83%', height: '63.32%' },
  { src: puzzlePiece2, left: '22.01%', top: '0%', width: '51.68%', height: '48.97%' },
  { src: puzzlePiece3, left: '64.23%', top: '0%', width: '35.77%', height: '63.32%' },
  { src: puzzlePiece4, left: '0%', top: '48.87%', width: '31.76%', height: '51.24%' },
  { src: puzzlePiece5, left: '22.01%', top: '33.5%', width: '52.69%', height: '66.67%' },
  { src: puzzlePiece6, left: '64.23%', top: '48.87%', width: '35.77%', height: '51.13%' },
]

const actions = [
  { title: 'Becas escolares', text: 'Apoyos para facilitar el acceso y la permanencia en la educación.', icon: BookOpen, number: '01' },
  { title: 'Ayudas económicas', text: 'Aportes orientados a necesidades específicas de las familias.', icon: HandHeart, number: '02' },
  { title: 'Donación de víveres', text: 'Recolección y entrega de alimentos a hogares que requieren apoyo.', icon: Utensils, number: '03' },
  { title: 'Campañas de regalos', text: 'Iniciativas para compartir alegría con la niñez, especialmente en Navidad.', icon: Gift, number: '04' },
  { title: 'Acciones comunitarias', text: 'Campañas solidarias que responden a necesidades identificadas en nuestro entorno.', icon: Sprout, number: '05' },
]

function GreenHeartsPageSkeleton() {
  return (
    <div role="status" aria-label="Cargando Green Hearts" aria-busy="true" className="min-h-screen bg-bg-page">
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
  const [pageReady, setPageReady] = useState(false)
  const reduceMotion = useReducedMotion()
  const [actionsSwiper, setActionsSwiper] = useState<SwiperInstance | null>(null)
  const [actionsIndex, setActionsIndex] = useState(0)
  const [valuesSwiper, setValuesSwiper] = useState<SwiperInstance | null>(null)
  const [valuesIndex, setValuesIndex] = useState(0)
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

  if (!pageReady) return <GreenHeartsPageSkeleton />

  return (
    <>
      <Navbar />
      <main className="overflow-hidden bg-bg-page text-body-text-dark">
        <section className="flex min-h-[280px] items-start bg-white px-[30px] pb-[40px] pt-[48px] text-center md:min-h-[320px] md:pt-[72px]">
          <div className="mx-auto w-full max-w-[700px]">
            <h1 className="m-0 font-heading text-h1 font-bold leading-tight text-green-500">Programa de acción social</h1>
            <p className="mx-auto mt-[20px] max-w-[560px] font-body text-body-sm leading-[1.6] text-green-500 md:text-body-sm">Solidaridad que acompaña y abre oportunidades. Unimos a nuestra comunidad para apoyar a niños, niñas y familias con acciones concretas.</p>
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
              <p className="mx-auto mb-6 w-fit rounded-full border border-orange-500 bg-orange-500 px-lg py-sm font-body text-body-sm font-semibold uppercase tracking-wide text-white">Nuestro propósito</p>
              <p className="m-0 font-heading text-h3 font-semibold leading-relaxed text-white">
                Contribuir al{' '}
                <span className="bg-no-repeat pb-[0.12em] [background-position:0_100%] [background-size:100%_0.3em] [box-decoration-break:clone] [-webkit-box-decoration-break:clone]" style={{ backgroundImage: PURPOSE_UNDERLINE }}>bienestar de la niñez</span>
                {' '}y sus familias<br className="hidden lg:block" /> mediante ayudas que atiendan necesidades concretas<br className="hidden lg:block" /> y abran{' '}
                <span className="bg-no-repeat pb-[0.12em] [background-position:0_100%] [background-size:100%_0.3em] [box-decoration-break:clone] [-webkit-box-decoration-break:clone]" style={{ backgroundImage: PURPOSE_UNDERLINE }}>oportunidades</span>
                {' '}para aprender, crecer y{' '}
                <span className="bg-no-repeat pb-[0.12em] [background-position:0_100%] [background-size:100%_0.3em] [box-decoration-break:clone] [-webkit-box-decoration-break:clone]" style={{ backgroundImage: PURPOSE_UNDERLINE }}>desarrollarse con dignidad</span>.
              </p>
            </div>
          </Container>
        </section>

        <section className="pb-2 pt-16 sm:pb-4 sm:pt-24" id="por-que-nace">
          <Container>
            <div className="w-full text-left">
              <h2 className="mb-5 font-heading text-h2 font-bold text-heading">¿Por qué nace Green Hearts?</h2>
              <p className="mb-4 font-body text-body leading-[1.6] text-body-text-dark">Green Hearts nace del deseo de extender el compromiso de My Green Farm con la niñez más allá de las aulas. Reconocemos que las familias enfrentan diferentes realidades y que el acceso a la educación, la alimentación y las oportunidades de bienestar puede requerir apoyo.</p>
              <p className="m-0 font-body text-body leading-[1.6] text-body-text-dark">Por eso, impulsamos un programa que transforma la solidaridad en acciones concretas, uniendo esfuerzos para acompañar a niños, niñas y familias que atraviesan situaciones de necesidad.</p>
            </div>
          </Container>
        </section>

        <section className="pb-16 pt-16 sm:pb-24 sm:pt-24">
          <Container>
            <div className="mb-10 text-left"><h2 className="m-0 font-heading text-h2 font-bold text-heading">Nuestra dirección</h2><p className="mt-3 w-full max-w-[42rem] font-body text-body leading-[1.6] text-body-text-dark">Guiamos nuestras acciones con el compromiso de acompañar, apoyar y abrir oportunidades para las familias de nuestra comunidad.</p></div>
            <div className="grid gap-5 md:grid-cols-2">
              <article className="rounded-3xl border border-neutral-200 bg-white p-7 text-left shadow sm:p-10"><div className="mb-5 flex items-center gap-3 text-orange-500"><h3 className="m-0 font-heading text-h2 font-bold text-orange-500">Misión</h3></div><p className="m-0 font-body text-body leading-[1.6] text-body-text-dark">Promover y organizar acciones solidarias que apoyen a niños, niñas y familias mediante becas escolares, ayudas económicas, donación de víveres, regalos y otras iniciativas de acompañamiento, fomentando la participación de nuestra comunidad.</p></article>
              <article className="rounded-3xl border border-neutral-200 bg-white p-7 text-left shadow sm:p-10"><div className="mb-5 flex items-center gap-3 text-orange-500"><h3 className="m-0 font-heading text-h2 font-bold text-orange-500">Visión</h3></div><p className="m-0 font-body text-body leading-[1.6] text-body-text-dark">Ser un programa de acción social cercano y confiable, capaz de unir a familias, colaboradores y aliados para ampliar las oportunidades educativas y el bienestar de la niñez en nuestra comunidad.</p></article>
            </div>
          </Container>
        </section>

        <section data-scroll-bg="green" className="bg-green-500 py-16 text-white sm:py-24" id="lineas-de-accion">
          <div className="mx-auto w-full max-w-[1200px] px-6">
            <div className="mb-10 text-left md:mb-12">
              <span className="mb-6 flex w-fit self-start rounded-full border border-orange-500 bg-orange-500 px-md py-xs text-left font-body text-body-sm font-semibold uppercase tracking-wide text-white">Cómo contribuimos</span>
              <div className="green-hearts-actions-header grid items-center gap-6 md:grid-cols-2 md:gap-12">
                <h2 className="m-0 w-full max-w-xl text-left font-heading text-h2 font-bold leading-tight text-white">Nuestras líneas de acción</h2>
                <p className="m-0 w-full max-w-2xl text-left font-body text-body leading-[1.6] text-white">Desde becas escolares y apoyo económico hasta alimentación y acciones comunitarias, respondemos a necesidades concretas y abrimos oportunidades para las familias.</p>
              </div>
            </div>
            <div className="relative">
              <button type="button" onClick={() => actionsSwiper?.slidePrev()} disabled={!actionsSwiper || actionsSwiper.isBeginning} aria-label="Línea anterior" className={`${actionArrowClass} absolute -left-14 top-1/2 hidden -translate-y-1/2 sm:flex`}>
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
                {actions.map(({ title, text, icon: Icon, number }) => (
                  <SwiperSlide key={title} className="!h-auto">
                    <article className="h-full min-h-[380px] rounded-3xl bg-white p-7 text-left sm:p-9">
                      <div className="mb-8 flex items-center justify-between gap-4">
                        <span className="font-heading text-h1 font-bold leading-none text-green-500">{number}</span>
                        <span className="flex size-20 shrink-0 items-center justify-center text-orange-500"><Icon size={38} strokeWidth={1.8} /></span>
                      </div>
                      <h3 className="mb-4 font-heading text-h4 font-bold text-green-500">{title}</h3>
                      <p className="m-0 font-body text-body leading-[1.6] text-body-text-dark">{text}</p>
                    </article>
                  </SwiperSlide>
                ))}
              </Swiper>
              <button type="button" onClick={() => actionsSwiper?.slideNext()} disabled={!actionsSwiper || actionsSwiper.isEnd} aria-label="Línea siguiente" className={`${actionArrowClass} absolute -right-14 top-1/2 hidden -translate-y-1/2 sm:flex`}>
                <CarouselArrowIcon />
              </button>
              <div className="mt-3 flex justify-center gap-3 sm:hidden">
                <button type="button" onClick={() => actionsSwiper?.slidePrev()} disabled={!actionsSwiper || actionsSwiper.isBeginning} aria-label="Línea anterior" className={actionArrowClass}>
                  <CarouselArrowIcon flip />
                </button>
                <button type="button" onClick={() => actionsSwiper?.slideNext()} disabled={!actionsSwiper || actionsSwiper.isEnd} aria-label="Línea siguiente" className={actionArrowClass}>
                  <CarouselArrowIcon />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24" id="valores">
          <Container>
            <h2 className="mb-16 text-center font-heading text-h1 font-bold leading-tight text-green-500">
              <span className="bg-no-repeat pb-[0.12em] [background-position:0_100%] [background-size:100%_0.3em] [box-decoration-break:clone] [-webkit-box-decoration-break:clone]" style={{ backgroundImage: PURPOSE_UNDERLINE }}>Nuestros valores</span>
            </h2>
            <div className="green-hearts-values-puzzle mx-auto hidden lg:block">
              <div className="green-hearts-values-puzzle-art" aria-hidden="true">
                {puzzlePieces.map(({ src, left, top, width, height }, index) => (
                  <img key={index} src={src} alt="" style={{ left, top, width, height }} />
                ))}
              </div>
              <div className="green-hearts-values-puzzle-content">
                {values.map(({ title, icon: Icon }, index) => (
                  <article key={title} className={`green-hearts-puzzle-value green-hearts-puzzle-value-${index + 1} green-hearts-puzzle-value-${index % 3 === 0 ? 'left' : index % 3 === 1 ? 'center' : 'right'}`}>
                    <span className="mb-3 flex w-fit items-center text-white" aria-hidden="true">
                      <Icon size={32} strokeWidth={1.8} />
                    </span>
                    <h3 className="mb-2 font-heading text-h6 font-bold text-white">{title}</h3>
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
              {values.map(({ title, icon: Icon }, index) => {
                return (
                  <SwiperSlide key={title} className="!h-auto px-4">
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
                      <h3 className="m-0 text-center font-heading text-h4 font-bold text-white">{title}</h3>
                    </motion.article>
                  </SwiperSlide>
                )
              })}
            </Swiper>
            <div className="green-hearts-values-controls mt-5 flex justify-center gap-4">
              <button type="button" onClick={() => valuesSwiper?.slidePrev()} disabled={!valuesSwiper || valuesSwiper.isBeginning || valuesIndex === 0} aria-label="Valor anterior" className={actionArrowClass}>
                <CarouselArrowIcon flip />
              </button>
              <button type="button" onClick={() => valuesSwiper?.slideNext()} disabled={!valuesSwiper || valuesSwiper.isEnd} aria-label="Valor siguiente" className={actionArrowClass}>
                <CarouselArrowIcon />
              </button>
            </div>
            </div>
          </Container>
        </section>

        <section className="w-full bg-white py-14 text-center text-green-500 sm:py-20">
          <Container className="flex w-full flex-col items-center">
            <h2 className="mb-3 w-full font-heading text-h2 font-bold text-green-500">La solidaridad crece en comunidad.</h2>
            <p className="mb-0 w-full max-w-[900px] font-body text-body leading-[1.6] text-green-500">Green Hearts une voluntades para acompañar a la niñez y sus familias con respeto, cuidado y esperanza.</p>
          </Container>
        </section>
      </main>
    </>
  )
}

export default GreenHeartsPage
