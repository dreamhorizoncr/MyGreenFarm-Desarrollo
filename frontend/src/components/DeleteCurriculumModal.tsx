import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { XIcon } from '@animateicons/react/lucide'
import Button from './ui/Button.tsx'
import { getErrorMessage } from '../utils/error.ts'
import type { Curriculum } from '../types/curriculum.ts'

interface DeleteCurriculumModalProps {
  application: Curriculum
  onConfirm: (id: string) => Promise<void>
  onClose: () => void
}

function DeleteCurriculumModal({ application, onConfirm, onClose }: Readonly<DeleteCurriculumModalProps>) {
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
      await onConfirm(application.id)
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
      aria-label={t('admin.curriculums.deleteConfirmTitle')}
      className="m-auto max-h-[90vh] w-[min(620px,92vw)] max-w-none scrollbar-none overflow-y-auto rounded-2xl bg-bg-card backdrop:bg-scrim animate-[modal-in_0.2s_ease-out]"
    >
      <div className="relative p-[28px_22px_30px]">
        <button
          type="button"
          className="absolute right-3 top-6.5 z-10 inline-flex size-10 items-center justify-center rounded-full bg-transparent text-body-text transition-opacity duration-150 hover:opacity-65 focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2"
          onClick={onClose}
          aria-label={t('admin.cancel')}
        >
          <XIcon size={20} />
        </button>

        <div className="relative mb-lg text-center">
          <h2 className="m-0 font-heading text-[34px] font-bold leading-none text-heading">
            {t('admin.curriculums.deleteConfirmTitle')}
          </h2>
        </div>

        <div className="flex flex-col gap-md px-7 pb-8 pt-2.5">
          <p className="m-0 text-left font-body text-[15px] text-body-text">
            {t('admin.curriculums.deleteConfirmMessage', { name: application.applicantName })}
          </p>

          {deleteError && (
            <p className="mt-2xs text-left font-body text-sm text-danger">{deleteError}</p>
          )}

          <div className="flex gap-md mt-sm">
            <Button variant="secondary" onClick={onClose} className="h-11.75 flex-1 rounded-none font-body text-[17px] uppercase tracking-wide">
              {t('admin.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirm}
              loading={deleting}
              className="h-11.75 flex-1 rounded-none font-body text-[17px] font-normal uppercase tracking-wide"
            >
              {deleting ? t('common.loading') : t('admin.delete')}
            </Button>
          </div>
        </div>
      </div>
    </dialog>
  )
}

export default DeleteCurriculumModal
