import { useTranslation } from 'react-i18next'
import DeleteConfirmModal from './ui/DeleteConfirmModal.tsx'
import type { UserInfo } from '../types/auth.ts'

interface DeleteUserModalProps {
  user: UserInfo
  onConfirm: (id: string) => Promise<void>
  onClose: () => void
}

function DeleteUserModal({ user, onConfirm, onClose }: Readonly<DeleteUserModalProps>) {
  const { t } = useTranslation()
  const fullName = `${user.firstName} ${user.lastName}`

  return (
    <DeleteConfirmModal
      title={t('admin.deleteConfirmTitle')}
      message={t('admin.deleteConfirmMessage', { name: fullName })}
      onConfirm={() => onConfirm(user.id)}
      onClose={onClose}
    />
  )
}

export default DeleteUserModal
