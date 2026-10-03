import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { GlobeIcon, HeartIcon, ShieldCheckIcon, SunIcon, XIcon } from '@animateicons/react/lucide'
import Button from './ui/Button.tsx'
import PhilosophyPillarItem from './PhilosophyPillarItem.tsx'
import nino from '../assets/imgs/nino.svg'

interface PhilosophyModalProps {
  onClose: () => void
}

function PhilosophyModal({ onClose }: Readonly<PhilosophyModalProps>) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  const pillars = [
    {
      icon: <ShieldCheckIcon size={20} aria-hidden="true" />,
      tag: t('home.philosophy.pillar1Tag'),
      title: t('home.philosophy.pillar1Title'),
      body: t('home.philosophy.pillar1Body'),
    },
    {
      icon: <SunIcon size={20} aria-hidden="true" />,
      tag: t('home.philosophy.pillar2Tag'),
      title: t('home.philosophy.pillar2Title'),
      body: t('home.philosophy.pillar2Body'),
    },
    {
      icon: <HeartIcon size={20} aria-hidden="true" />,
      tag: t('home.philosophy.pillar3Tag'),
      title: t('home.philosophy.pillar3Title'),
      body: t('home.philosophy.pillar3Body'),
    },
    {
      icon: <GlobeIcon size={20} aria-hidden="true" />,
      tag: t('home.philosophy.pillar4Tag'),
      title: t('home.philosophy.pillar4Title'),
      body: t('home.philosophy.pillar4Body'),
    },
  ]

  const handleCtaClick = () => {
    onClose()
    navigate('/services')
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose()
      }}
      aria-label={t('home.philosophy.title')}
      className="m-auto max-h-[90vh] w-[min(760px,92vw)] max-w-none scrollbar-none overflow-y-auto rounded-2xl bg-bg-card backdrop:bg-scrim animate-[modal-in_0.2s_ease-out]"
    >
      <div className="relative">
        <button
          type="button"
          className="absolute right-3 top-3 z-10 inline-flex size-10 items-center justify-center rounded-full bg-white text-heading shadow-sm transition-opacity duration-150 hover:opacity-70 focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2"
          onClick={onClose}
          aria-label={t('home.philosophy.modalClose')}
        >
          <XIcon size={20} />
        </button>

        <img
          src={nino}
          alt=""
          aria-hidden="true"
          className="h-64 w-full rounded-t-2xl object-cover md:h-80"
        />

        <div className="p-[22px_22px_30px] md:p-[26px_28px_32px]">
          <div className="relative mb-lg text-center">
            <h2 className="m-0 font-heading text-[30px] font-bold leading-tight text-heading">
              {t('home.philosophy.title')}
            </h2>
            <div className="mx-auto mt-xs h-1 w-12 rounded-full bg-[var(--pink-400)]" aria-hidden="true" />
          </div>

          <div className="flex flex-col gap-lg px-2 pb-4 pt-2.5 text-left md:px-5">
            <p className="m-0 font-body text-body-sm text-body-text">{t('home.philosophy.modalParagraph.paragraph1')}</p>
            <p className="m-0 font-body text-body-sm text-body-text">{t('home.philosophy.modalParagraph.paragraph2')}</p>
            <p className="m-0 font-body text-body-sm text-body-text">{t('home.philosophy.modalParagraph.paragraph3')}</p>
            <p className="m-0 font-body text-body-sm text-body-text">{t('home.philosophy.modalParagraph.paragraph4')}</p>

            <div className="grid gap-md md:grid-cols-2">
              {pillars.map((pillar) => (
                <PhilosophyPillarItem key={pillar.title} {...pillar} />
              ))}
            </div>

            <div className="mt-sm flex justify-center">
              <Button
                variant="primary"
                onClick={handleCtaClick}
                className="h-11 w-full rounded-full bg-orange-500 font-body text-button font-normal uppercase tracking-wide text-white hover:bg-orange-600 md:w-auto md:px-lg"
              >
                {t('home.philosophy.modalCta')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  )
}

export default PhilosophyModal
