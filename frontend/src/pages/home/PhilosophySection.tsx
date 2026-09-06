import { Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import nino from '../../assets/imgs/niño.svg'
import Container from '../../components/home/Container.tsx'
import PillButton from '../../components/ui/PillButton.tsx'

function PhilosophySection() {
  const { t } = useTranslation()
  const items = Array.from({ length: 4 }, () => t('home.philosophy.item'))

  return (
    <section id="philosophy" className="relative flex min-h-[100svh] w-full flex-col bg-green-500">
      <div className="flex w-full flex-1 flex-col justify-center">
        <Container className="py-1500">
          <div className="grid w-full items-center gap-lg rounded-3xl bg-white p-lg md:grid-cols-2 md:gap-xl md:p-xl">
            <img
              src={nino}
              alt="Niña con los brazos extendidos al aire libre"
              className="h-full w-full rounded-2xl object-cover"
            />

            <div className="flex flex-col items-start gap-700 text-left">
              <h2 className="m-0 font-heading text-h2 font-bold text-heading">
                {t('home.philosophy.title')}
              </h2>

              <div className="h-1 w-12 rounded-full bg-orange-500" aria-hidden="true" />

              <p className="font-body text-body-sm font-normal text-body-text">
                {t('home.philosophy.description')}
              </p>

              <ul className="m-0 flex list-none flex-col gap-sm p-0">
                {items.map((item, i) => (
                  <li key={i} className="flex items-start gap-sm">
                    <Star
                      className="mt-1 size-4 shrink-0 fill-orange-500 text-orange-500"
                      aria-hidden="true"
                    />
                    <span className="font-body text-body-sm font-normal text-body-text">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              <PillButton className="w-fit border-2 border-accent font-heading text-body-sm uppercase text-accent">
                {t('home.philosophy.cta')}
              </PillButton>
            </div>
          </div>
        </Container>
      </div>
    </section>
  )
}

export default PhilosophySection