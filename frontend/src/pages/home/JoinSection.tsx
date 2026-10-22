import { useState } from 'react'
import { CirclePlusIcon } from '@animateicons/react/lucide'
import { useTranslation } from 'react-i18next'
import pollitos from '../../assets/imgs/pollitos.svg'
import nubesPink from '../../assets/imgs/nubesPink.svg'
import Container from '../../components/home/Container.tsx'
import PillButton from '../../components/ui/PillButton.tsx'
import { useNewsletter } from '../../hooks/useNewsletter.ts'
import { notify } from '../../utils/notifications.ts'

function JoinSection() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const { subscribe, loading } = useNewsletter()

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!email.trim()) return

    try {
      await subscribe(email.trim())
      setEmail('')
      notify.success(t('home.join.subscribeSuccess'))
    } catch (err) {
      notify.error(err instanceof Error ? err.message : t('common.error'))
    }
  }

  return (
    <section id="join" className="relative flex min-h-[100svh] w-full flex-col">
      <div className="relative w-full overflow-hidden leading-none">
        <img
          src={nubesPink}
          alt=""
          aria-hidden="true"
          className="relative -mb-1 block w-[110vw] max-w-none -translate-x-1/2 left-1/2 object-cover"
        />
      </div>

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
              <CirclePlusIcon
                size={56}
                className="text-white"
                aria-hidden="true"
              />

              <h2 className="m-0 font-heading text-h2 font-bold text-white">
                {t('home.join.title1')}
                <br />
                {t('home.join.title2')}
              </h2>

              <p className="max-w-[30rem] font-body text-body font-normal text-white">
                {t('home.join.description')}
              </p>

              <form onSubmit={handleSubmit} className="flex w-full max-w-[30rem] flex-col gap-sm sm:flex-row">
                <input
                  type="email"
                  name="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('home.join.emailPlaceholder')}
                  disabled={loading}
                  className="h-11 w-full rounded-full border border-neutral-200 bg-white px-md font-body text-body-sm text-body-text-dark outline-none placeholder:text-[var(--grey-700)] focus:border-heading sm:flex-1"
                />
                <PillButton type="submit" disabled={loading || !email.trim()} className="h-11 w-full bg-green-500 font-body text-button font-bold text-white disabled:opacity-70 sm:w-auto">
                  {loading ? t('home.join.subscribing') : t('home.join.subscribe')}
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
