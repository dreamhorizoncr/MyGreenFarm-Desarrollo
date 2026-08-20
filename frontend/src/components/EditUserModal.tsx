import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import Button from './ui/Button.tsx'
import type { UserInfo, UpdateUserData } from '../types/auth.ts'

interface EditUserModalProps {
  userToEdit: UserInfo
  currentUser: UserInfo
  onSave: (id: string, data: UpdateUserData) => Promise<void>
  onClose: () => void
}

function EditUserModal({ userToEdit, currentUser, onSave, onClose }: EditUserModalProps) {
  const { t } = useTranslation()
  const overlayRef = useRef<HTMLDivElement>(null)

  const isEditingSelf = currentUser.id === userToEdit.id

  const [firstName, setFirstName] = useState(userToEdit.firstName)
  const [lastName, setLastName] = useState(userToEdit.lastName)
  const [email, setEmail] = useState(userToEdit.email)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) return
    setSaving(true)
    await onSave(userToEdit.id, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
    })
    setSaving(false)
    onClose()
  }

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === overlayRef.current) onClose()
  }

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="modal" role="dialog" aria-label={t('admin.edit')}>
        <div className="modal__header">
          <h2>{t('admin.edit')}</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label={t('admin.cancel')}>
            <X size={20} />
          </button>
        </div>

        <div className="modal__body">
          <div>
            <label htmlFor="admin-edit-firstname">{t('admin.firstName')}</label>
            <input
              id="admin-edit-firstname"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="admin-edit-lastname">{t('admin.lastName')}</label>
            <input
              id="admin-edit-lastname"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="admin-edit-email">{t('admin.email')}</label>
            <input
              id="admin-edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!isEditingSelf}
            />
          </div>
        </div>

        <div className="modal__footer">
          <Button variant="secondary" onClick={onClose}>
            {t('admin.cancel')}
          </Button>
          <Button onClick={handleSave} loading={saving} disabled={!firstName.trim() || !lastName.trim()}>
            {t('admin.save')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default EditUserModal
