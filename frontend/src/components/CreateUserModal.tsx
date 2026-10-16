import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from './ui/Button.tsx'
import PasswordInput from './ui/PasswordInput.tsx'
import DatePickerField from './ui/DatePickerField.tsx'
import { useModalExit } from '../hooks/useModalExit.ts'
import { useDialogDismiss } from '../hooks/useDialogDismiss.ts'
import { useRegister } from '../hooks/useRegister.ts'
import { notify } from '../utils/notifications.ts'
import { validateEmail, validatePassword, validateRequired, validateSafeText } from '../utils/validators.ts'
import ModalCloseButton from './ui/ModalCloseButton.tsx'

interface CreateUserModalProps {
  onCreated: () => void | Promise<void>
  onClose: () => void
}

type Role = 'TEACHER' | 'ADMIN'

const inputClassName =
  'mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading'

const roleClassName = (active: boolean) =>
  `rounded-full border px-md py-xs font-body text-body-sm font-semibold transition-colors ${
    active ? 'border-green-500 bg-green-500 text-white' : 'border-green-500 bg-white text-heading hover:bg-green-50'
  }`

function CreateUserModal({ onCreated, onClose }: Readonly<CreateUserModalProps>) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const { closing, requestClose } = useModalExit(onClose)
  useDialogDismiss(dialogRef, requestClose)
  const { submitRegister, loading } = useRegister()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role | ''>('')
  const [birthday, setBirthday] = useState('')
  const [errors, setErrors] = useState<Record<string, string | null>>({})

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  const clearError = (key: string) => {
    if (errors[key]) setErrors((current) => ({ ...current, [key]: null }))
  }

  const handleSave = () => {
    const nextErrors = {
      firstName: validateRequired(firstName, t('signup.firstName'), t) ?? validateSafeText(firstName, t),
      lastName: validateRequired(lastName, t('signup.lastName'), t) ?? validateSafeText(lastName, t),
      email: validateEmail(email, t),
      password: validatePassword(password, t),
      role: validateRequired(role, t('signup.role'), t),
    }
    setErrors(nextErrors)
    if (Object.values(nextErrors).some(Boolean)) return

    void submitRegister(
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        role,
        birthday: role === 'TEACHER' && birthday ? birthday : undefined,
      },
      async () => {
        notify.success({ title: t('signup.successToastTitle'), description: t('signup.success') })
        await onCreated()
        requestClose()
      },
      (message) => {
        notify.error({ title: t('signup.errorToastTitle'), description: message })
      },
    )
  }

  const errorText = (key: string) =>
    errors[key] ? <span className="mt-xs block font-body text-body-sm font-normal text-danger">{errors[key]}</span> : null

  return (
    <dialog
      ref={dialogRef}
      onClose={requestClose}
      aria-label={t('admin.addDocente')}
      className={`fixed inset-0 m-auto max-h-[90vh] w-[min(820px,92vw)] max-w-none modal-scroll rounded-[20px] border border-neutral-200 bg-white p-lg text-left backdrop:bg-scrim md:p-xl ${closing ? 'animate-[modal-out_0.32s_ease-in]' : 'animate-[modal-in_0.32s_ease-out]'}`}
    >
      <div className="flex items-center justify-between gap-md">
        <h2 className="m-0 font-heading text-2xl font-bold text-heading">{t('admin.addDocente')}</h2>

        <ModalCloseButton
          onClick={requestClose}
          aria-label={t('admin.cancel')}
        />
      </div>

      <div className="mt-lg grid gap-md md:grid-cols-2">
        <label className="font-body text-body-sm font-semibold text-heading">
          {t('signup.firstName')}
          <input
            type="text"
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value)
              clearError('firstName')
            }}
            className={inputClassName}
          />
          {errorText('firstName')}
        </label>

        <label className="font-body text-body-sm font-semibold text-heading">
          {t('signup.lastName')}
          <input
            type="text"
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value)
              clearError('lastName')
            }}
            className={inputClassName}
          />
          {errorText('lastName')}
        </label>

        <label className="font-body text-body-sm font-semibold text-heading">
          {t('signup.email')}
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              clearError('email')
            }}
            className={inputClassName}
          />
          {errorText('email')}
        </label>

        <div className="font-body text-body-sm font-semibold text-heading">
          <label htmlFor="create-user-password">{t('signup.password')}</label>
          <div className="mt-xs">
            <PasswordInput
              id="create-user-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                clearError('password')
              }}
              showAriaLabel={t('passwordInput.showPassword')}
              hideAriaLabel={t('passwordInput.hidePassword')}
              className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
            />
          </div>
          {errorText('password')}
        </div>

        <fieldset className="m-0 border-0 p-0 font-body text-body-sm font-semibold text-heading md:col-span-2">
          <legend className="mb-xs p-0">{t('signup.role')}</legend>
          <div className="flex flex-wrap gap-sm">
            {(['TEACHER', 'ADMIN'] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={role === option}
                onClick={() => {
                  setRole(option)
                  clearError('role')
                }}
                className={roleClassName(role === option)}
              >
                {t(option === 'TEACHER' ? 'signup.teacherRole' : 'signup.adminRole')}
              </button>
            ))}
          </div>
          {errorText('role')}
        </fieldset>

        {role === 'TEACHER' && (
          <div className="font-body text-body-sm font-semibold text-heading">
            {t('signup.birthdayOptional')}
            <DatePickerField value={birthday} onChange={setBirthday} max={new Date().toISOString().split('T')[0]} ariaLabel={t('signup.birthdayOptional')} />
          </div>
        )}
      </div>

      <div className="mt-lg flex flex-wrap justify-end gap-sm">
        <Button
          variant="secondary"
          onClick={requestClose}
          className="h-11 w-auto rounded-full border-green-500 px-lg font-body text-body-sm font-semibold text-heading hover:bg-green-50"
        >
          {t('admin.cancel')}
        </Button>
        <Button
          variant="success"
          onClick={handleSave}
          loading={loading}
          className="h-11 w-auto rounded-full bg-orange-500 px-lg font-body text-body-sm font-semibold text-white hover:bg-orange-600"
        >
          {loading ? t('signup.loading') : t('signup.buttonLabel')}
        </Button>
      </div>
    </dialog>
  )
}

export default CreateUserModal
