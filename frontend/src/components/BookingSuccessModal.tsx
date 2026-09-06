import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import Button from './ui/Button.tsx'
import useDismiss from '../hooks/useDismiss.ts'

interface BookingSuccessModalProps {
  onClose: () => void
}

function BookingSuccessModal({ onClose }: BookingSuccessModalProps) {
  const { t } = useTranslation()
  const overlayRef = useRef<HTMLDivElement>(null)

  useDismiss({
    ref: overlayRef,
    isOpen: true,
    onClose,
    includeClickOutside: false,
  })

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === overlayRef.current) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-scrim p-lg animate-[modal-overlay-in_0.15s_ease-out]"
      ref={overlayRef}
      onClick={handleOverlayClick}
    >
      <div
        className="relative w-[min(620px,92vw)] max-h-[90vh] overflow-y-auto rounded-2xl bg-bg-card p-[28px_22px_30px] animate-[modal-in_0.2s_ease-out]"
        role="dialog"
        aria-modal="true"
        aria-label={t('booking.modalTitle')}
      >
        <button
          type="button"
          className="absolute right-3 top-[26px] z-10 inline-flex size-10 items-center justify-center rounded-full bg-transparent text-body-text transition-opacity duration-150 hover:opacity-65 focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2"
          onClick={onClose}
          aria-label={t('admin.cancel')}
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center gap-md px-[28px] pb-[32px] pt-[30px]">
          <h2 className="m-0 text-center font-heading text-[42px] font-bold leading-none text-heading">
            {t('booking.modalTitle')}
          </h2>

          <p className="m-0 max-w-[24rem] text-center font-body text-body-sm text-body-text">
            {t('booking.modalDescription')}
          </p>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={onClose}
            className="h-[47px] w-40 rounded-full bg-green-500 font-body text-[17px] font-normal uppercase tracking-wide text-white"
          >
            {t('booking.close')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default BookingSuccessModal