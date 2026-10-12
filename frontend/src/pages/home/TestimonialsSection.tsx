import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { Blobatar } from '@blobatar/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import nubesDown from '../../assets/imgs/nubesDown.svg'
import Container from '../../components/home/Container.tsx'
import CarouselDots from '../../components/ui/CarouselDots.tsx'

const testimonialStyles = [
  { accent: '#F37B25', initials: 'MJA' },
  { accent: '#019F62', initials: 'CR' },
  { accent: '#FF93A9', initials: 'SV' },
]

// Lugar de cada tarjeta en el carrusel: la activa al centro, la siguiente a la derecha y la otra a la izquierda.
const cardPosition = (index: number, activeIndex: number, total: number) => {
  if (index === activeIndex) return 'active'
  return (index - activeIndex + total) % total === 1 ? 'right' : 'left'
}

function TestimonialsSection() {
  const { t } = useTranslation()
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const touchStartX = useRef<number | null>(null)

  const testimonials = [
    { quote: t('home.testimonials.card1.quote'), author: t('home.testimonials.card1.author') },
    { quote: t('home.testimonials.card2.quote'), author: t('home.testimonials.card2.author') },
    { quote: t('home.testimonials.card3.quote'), author: t('home.testimonials.card3.author') },
  ]

  const move = useCallback((direction: 1 | -1) => {
    setActiveIndex((current) => (current + direction + testimonials.length) % testimonials.length)
  }, [testimonials.length])

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion || isPaused) return undefined
    const interval = window.setInterval(() => move(1), 6000)
    return () => window.clearInterval(interval)
  }, [isPaused, move])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') move(-1)
      if (event.key === 'ArrowRight') move(1)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [move])

  return (
    <section id="testimonials" className="relative flex min-h-[100svh] w-full flex-col">
      <img src={nubesDown} alt="" aria-hidden="true" data-scroll-bg="green" className="block w-full" />

      <div className="flex w-full flex-1 flex-col justify-center">
        <Container className="flex flex-col items-center gap-lg py-1500">
          <h2 className="m-0 text-center font-heading text-h2 font-bold text-heading">
            {t('home.testimonials.title')}
          </h2>

          <div className="flex w-full flex-col items-center gap-1200">
            <p className="max-w-[30rem] text-center font-body text-body-sm font-normal text-body-text">
              {t('home.testimonials.description')}
            </p>

            <div
              className="testimonial-carousel relative w-full"
              aria-roledescription="carousel"
              aria-label={t('home.testimonials.title')}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onTouchStart={(event) => { touchStartX.current = event.touches[0]?.clientX ?? null }}
              onTouchEnd={(event) => {
                if (touchStartX.current === null) return
                const distance = event.changedTouches[0]?.clientX - touchStartX.current
                if (Math.abs(distance) > 40) move(distance < 0 ? 1 : -1)
                touchStartX.current = null
              }}
            >
              {testimonials.map((testimonial, index) => {
                const isActive = index === activeIndex
                const style = testimonialStyles[index]
                const position = cardPosition(index, activeIndex, testimonials.length)
                const [name, role = ''] = testimonial.author.split(' — ')

                return (
                  <button
                    key={testimonial.author}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    aria-label={`${name}, ${role}`}
                    aria-current={isActive ? 'true' : undefined}
                    data-position={position}
                    className="testimonial-card absolute left-1/2 top-0 flex flex-col overflow-hidden rounded-2xl border-t-4 bg-white p-7 text-left"
                    style={{ '--testimonial-accent': style.accent } as CSSProperties}
                  >
                    <span className="testimonial-card__quote-mark" aria-hidden="true">“</span>
                    <span className="testimonial-card__quote font-body">{testimonial.quote}</span>
                    <span className="mt-5 border-t border-[var(--grey-100)] pt-4">
                      <span className="flex items-center gap-3">
                        <Blobatar name={name} size={44} animate="always" title={name} palette={{ head: style.accent }} className="size-11 shrink-0 rounded-full" />
                        <span className="flex min-w-0 flex-col">
                          <span className="font-body text-[15px] font-bold text-[var(--grey-800)]">{name}</span>
                          <span className="font-body text-[13px] text-[var(--grey-500)]">{role}</span>
                          <span className="sr-only">{style.initials}</span>
                        </span>
                      </span>
                    </span>
                  </button>
                )
              })}
              <button type="button" aria-label="Anterior" onClick={() => move(-1)} className="testimonial-carousel__arrow testimonial-carousel__arrow--left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green-500)]">
                <ChevronLeft size={22} aria-hidden="true" />
              </button>
              <button type="button" aria-label="Siguiente" onClick={() => move(1)} className="testimonial-carousel__arrow testimonial-carousel__arrow--right focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green-500)]">
                <ChevronRight size={22} aria-hidden="true" />
              </button>
            </div>
            <CarouselDots
              count={testimonials.length}
              activeIndex={activeIndex}
              onSelect={setActiveIndex}
              ariaLabel="Navegación de testimonios"
              getItemLabel={(index) => `Ir al testimonio ${index + 1}`}
            />
          </div>
        </Container>
      </div>
    </section>
  )
}

export default TestimonialsSection