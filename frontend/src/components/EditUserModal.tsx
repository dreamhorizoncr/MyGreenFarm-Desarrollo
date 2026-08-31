import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import Button from './ui/Button.tsx'
import useDismiss from '../hooks/useDismiss.ts'
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

  useDismiss({
    ref: overlayRef,
    isOpen: true,
    onClose,
    includeClickOutside: false,
  })

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
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-scrim p-lg animate-[modal-overlay-in_0.15s_ease-out]"
      ref={overlayRef}
      onClick={handleOverlayClick}
    >
      <div
        className="relative w-[min(620px,92vw)] max-h-[90vh] overflow-y-auto rounded-2xl bg-bg-card p-[28px_22px_30px] animate-[modal-in_0.2s_ease-out]"
        role="dialog"
        aria-modal="true"
        aria-label={t('admin.edit')}
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
            {t('admin.edit')}
          </h2>
        </div>

        <div className="flex flex-col gap-md px-[28px] pb-[32px] pt-[30px]">
          <div className="flex flex-col">
            <label htmlFor="admin-edit-firstname" className="mb-1 font-body text-base font-normal leading-[1.6] text-body-text">
              {t('admin.firstName')}
            </label>
            <input
              id="admin-edit-firstname"
              type="text"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value)
                if (firstNameValidationError) setFirstNameValidationError(null)
              }}
              className="h-[38px] w-full border-b border-neutral-300 bg-transparent font-body text-[15px] text-body-text outline-none transition-colors focus:border-green-500 placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-55"
            />
            {firstNameValidationError && (
              <p className="mt-2xs text-left font-body text-sm text-danger">{firstNameValidationError}</p>
            )}
          </div>

          <div className="flex flex-col">
            <label htmlFor="admin-edit-lastname" className="mb-1 font-body text-base font-normal leading-[1.6] text-body-text">
              {t('admin.lastName')}
            </label>
            <input
              id="admin-edit-lastname"
              type="text"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value)
                if (lastNameValidationError) setLastNameValidationError(null)
              }}
              className="h-[38px] w-full border-b border-neutral-300 bg-transparent font-body text-[15px] text-body-text outline-none transition-colors focus:border-green-500 placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-55"
            />
            {lastNameValidationError && (
              <p className="mt-2xs text-left font-body text-sm text-danger">{lastNameValidationError}</p>
            )}
          </div>

          <div className="flex flex-col">
            <label htmlFor="admin-edit-email" className="mb-1 font-body text-base font-normal leading-[1.6] text-body-text">
              {t('admin.email')}
            </label>
            <input
              id="admin-edit-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (emailValidationError) setEmailValidationError(null)
              }}
              disabled={!isEditingSelf}
              className="h-[38px] w-full border-b border-neutral-300 bg-transparent font-body text-[15px] text-body-text outline-none transition-colors focus:border-green-500 placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-55"
            />
            {!isEditingSelf && (
              <p className="mt-2xs text-left font-body text-[13px] text-neutral-500">{t('admin.emailLockedHint')}</p>
            )}
            {emailValidationError && (
              <p className="mt-2xs text-left font-body text-sm text-danger">{emailValidationError}</p>
            )}
          </div>

          <div className="flex gap-md mt-sm">
            <Button variant="secondary" onClick={onClose} className="h-[47px] flex-1 rounded-none font-body text-[17px] uppercase tracking-wide">
              {t('admin.cancel')}
            </Button>
            <Button
              variant="success"
              onClick={handleSave}
              loading={saving}
              disabled={!firstName.trim() || !lastName.trim()}
              className="h-[47px] flex-1 rounded-none bg-green-500 font-body text-[17px] font-normal uppercase tracking-wide text-white"
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
