import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from './Button.tsx'
import { getErrorMessage } from '../../utils/error.ts'
import { useModalExit } from '../../hooks/useModalExit.ts'
import ModalCloseButton from './ModalCloseButton.tsx'

interface DeleteConfirmModalProps {
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => Promise<void>
  onClose: () => void
}

function DeleteConfirmModal({
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
}: Readonly<DeleteConfirmModalProps>) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const { closing, requestClose } = useModalExit(onClose)

  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  const handleConfirm = async () => {
    setDeleting(true)
    setDeleteError(null)
    try {
      await onConfirm()
      requestClose()
    } catch (err) {
      setDeleteError(getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

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
      className={`fixed inset-0 m-auto max-h-[90vh] w-[min(620px,92vw)] max-w-none modal-scroll rounded-[20px] bg-bg-card backdrop:bg-scrim ${closing ? 'animate-[modal-out_0.32s_ease-in]' : 'animate-[modal-in_0.32s_ease-out]'}`}
    >
      <div className="relative p-[28px_22px_30px]">
        <div className="flex items-center justify-between gap-md">
          <h2 className="m-0 font-heading text-2xl font-bold text-heading">
            {title}
          </h2>

          <ModalCloseButton
            onClick={requestClose}
            aria-label={t('admin.cancel')}
          />
        </div>

        <div className="mt-lg flex flex-col gap-md">
          <p className="m-0 text-left font-body text-body-sm text-neutral-500">
            {message}
          </p>

          {deleteError && (
            <p className="m-0 text-left font-body text-body-sm text-danger">{deleteError}</p>
          )}

          <div className="mt-sm flex gap-md">
            <Button
              variant="secondary"
              onClick={requestClose}
              className="h-11 flex-1 rounded-full border-green-500 font-body text-button font-bold uppercase tracking-wide text-heading hover:bg-green-50"
            >
              {t('admin.cancel')}
            </Button>
            <Button
              variant="success"
              onClick={() => void handleConfirm()}
              loading={deleting}
              className="h-11 flex-1 rounded-full bg-orange-500 font-body text-button font-bold uppercase tracking-wide text-white hover:bg-orange-600"
            >
              {deleting ? t('common.loading') : confirmLabel ?? t('admin.delete')}
            </Button>
          </div>
        </div>
      </div>
    </dialog>
  )
}

export default DeleteConfirmModal
