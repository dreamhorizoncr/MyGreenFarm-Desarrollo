import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from './ui/Button.tsx'
import { getErrorMessage } from '../utils/error.ts'
import { useModalExit } from '../hooks/useModalExit.ts'
import { useDialogDismiss } from '../hooks/useDialogDismiss.ts'
import type { Curriculum } from '../types/curriculum.ts'
import ModalCloseButton from './ui/ModalCloseButton.tsx'

interface ConfirmCurriculumDecisionModalProps {
  application: Curriculum
  action: 'approve' | 'reject'
  onConfirm: (application: Curriculum) => Promise<void>
  onClose: () => void
}

function ConfirmCurriculumDecisionModal({ application, action, onConfirm, onClose }: Readonly<ConfirmCurriculumDecisionModalProps>) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const { closing, requestClose } = useModalExit(onClose)
  useDialogDismiss(dialogRef, requestClose)

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const isApprove = action === 'approve'
  const title = isApprove ? t('admin.curriculums.approveConfirmTitle') : t('admin.curriculums.rejectConfirmTitle')
  const message = isApprove
    ? t('admin.curriculums.approveConfirmMessage', { name: application.applicantName })
    : t('admin.curriculums.rejectConfirmMessage', { name: application.applicantName })
  const confirmLabel = isApprove ? t('admin.curriculums.approve') : t('admin.curriculums.reject')

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  const handleConfirm = async () => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      await onConfirm(application)
      requestClose()
    } catch (err) {
      setSubmitError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={requestClose}
      aria-label={title}
      className={`fixed inset-0 m-auto max-h-[90vh] w-[min(620px,92vw)] max-w-none modal-scroll rounded-[20px] bg-bg-card backdrop:bg-scrim ${closing ? 'animate-[modal-out_0.32s_ease-in]' : 'animate-[modal-in_0.32s_ease-out]'}`}
    >
      <div className="relative p-[28px_22px_30px]">
        <ModalCloseButton
          onClick={requestClose}
          aria-label={t('admin.cancel')}
          className="absolute right-3 top-[26px] z-20"
        />

        <div className="relative mb-lg text-center">
          <h2 className="m-0 font-heading text-page-title font-bold leading-none text-heading">
            {title}
          </h2>
        </div>

        <div className="flex flex-col gap-md px-7 pb-8 pt-2.5">
          <p className="m-0 text-left font-body text-body-sm text-body-text">
            {message}
          </p>

          {submitError && (
            <p className="mt-2xs text-left font-body text-body-sm text-danger">{submitError}</p>
          )}

          <div className="flex gap-md mt-sm">
            <Button variant="secondary" onClick={requestClose} className="h-11 flex-1 rounded-xl border-green-500 font-body text-button font-bold uppercase tracking-wide text-heading hover:bg-green-50">
              {t('admin.cancel')}
            </Button>
            <Button
              variant={isApprove ? 'success' : 'danger'}
              onClick={handleConfirm}
              loading={submitting}
              className={`h-11 flex-1 rounded-xl font-body text-button font-bold uppercase tracking-wide text-white ${isApprove ? 'bg-green-500' : ''}`}
            >
              {submitting ? t('common.loading') : confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </dialog>
  )
}

export default ConfirmCurriculumDecisionModal
