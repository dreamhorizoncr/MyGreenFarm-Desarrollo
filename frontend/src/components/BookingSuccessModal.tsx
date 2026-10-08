import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { XIcon } from '@animateicons/react/lucide'
import Button from './ui/Button.tsx'
import { useModalExit } from '../hooks/useModalExit.ts'

interface BookingSuccessModalProps {
  onClose: () => void
}

function BookingSuccessModal({ onClose }: Readonly<BookingSuccessModalProps>) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const { closing, requestClose } = useModalExit(onClose)

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  return (
    <dialog
      ref={dialogRef}
      onClose={requestClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) requestClose()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') requestClose()
      }}
      aria-label={t('booking.modalTitle')}
      className={`fixed inset-0 m-auto max-h-[90vh] w-[min(620px,calc(100vw-48px))] max-w-none scrollbar-none overflow-y-auto rounded-2xl bg-bg-card backdrop:bg-scrim ${closing ? 'animate-[modal-out_0.32s_ease-in]' : 'animate-[modal-in_0.32s_ease-out]'}`}
    >
      <div className="relative p-[28px_22px_30px]">
        <button
          type="button"
          className="absolute right-3 top-[26px] z-10 inline-flex size-10 items-center justify-center rounded-full bg-transparent text-body-text transition-opacity duration-150 hover:opacity-65 focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2"
          onClick={requestClose}
          aria-label={t('admin.cancel')}
        >
          <XIcon size={20} />
        </button>

        <div className="flex flex-col items-center gap-md px-[28px] pb-[32px] pt-[30px]">
          <h2 className="m-0 text-center font-heading text-h1 font-bold leading-none text-heading">
            {t('booking.modalTitle')}
          </h2>

          <p className="m-0 max-w-[24rem] text-center font-body text-body-sm text-body-text">
            {t('booking.modalDescription')}
          </p>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={requestClose}
            className="h-11 w-40 rounded-full bg-green-500 font-body text-button font-normal uppercase tracking-wide text-white"
          >
            {t('booking.close')}
          </Button>
        </div>
      </div>
    </dialog>
  )
}

export default BookingSuccessModal