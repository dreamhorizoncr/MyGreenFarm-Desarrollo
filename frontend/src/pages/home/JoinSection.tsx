import { CirclePlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import pollitos from '../../assets/imgs/pollitos.svg'
import nubesPink from '../../assets/imgs/nubesPink.svg'
import Container from '../../components/home/Container.tsx'
import PillButton from '../../components/ui/PillButton.tsx'

function JoinSection() {
  const { t } = useTranslation()

  return (
    <section id="join" className="relative flex min-h-[100svh] w-full flex-col">
      <img src={nubesPink} alt="" aria-hidden="true" className="block w-full" />

      <div className="flex w-full flex-1 flex-col justify-center">
        <Container className="py-1500">
          <div className="relative overflow-hidden rounded-3xl bg-orange-500">
            <img
              src={pollitos}
              alt=""
              aria-hidden="true"
              className="absolute left-[10%] top-1/2 hidden h-[220px] w-auto -translate-y-1/2 md:block"
            />
            <img
              src={pollitos}
              alt=""
              aria-hidden="true"
              className="absolute right-[10%] top-1/2 hidden h-[220px] w-auto -translate-y-1/2 -scale-x-100 md:block"
            />

            <div className="relative flex flex-col items-center gap-700 px-md py-1000 text-center md:px-1400 md:py-1500">
              <CirclePlus
                size={56}
                strokeWidth={1.5}
                className="text-white"
                aria-hidden="true"
              />

              <h2 className="m-0 font-heading text-h2 font-bold text-white">
                {t('home.join.title1')}
                <br />
                {t('home.join.title2')}
              </h2>

              <p className="max-w-[30rem] font-body text-body-sm font-normal text-white">
                {t('home.join.description')}
              </p>

              <form className="flex w-full max-w-[30rem] flex-col gap-sm sm:flex-row">
                <input
                  type="email"
                  name="email"
                  required
                  placeholder={t('home.join.emailPlaceholder')}
                  className="h-12 w-full rounded-full border-none bg-white px-md font-body text-body-sm text-body-text outline-none placeholder:text-[var(--grey-700)] sm:flex-1"
                />
                <PillButton type="submit" className="h-12 w-full bg-green-500 font-body text-white sm:w-auto">
                  {t('home.join.subscribe')}
                </PillButton>
              </form>
            </div>
          </div>
        </Container>
      </div>
    </section>
  )
}

export default JoinSection
