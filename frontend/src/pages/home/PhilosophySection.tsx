import { useState } from 'react'
import { StarIcon } from '@animateicons/react/lucide'
import { useTranslation } from 'react-i18next'
import nino from '../../assets/imgs/nino.svg'
import Container from '../../components/home/Container.tsx'
import BlobButton from '../../components/ui/BlobButton.tsx'
import PhilosophyModal from '../../components/PhilosophyModal.tsx'

function PhilosophySection() {
  const { t } = useTranslation()
  const items = [
    t("home.philosophy.pillar1Title"),
    t("home.philosophy.pillar2Title"),
    t("home.philosophy.pillar3Title"),
    t("home.philosophy.pillar4Title"),
  ]
  
  const [isModalOpen, setIsModalOpen] = useState(false)

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

              <p className="line-clamp-4 font-body text-body-sm font-normal text-body-text">
                {t('home.philosophy.description')}
              </p>

              <ul className="m-0 flex list-none flex-col gap-sm p-0">
                {items.map((item) => (
                  <li key={item} className="flex items-start gap-sm">
                    <StarIcon
                      size={16}
                      className="mt-1 shrink-0 text-orange-500 [&_svg]:fill-current"
                      aria-hidden="true"
                    />
                    <span className="font-body text-body-sm font-normal text-body-text">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              <BlobButton
                onClick={() => setIsModalOpen(true)}
                className="w-fit px-[16px] py-[7px] font-body text-[11px] uppercase"
              >
                {t('home.philosophy.cta')}
              </BlobButton>
            </div>
          </div>
        </Container>
      </div>

      {isModalOpen && <PhilosophyModal onClose={() => setIsModalOpen(false)} />}
    </section>
  )
}

export default PhilosophySection
