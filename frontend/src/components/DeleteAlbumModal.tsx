import { useTranslation } from 'react-i18next'
import DeleteConfirmModal from './ui/DeleteConfirmModal.tsx'
import type { Gallery } from '../types/gallery.ts'

interface DeleteAlbumModalProps {
  gallery: Gallery
  onConfirm: (id: string) => Promise<void>
  onClose: () => void
}

function DeleteAlbumModal({ gallery, onConfirm, onClose }: Readonly<DeleteAlbumModalProps>) {
  const { t } = useTranslation()

  return (
    <DeleteConfirmModal
      title={t('admin.gallery.deleteAlbumTitle')}
      message={t('admin.gallery.confirmDeleteAlbum')}
      onConfirm={() => onConfirm(gallery.id)}
      onClose={onClose}
    />
  )
}

export default DeleteAlbumModal
