import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FileTextIcon, LockIcon, XIcon } from '@animateicons/react/lucide'
import TermsSection from './TermsSection.tsx'
import useDismiss from '../hooks/useDismiss.ts'

type LegalTab = 'terms' | 'privacy'

interface TermsModalProps {
  onClose: () => void
}

function TermsModal({ onClose }: Readonly<TermsModalProps>) {
  const { t } = useTranslation()
  const overlayRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState<LegalTab>('terms')

  useDismiss({
    ref: overlayRef,
    isOpen: true,
    onClose,
    includeClickOutside: false,
  })

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  const termsItems = [
    { title: t('legalModal.terms1Title'), body: t('legalModal.terms1Body') },
    { title: t('legalModal.terms2Title'), body: t('legalModal.terms2Body') },
    { title: t('legalModal.terms3Title'), body: t('legalModal.terms3Body') },
    { title: t('legalModal.terms4Title'), body: t('legalModal.terms4Body') },
  ]

  const privacyItems = [
    { title: t('legalModal.privacy1Title'), body: t('legalModal.privacy1Body') },
    { title: t('legalModal.privacy2Title'), body: t('legalModal.privacy2Body') },
    { title: t('legalModal.privacy3Title'), body: t('legalModal.privacy3Body') },
    { title: t('legalModal.privacy4Title'), body: t('legalModal.privacy4Body') },
  ]

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === overlayRef.current) onClose()
  }

  const tabClassName = (tab: LegalTab) =>
    `inline-flex flex-1 items-center justify-center gap-xs rounded-full px-md py-sm font-body text-sm font-semibold transition-colors ${
      activeTab === tab ? 'bg-green-500 text-white' : 'bg-(--grey-100) text-body-text hover:bg-(--grey-200)'
    }`

  return (
    <div
      className="fixed inset-0 z-100 grid place-items-center bg-scrim p-lg animate-[modal-overlay-in_0.15s_ease-out]"
      ref={overlayRef}
      onClick={handleOverlayClick}
    >
      <div
        className="relative w-[min(680px,92vw)] max-h-[90vh] overflow-y-auto scrollbar-none rounded-2xl bg-bg-card p-[28px_22px_30px] animate-[modal-in_0.2s_ease-out]"
        role="dialog"
        aria-modal="true"
        aria-label={t('legalModal.title')}
      >
        <button
          type="button"
          className="absolute right-3 top-6.5 z-10 inline-flex size-10 items-center justify-center rounded-full bg-transparent text-body-text transition-opacity duration-150 hover:opacity-65 focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2"
          onClick={onClose}
          aria-label={t('legalModal.close')}
        >
          <XIcon size={20} />
        </button>

        <div className="relative mb-lg text-center">
          <h2 className="m-0 font-heading text-[28px] font-bold leading-tight text-heading">
            {t('legalModal.title')}
          </h2>
        </div>

        <div className="flex flex-col gap-lg px-2 pb-4 pt-2.5 text-left md:px-5">
          <div className="flex gap-sm" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'terms'}
              onClick={() => setActiveTab('terms')}
              className={tabClassName('terms')}
            >
              <FileTextIcon size={16} aria-hidden="true" />
              {t('legalModal.tabTerms')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'privacy'}
              onClick={() => setActiveTab('privacy')}
              className={tabClassName('privacy')}
            >
              <LockIcon size={16} aria-hidden="true" />
              {t('legalModal.tabPrivacy')}
            </button>
          </div>

          {activeTab === 'terms' ? (
            <TermsSection intro={t('legalModal.termsIntro')} items={termsItems} />
          ) : (
            <TermsSection intro={t('legalModal.privacyIntro')} items={privacyItems} />
          )}
        </div>
      </div>
    </div>
  )
}

export default TermsModal
