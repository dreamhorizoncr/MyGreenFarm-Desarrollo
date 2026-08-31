import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import Button from './ui/Button.tsx'
import useDismiss from '../hooks/useDismiss.ts'
import { getErrorMessage } from '../utils/error.ts'
import type { UserInfo } from '../types/auth.ts'

interface DeleteUserModalProps {
  user: UserInfo
  onConfirm: (id: string) => Promise<void>
  onClose: () => void
}

function DeleteUserModal({ user, onConfirm, onClose }: DeleteUserModalProps) {
  const { t } = useTranslation()
  const overlayRef = useRef<HTMLDivElement>(null)

  const fullName = `${user.firstName} ${user.lastName}`
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const matchesName = confirmText.trim() === fullName

  useDismiss({
    ref: overlayRef,
    isOpen: true,
    onClose,
    includeClickOutside: false,
  })

  const handleConfirm = async () => {
    if (!matchesName) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await onConfirm(user.id)
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
      className="fixed inset-0 z-[100] grid place-items-center bg-scrim p-lg animate-[modal-overlay-in_0.15s_ease-out]"
      ref={overlayRef}
      onClick={handleOverlayClick}
    >
      <div
        className="relative w-[min(620px,92vw)] max-h-[90vh] overflow-y-auto rounded-2xl bg-bg-card p-[28px_22px_30px] animate-[modal-in_0.2s_ease-out]"
        role="dialog"
        aria-modal="true"
        aria-label={t('admin.delete')}
      >
        <button
          type="button"
          className="absolute right-3 top-[26px] z-10 inline-flex size-10 items-center justify-center rounded-full bg-transparent text-body-text transition-opacity duration-150 hover:opacity-65 focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2"
          onClick={onClose}
          aria-label={t('admin.cancel')}
        >
          <X size={20} />
        </button>

        <div className="relative mb-lg text-center">
          <h2 className="m-0 font-heading text-[42px] font-bold leading-none text-heading">
            {t('admin.deleteConfirmTitle')}
          </h2>
        </div>

        <div className="flex flex-col gap-md px-[28px] pb-[32px] pt-[30px]">
          <p className="mt-2xs text-left font-body text-[13px] text-neutral-500">
            {t('admin.deleteConfirmMessage', { name: fullName })}
          </p>

          <div className="flex flex-col">
            <label htmlFor="admin-delete-confirm" className="mb-1 font-body text-base font-normal leading-[1.6] text-body-text">
              {t('admin.deleteConfirmFieldLabel', { name: fullName })}
            </label>
            <input
              id="admin-delete-confirm"
              type="text"
              className="h-[38px] w-full border-b border-neutral-300 bg-transparent font-body text-[15px] text-body-text outline-none transition-colors focus:border-green-500 placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-55"
              value={confirmText}
              onChange={(e) => {
                setConfirmText(e.target.value)
                if (deleteError) setDeleteError(null)
              }}
              placeholder={t('admin.deleteConfirmPlaceholder', { name: fullName })}
            />
            {deleteError && (
              <p className="mt-2xs text-left font-body text-sm text-danger">{deleteError}</p>
            )}
          </div>

          <div className="flex gap-md mt-sm">
            <Button variant="secondary" onClick={onClose} className="h-[47px] flex-1 rounded-none font-body text-[17px] uppercase tracking-wide">
              {t('admin.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirm}
              loading={deleting}
              disabled={!matchesName}
              className="h-[47px] flex-1 rounded-none font-body text-[17px] font-normal uppercase tracking-wide"
            >
              {deleting ? t('common.loading') : t('admin.delete')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeleteUserModal