import { useTranslation } from 'react-i18next'
import DeleteConfirmModal from './ui/DeleteConfirmModal.tsx'
import type { GalleryCategory } from '../types/gallery.ts'

interface DeleteYearModalProps {
  category: GalleryCategory
  onConfirm: (id: string) => Promise<void>
  onClose: () => void
}

function DeleteYearModal({ category, onConfirm, onClose }: Readonly<DeleteYearModalProps>) {
  const { t } = useTranslation()

  return (
    <DeleteConfirmModal
      title={t('admin.gallery.deleteYearTitle')}
      message={t('admin.gallery.confirmDeleteYear', { year: category.title })}
      onConfirm={() => onConfirm(category.id)}
      onClose={onClose}
    />
  )
}

export default DeleteYearModal
