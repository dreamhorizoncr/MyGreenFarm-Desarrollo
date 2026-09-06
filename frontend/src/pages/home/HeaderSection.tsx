import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import nubesUp from '../../assets/imgs/nubesUp.svg'
import Container from '../../components/home/Container.tsx'
import PillButton from '../../components/ui/PillButton.tsx'

function HeaderSection() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <section id="header" className="relative flex min-h-[100svh] w-full flex-col text-left">
      <div className="flex w-full flex-1 flex-col justify-center">
        <Container className="pb-1600 pt-1500">
          <div className="grid w-full items-center gap-lg md:grid-cols-2">
            <div className="flex flex-col items-start gap-700">
              <span className="inline-flex w-fit items-center rounded-full bg-orange-500 px-lg py-xs font-heading text-h6 font-normal text-white">
                {t('home.header.badge')}
              </span>

              <h1 className="m-0 font-heading text-h1 font-bold leading-[1.1] text-heading">
                {t('home.header.welcome')}
                <br />
                My Green Farm
              </h1>

              <p className="max-w-[40rem] font-body text-body-lg font-normal text-body-text">
                {t('home.header.description')}
              </p>

              <PillButton
                className="w-fit bg-accent font-heading text-h6 text-white"
                onClick={() => navigate('/booking')}
              >
                {t('home.header.cta')}
              </PillButton>
            </div>

            <img
              src="/src/assets/hero.png"
              alt={t('home.header.heroAlt')}
              className="w-full rounded-2xl object-cover"
            />
          </div>
        </Container>
      </div>

      <img src={nubesUp} alt="" aria-hidden="true" className="-mt-500 block w-full" />
    </section>
  )
}

export default HeaderSection
