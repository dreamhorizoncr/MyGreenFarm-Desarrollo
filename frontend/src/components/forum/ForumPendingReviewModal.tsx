import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '../ui/Button.tsx'
import { useModalExit } from '../../hooks/useModalExit.ts'
import { useDialogDismiss } from '../../hooks/useDialogDismiss.ts'
import ModalCloseButton from '../ui/ModalCloseButton.tsx'

interface ForumPendingReviewModalProps {
  title: string
  description: string
  onClose: () => void
}

function ForumPendingReviewModal({ title, description, onClose }: Readonly<ForumPendingReviewModalProps>) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const { closing, requestClose } = useModalExit(onClose)
  useDialogDismiss(dialogRef, requestClose)

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  return (
    <dialog
      ref={dialogRef}
      onClose={requestClose}
      aria-label={title}
      className={`fixed inset-0 m-auto max-h-[90vh] w-[min(620px,calc(100vw-48px))] max-w-none modal-scroll rounded-[20px] bg-bg-card backdrop:bg-scrim ${closing ? 'animate-[modal-out_0.32s_ease-in]' : 'animate-[modal-in_0.32s_ease-out]'}`}
    >
      <div className="relative p-lg md:p-xl">
        <ModalCloseButton
          onClick={requestClose}
          aria-label={t('admin.cancel')}
          className="absolute right-lg top-lg z-20 md:right-xl md:top-xl"
        />

        <div className="flex flex-col items-center gap-md px-xl pb-lg pt-xl">
          <h2 className="m-0 text-center font-heading text-h2 font-bold leading-none text-heading">
            {title}
          </h2>

          <p className="m-0 max-w-[24rem] text-center font-body text-body-sm text-body-text">
            {description}
          </p>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={requestClose}
            className="h-11 w-40 rounded-full bg-orange-500 font-body text-button font-normal text-white hover:bg-orange-600"
          >
            {t('booking.close')}
          </Button>
        </div>
      </div>
    </dialog>
  )
}

export default ForumPendingReviewModal
