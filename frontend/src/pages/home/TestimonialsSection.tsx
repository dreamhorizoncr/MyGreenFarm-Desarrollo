import { useTranslation } from 'react-i18next'
import nubesDown from '../../assets/imgs/nubesDown.svg'
import Container from '../../components/home/Container.tsx'
import TestimonialCard from '../../components/home/TestimonialCard.tsx'

function TestimonialsSection() {
  const { t } = useTranslation()

  return (
    <section id="testimonials" className="relative flex min-h-[100svh] w-full flex-col">
      <img src={nubesDown} alt="" aria-hidden="true" className="block w-full" />

      <div className="flex w-full flex-1 flex-col justify-center">
        <Container className="flex flex-col items-center gap-lg py-1500">
          <h2 className="m-0 text-center font-heading text-h2 font-bold text-heading">
            {t('home.testimonials.title')}
          </h2>

          <div className="flex w-full flex-col items-center gap-1200">
            <p className="max-w-[30rem] text-center font-body text-body-sm font-normal text-body-text">
              {t('home.testimonials.description')}
            </p>

            <div className="grid w-full gap-lg md:grid-cols-3">
              <TestimonialCard color="orange" />
              <TestimonialCard color="green" />
              <TestimonialCard color="pink" />
            </div>
          </div>
        </Container>
      </div>
    </section>
  )
}

export default TestimonialsSection