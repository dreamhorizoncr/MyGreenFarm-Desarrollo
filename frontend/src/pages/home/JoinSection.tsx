import { useState } from 'react'
import { MailIcon } from '@animateicons/react/lucide'
import { useTranslation } from 'react-i18next'
import pollitos from '../../assets/imgs/pollitos.svg'
import nubesPink from '../../assets/imgs/nubesPink.svg'
import lapiz from '../../assets/imgs/lapiz.svg'
import transportador from '../../assets/imgs/transportador.svg'
import abaco from '../../assets/imgs/abaco.svg'
import tijera from '../../assets/imgs/Tijera.svg'
import Container from '../../components/home/Container.tsx'
import { useNewsletter } from '../../hooks/useNewsletter.ts'
import { notify } from '../../utils/notifications.ts'
import { validateEmail } from '../../utils/validators.ts'

const BRUSH_UNDERLINE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 16' preserveAspectRatio='none'%3E%3Cpath d='M4 11C70 4 160 3 296 8' fill='none' stroke='%23fde047' stroke-width='6' stroke-linecap='round'/%3E%3C/svg%3E")`

const DOODLES = [
  { src: lapiz, className: 'left-[3%] top-[8%] h-16 -rotate-12' },
  { src: transportador, className: 'right-[4%] top-[6%] h-14 rotate-12' },
  { src: abaco, className: 'bottom-[10%] left-[30%] hidden h-14 rotate-6 md:block' },
  { src: tijera, className: 'right-[30%] bottom-[8%] hidden h-12 -rotate-12 md:block' },
]

function JoinSection() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const { subscribe, loading } = useNewsletter()

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    const value = email.trim()
    const validationError = validateEmail(value, t)
    setEmailError(validationError)
    if (validationError) return

    try {
      await subscribe(value)
      setEmail('')
      notify.success(t('home.join.subscribeSuccess'))
    } catch (err) {
      notify.error(err instanceof Error ? err.message : t('common.error'))
    }
  }

  return (
    <section id="join" className="relative flex w-full flex-col md:min-h-[100svh]">
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
          <div className="relative mt-1000 md:mt-0">
          <img
            src={pollitos}
            alt=""
            aria-hidden="true"
            className="absolute bottom-full left-1/2 z-10 h-28 w-auto -translate-x-1/2 translate-y-[18%] md:hidden"
          />
          <div className="group relative overflow-hidden rounded-3xl bg-orange-500">
            {DOODLES.map(({ src, className }) => (
              <img
                key={src}
                src={src}
                alt=""
                aria-hidden="true"
                className={`pointer-events-none absolute w-auto opacity-20 brightness-0 invert ${className}`}
              />
            ))}

            <img
              src={pollitos}
              alt=""
              aria-hidden="true"
              className="absolute bottom-0 left-[9%] hidden h-[210px] w-auto origin-bottom translate-y-[8%] transition-transform duration-500 ease-out group-hover:-rotate-6 md:block"
            />
            <img
              src={pollitos}
              alt=""
              aria-hidden="true"
              className="absolute bottom-0 right-[9%] hidden h-[210px] w-auto origin-bottom translate-y-[8%] -scale-x-100 transition-transform duration-500 ease-out group-hover:rotate-6 md:block"
            />

            <div className="relative flex flex-col items-center px-xl py-1000 text-center md:px-1400 md:py-1200">
              <span className="mb-lg hidden size-16 items-center justify-center rounded-full bg-white/15 text-white md:flex">
                <MailIcon size={32} aria-hidden="true" />
              </span>

              <h2 className="m-0 font-heading text-h3 font-bold text-white md:text-h2">
                {t('home.join.title1')}
                <br />
                <span
                  className="bg-no-repeat pb-[0.12em] [background-position:0_100%] [background-size:100%_0.3em] [box-decoration-break:clone] [-webkit-box-decoration-break:clone]"
                  style={{ backgroundImage: BRUSH_UNDERLINE }}
                >
                  {t('home.join.title2')}
                </span>
              </h2>

              <p className="mt-md max-w-[30rem] font-body text-body font-normal text-white">
                {t('home.join.description')}
              </p>

              <form onSubmit={handleSubmit} noValidate className="mt-xl w-full max-w-[30rem]">
                <div className="flex flex-col gap-sm sm:flex-row">
                  <input
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (emailError) setEmailError(null)
                    }}
                    placeholder={t('home.join.emailPlaceholder')}
                    aria-label={t('home.join.emailPlaceholder')}
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? 'join-email-error' : undefined}
                    disabled={loading}
                    className={`h-11 w-full min-w-0 rounded-xl border bg-white px-md font-body text-body-sm font-normal text-body-text-dark outline-none placeholder:text-[var(--grey-700)] focus:border-heading sm:flex-1 ${
                      emailError ? 'border-danger' : 'border-neutral-200'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="h-11 w-full shrink-0 whitespace-nowrap rounded-full sm:w-auto bg-green-500 px-lg font-body text-button font-bold text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-green-500"
                  >
                    {loading ? t('home.join.subscribing') : t('home.join.subscribe')}
                  </button>
                </div>

                {emailError && (
                  <p id="join-email-error" role="alert" className="m-0 mt-sm font-body text-body-sm font-semibold text-white">
                    {emailError}
                  </p>
                )}

                <p className="m-0 mt-sm font-body text-caption text-white/85">
                  {t('home.join.privacyNote')}
                </p>
              </form>
            </div>
          </div>
          </div>
        </Container>
      </div>
    </section>
  )
}

export default JoinSection
