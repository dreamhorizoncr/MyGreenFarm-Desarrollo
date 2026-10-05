import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { XIcon } from '@animateicons/react/lucide'
import Button from './ui/Button.tsx'
import { getErrorMessage } from '../utils/error.ts'
import { validateEmail, validateRequired } from '../utils/validators.ts'
import type { UserInfo, UpdateUserData } from '../types/auth.ts'

interface EditUserModalProps {
  userToEdit: UserInfo
  currentUser: UserInfo
  onSave: (id: string, data: UpdateUserData) => Promise<void>
  onClose: () => void
}

function EditUserModal({ userToEdit, currentUser, onSave, onClose }: Readonly<EditUserModalProps>) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDialogElement>(null)

  const isEditingSelf = currentUser.id === userToEdit.id

  const [firstName, setFirstName] = useState(userToEdit.firstName)
  const [lastName, setLastName] = useState(userToEdit.lastName)
  const [email, setEmail] = useState(userToEdit.email)
  const [birthday, setBirthday] = useState(userToEdit.birthday ?? '')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [firstNameValidationError, setFirstNameValidationError] = useState<string | null>(null)
  const [lastNameValidationError, setLastNameValidationError] = useState<string | null>(null)
  const [emailValidationError, setEmailValidationError] = useState<string | null>(null)

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  const handleSave = async () => {
    const firstNameErrorMessage = validateRequired(firstName, t('admin.firstName'), t)
    const lastNameErrorMessage = validateRequired(lastName, t('admin.lastName'), t)
    const emailErrorMessage = isEditingSelf ? validateEmail(email, t) : null

    setFirstNameValidationError(firstNameErrorMessage)
    setLastNameValidationError(lastNameErrorMessage)
    setEmailValidationError(emailErrorMessage)

    if (firstNameErrorMessage || lastNameErrorMessage || emailErrorMessage) return

    setSaving(true)
    setSaveError(null)
    try {
      await onSave(userToEdit.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        birthday: birthday || undefined,
      })
      onClose()
    } catch (err) {
      setSaveError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose()
      }}
      aria-label={t('admin.edit')}
      className="fixed inset-0 m-auto max-h-[90vh] w-[min(820px,92vw)] max-w-none scrollbar-none overflow-y-auto rounded-[20px] border border-neutral-200 bg-white p-lg backdrop:bg-scrim animate-[modal-in_0.2s_ease-out] md:p-xl"
    >
      <div className="flex items-center justify-between gap-md">
        <h2 className="m-0 font-heading text-2xl font-bold text-heading">
          {t('admin.edit')}
        </h2>

        <button
          type="button"
          onClick={onClose}
          aria-label={t('admin.cancel')}
          className="rounded-full p-2xs text-neutral-500 transition-colors hover:bg-neutral-100"
        >
          <XIcon size={20} />
        </button>
      </div>

      <div className="mt-lg grid gap-md md:grid-cols-2">
        <label className="font-body text-body-sm font-semibold text-heading">
          {t('admin.firstName')}
          <input
            type="text"
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value)
              if (firstNameValidationError) setFirstNameValidationError(null)
            }}
            className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
          />
          {firstNameValidationError && (
            <span className="mt-xs block font-body text-body-sm font-normal text-danger">{firstNameValidationError}</span>
          )}
        </label>

        <label className="font-body text-body-sm font-semibold text-heading">
          {t('admin.lastName')}
          <input
            type="text"
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value)
              if (lastNameValidationError) setLastNameValidationError(null)
            }}
            className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
          />
          {lastNameValidationError && (
            <span className="mt-xs block font-body text-body-sm font-normal text-danger">{lastNameValidationError}</span>
          )}
        </label>

        <label className="font-body text-body-sm font-semibold text-heading">
          {t('admin.email')}
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (emailValidationError) setEmailValidationError(null)
            }}
            disabled={!isEditingSelf}
            className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading disabled:cursor-not-allowed disabled:bg-neutral-100"
          />
          {!isEditingSelf && (
            <span className="mt-xs block font-body text-body-sm font-normal text-neutral-500">{t('admin.emailLockedHint')}</span>
          )}
          {emailValidationError && (
            <span className="mt-xs block font-body text-body-sm font-normal text-danger">{emailValidationError}</span>
          )}
        </label>

        <label className="font-body text-body-sm font-semibold text-heading">
          {t('admin.birthday')}
          <input
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
          />
        </label>
      </div>

      {saveError && (
        <p className="mt-md rounded-xl bg-red-50 p-md font-body text-body-sm text-red-700">{saveError}</p>
      )}

      <div className="mt-lg flex flex-wrap justify-end gap-sm">
        <Button
          variant="secondary"
          onClick={onClose}
          className="h-11 w-auto rounded-full border-green-500 px-lg font-body text-body-sm font-semibold text-heading hover:bg-green-50"
        >
          {t('admin.cancel')}
        </Button>
        <Button
          variant="success"
          onClick={handleSave}
          loading={saving}
          disabled={!firstName.trim() || !lastName.trim()}
          className="h-11 w-auto rounded-full bg-orange-500 px-lg font-body text-body-sm font-semibold text-white hover:bg-orange-600"
        >
          {saving ? t('common.loading') : t('admin.save')}
        </Button>
      </div>
    </dialog>
  )
}

export default EditUserModal
