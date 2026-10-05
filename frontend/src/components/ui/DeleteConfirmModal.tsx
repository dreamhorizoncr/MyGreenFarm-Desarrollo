import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { XIcon } from '@animateicons/react/lucide'
import Button from './Button.tsx'
import { getErrorMessage } from '../../utils/error.ts'

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
      onClose()
    } catch (err) {
      setDeleteError(getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
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
      aria-label={title}
      className="fixed inset-0 m-auto max-h-[90vh] w-[min(620px,92vw)] max-w-none scrollbar-none overflow-y-auto rounded-2xl bg-bg-card backdrop:bg-scrim animate-[modal-in_0.2s_ease-out]"
    >
      <div className="relative p-[28px_22px_30px]">
        <button
          type="button"
          className="absolute right-3 top-[26px] z-10 inline-flex size-10 items-center justify-center rounded-full bg-transparent text-body-text transition-opacity duration-150 hover:opacity-65 focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2"
          onClick={onClose}
          aria-label={t('admin.cancel')}
        >
          <XIcon size={20} />
        </button>

        <div className="relative mb-lg px-12 text-center">
          <h2 className="m-0 font-heading text-h1 font-bold leading-none text-heading">
            {title}
          </h2>
        </div>

        <div className="flex flex-col gap-md px-[28px] pb-[32px]">
          <p className="mt-2xs text-left font-body text-body-sm text-neutral-500">
            {message}
          </p>

          {deleteError && (
            <p className="mt-2xs text-left font-body text-body-sm text-danger">{deleteError}</p>
          )}

          <div className="mt-sm flex gap-md">
            <Button
              variant="secondary"
              onClick={onClose}
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
