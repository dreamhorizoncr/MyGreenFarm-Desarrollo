import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import Button from './ui/Button.tsx'
import { validateEmail, validateRequired } from '../utils/validators.ts'
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

  const [firstNameValidationError, setFirstNameValidationError] = useState<string | null>(null)
  const [lastNameValidationError, setLastNameValidationError] = useState<string | null>(null)
  const [emailValidationError, setEmailValidationError] = useState<string | null>(null)

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const handleSave = async () => {
    const firstNameErrorMessage = validateRequired(firstName, t('admin.firstName'), t)
    const lastNameErrorMessage = validateRequired(lastName, t('admin.lastName'), t)
    const emailErrorMessage = isEditingSelf ? validateEmail(email, t) : null

    setFirstNameValidationError(firstNameErrorMessage)
    setLastNameValidationError(lastNameErrorMessage)
    setEmailValidationError(emailErrorMessage)

    if (firstNameErrorMessage || lastNameErrorMessage || emailErrorMessage) return

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
      <div className="modal" role="dialog" aria-modal="true" aria-label={t('admin.edit')}>
        <button type="button" className="modal__close" onClick={onClose} aria-label={t('admin.cancel')}>
          <X size={20} />
        </button>

        <div className="modal__header">
          <h2>{t('admin.edit')}</h2>
        </div>

        <div className="modal__body">
          <div className="modal__field">
            <label htmlFor="admin-edit-firstname">{t('admin.firstName')}</label>
            <input
              id="admin-edit-firstname"
              type="text"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value)
                if (firstNameValidationError) setFirstNameValidationError(null)
              }}
              className="modal__input"
            />
            {firstNameValidationError && (
              <p className="modal__error">{firstNameValidationError}</p>
            )}
          </div>

          <div className="modal__field">
            <label htmlFor="admin-edit-lastname">{t('admin.lastName')}</label>
            <input
              id="admin-edit-lastname"
              type="text"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value)
                if (lastNameValidationError) setLastNameValidationError(null)
              }}
              className="modal__input"
            />
            {lastNameValidationError && (
              <p className="modal__error">{lastNameValidationError}</p>
            )}
          </div>

          <div className="modal__field">
            <label htmlFor="admin-edit-email">{t('admin.email')}</label>
            <input
              id="admin-edit-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (emailValidationError) setEmailValidationError(null)
              }}
              disabled={!isEditingSelf}
              className="modal__input"
            />
            {!isEditingSelf && (
              <p className="modal__hint">{t('admin.emailLockedHint')}</p>
            )}
            {emailValidationError && (
              <p className="modal__error">{emailValidationError}</p>
            )}
          </div>

          <div className="modal__footer">
            <Button variant="secondary" onClick={onClose}>
              {t('admin.cancel')}
            </Button>
            <Button
              variant="success"
              onClick={handleSave}
              loading={saving}
              disabled={!firstName.trim() || !lastName.trim()}
            >
              {saving ? t('common.loading') : t('admin.save')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditUserModal
