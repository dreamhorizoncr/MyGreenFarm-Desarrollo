import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { XIcon } from '@animateicons/react/lucide'
import Button from '../ui/Button.tsx'
import { useModalExit } from '../../hooks/useModalExit.ts'

interface ForumPendingReviewModalProps {
  title: string
  description: string
  onClose: () => void
}

// Shown right when a community post or reply is submitted, before we know
// whether the moderation check will approve or reject it. The real outcome
// arrives later as a toast (success or rejection reason).
function ForumPendingReviewModal({ title, description, onClose }: Readonly<ForumPendingReviewModalProps>) {
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
      aria-label={title}
      className={`fixed inset-0 m-auto max-h-[90vh] w-[min(620px,calc(100vw-48px))] max-w-none scrollbar-none overflow-y-auto rounded-2xl bg-bg-card backdrop:bg-scrim ${closing ? 'animate-[modal-out_0.32s_ease-in]' : 'animate-[modal-in_0.32s_ease-out]'}`}
    >
      <div className="relative p-[28px_22px_30px]">
        <button
          type="button"
          className="absolute right-3 top-[26px] z-10 inline-flex size-10 items-center justify-center rounded-full bg-white text-heading shadow-sm transition hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2"
          onClick={requestClose}
          aria-label={t('admin.cancel')}
        >
          <XIcon size={20} />
        </button>

        <div className="flex flex-col items-center gap-md px-[28px] pb-[32px] pt-[30px]">
          <h2 className="m-0 text-center font-heading text-h1 font-bold leading-none text-heading">
            {title}
          </h2>

          <p className="m-0 max-w-[24rem] text-center font-body text-body-sm text-body-text">
            {description}
          </p>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={requestClose}
            className="h-11 w-40 rounded-full bg-orange-500 font-body text-button font-normal uppercase tracking-wide text-white hover:bg-orange-600"
          >
            {t('booking.close')}
          </Button>
        </div>
      </div>
    </dialog>
  )
}

export default ForumPendingReviewModal
