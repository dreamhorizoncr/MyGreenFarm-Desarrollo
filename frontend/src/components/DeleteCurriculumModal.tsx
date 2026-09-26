import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { XIcon } from '@animateicons/react/lucide'
import Button from './ui/Button.tsx'
import useDismiss from '../hooks/useDismiss.ts'
import { getErrorMessage } from '../utils/error.ts'
import type { Curriculum } from '../types/curriculum.ts'

interface DeleteCurriculumModalProps {
  application: Curriculum
  onConfirm: (id: string) => Promise<void>
  onClose: () => void
}

function DeleteCurriculumModal({ application, onConfirm, onClose }: Readonly<DeleteCurriculumModalProps>) {
  const { t } = useTranslation()
  const overlayRef = useRef<HTMLDivElement>(null)

  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useDismiss({
    ref: overlayRef,
    isOpen: true,
    onClose,
    includeClickOutside: false,
  })

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

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === overlayRef.current) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-100 grid place-items-center bg-scrim p-lg animate-[modal-overlay-in_0.15s_ease-out]"
      ref={overlayRef}
      onClick={handleOverlayClick}
    >
      <div
        className="relative w-[min(620px,92vw)] max-h-[90vh] overflow-y-auto rounded-2xl bg-bg-card p-[28px_22px_30px] animate-[modal-in_0.2s_ease-out]"
        role="dialog"
        aria-modal="true"
        aria-label={t('admin.curriculums.deleteConfirmTitle')}
      >
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
    </div>
  )
}

export default DeleteCurriculumModal
