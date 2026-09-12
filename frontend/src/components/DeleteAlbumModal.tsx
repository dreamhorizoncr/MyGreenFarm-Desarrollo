import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import Button from './ui/Button.tsx'
import useDismiss from '../hooks/useDismiss.ts'
import { getErrorMessage } from '../utils/error.ts'
import type { Gallery } from '../types/gallery.ts'

interface DeleteAlbumModalProps {
  gallery: Gallery
  onConfirm: (id: string) => Promise<void>
  onClose: () => void
}

function DeleteAlbumModal({ gallery, onConfirm, onClose }: DeleteAlbumModalProps) {
  const { t } = useTranslation()
  const overlayRef = useRef<HTMLDivElement>(null)

  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const matchesName = confirmText.trim() === gallery.title

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
      await onConfirm(gallery.id)
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
        aria-label={t('admin.gallery.deleteAlbumTitle')}
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
            {t('admin.gallery.deleteAlbumTitle')}
          </h2>
        </div>

        <div className="flex flex-col gap-md px-[28px] pb-[32px] pt-[30px]">
          <p className="mt-2xs text-left font-body text-[16px] text-neutral-500">
            {t('admin.gallery.confirmDeleteAlbum')}
          </p>

          <div className="flex flex-col">
            <label
              htmlFor="admin-delete-album-confirm"
              className="mb-1 font-body text-lg font-normal leading-[1.6] text-body-text"
            >
              {t('admin.gallery.deleteConfirmFieldLabel', { title: gallery.title })}
            </label>
            <input
              id="admin-delete-album-confirm"
              type="text"
              className="h-[38px] w-full border-b border-neutral-300 bg-transparent font-body text-[15px] text-body-text outline-none transition-colors focus:border-green-500 placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-55"
              value={confirmText}
              onChange={(e) => {
                setConfirmText(e.target.value)
                if (deleteError) setDeleteError(null)
              }}
              placeholder={t('admin.gallery.deleteConfirmPlaceholder')}
            />
            {deleteError && (
              <p className="mt-2xs text-left font-body text-sm text-danger">{deleteError}</p>
            )}
          </div>

          <div className="mt-sm flex gap-md">
            <Button
              variant="secondary"
              onClick={onClose}
              className="h-[47px] flex-1 rounded-full font-body text-[17px] uppercase tracking-wide"
            >
              {t('admin.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={() => void handleConfirm()}
              loading={deleting}
              disabled={!matchesName}
              className="h-[47px] flex-1 rounded-full font-body text-[17px] font-normal uppercase tracking-wide"
            >
              {deleting ? t('common.loading') : t('admin.delete')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeleteAlbumModal