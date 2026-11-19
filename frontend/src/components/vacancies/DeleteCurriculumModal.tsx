import { useTranslation } from 'react-i18next'
import DeleteConfirmModal from '../ui/DeleteConfirmModal.tsx'
import type { Curriculum } from '../../types/curriculum.ts'

/** Props of {@link DeleteCurriculumModal}. */
interface DeleteCurriculumModalProps {
  application: Curriculum
  onConfirm: (id: string) => Promise<void>
  onClose: () => void
}

/** Asks for confirmation before deleting an application and its files. */
function DeleteCurriculumModal({ application, onConfirm, onClose }: Readonly<DeleteCurriculumModalProps>) {
  const { t } = useTranslation()

  return (
    <DeleteConfirmModal
      title={t('admin.curriculums.deleteConfirmTitle')}
      message={t('admin.curriculums.deleteConfirmMessage', { name: application.applicantName })}
      onConfirm={() => onConfirm(application.id)}
      onClose={onClose}
    />
  )
}

export default DeleteCurriculumModal
