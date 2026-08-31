import { useState, useEffect, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import PasswordInput from '../components/ui/PasswordInput.tsx'
import TextField from '../components/ui/TextField.tsx'
import AuthButton from '../components/ui/AuthButton.tsx'
import AuthLayout from '../layout/AuthLayout.tsx'
import { useRegister } from '../hooks/useRegister.ts'
import {
  validateEmail,
  validatePassword,
  validateRequired,
} from '../utils/validators.ts'
import i18n from '../i18n/index.ts'

function SignUpPage() {
  const { t } = useTranslation()
  const { submitRegister, loading, error, success } = useRegister()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('')

  const [firstNameValidationError, setFirstNameValidationError] = useState<string | null>(null)
  const [lastNameValidationError, setLastNameValidationError] = useState<string | null>(null)
  const [emailValidationError, setEmailValidationError] = useState<string | null>(null)
  const [passwordValidationError, setPasswordValidationError] = useState<string | null>(null)
  const [roleValidationError, setRoleValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (firstNameValidationError)
      setFirstNameValidationError(
        validateRequired(firstName, t('signup.firstName'), t),
      )
    if (lastNameValidationError)
      setLastNameValidationError(
        validateRequired(lastName, t('signup.lastName'), t),
      )
    if (emailValidationError) setEmailValidationError(validateEmail(email, t))
    if (passwordValidationError)
      setPasswordValidationError(validatePassword(password, t))
    if (roleValidationError) {
      setRoleValidationError(validateRequired(role, t('signup.role'), t))
    }
  }, [i18n.language])

  const handleSignUp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const firstNameErrorMessage = validateRequired(
      firstName,
      t('signup.firstName'),
      t,
    )
    const lastNameErrorMessage = validateRequired(
      lastName,
      t('signup.lastName'),
      t,
    )
    const emailErrorMessage = validateEmail(email, t)
    const passwordErrorMessage = validatePassword(password, t)
    const roleErrorMessage = validateRequired(role, t('signup.role'), t)

    setFirstNameValidationError(firstNameErrorMessage)
    setLastNameValidationError(lastNameErrorMessage)
    setEmailValidationError(emailErrorMessage)
    setPasswordValidationError(passwordErrorMessage)
    setRoleValidationError(roleErrorMessage)

    if (
      firstNameErrorMessage ||
      lastNameErrorMessage ||
      emailErrorMessage ||
      passwordErrorMessage ||
      roleErrorMessage
    )
      return

    submitRegister({ firstName, lastName, email, password, role })
  }

  return (
    <AuthLayout
      overtitle={t('signup.overtitle')}
      rightPanelClassName="px-[55px] py-[45px]"
      contentClassName="max-w-[490px]"
    >
      {/*Título*/}
      <h2 className="mb-[45px] text-center font-heading text-[42px] leading-none text-heading">
        {t('signup.title')}
      </h2>

      {success ? (
        /*Mensaje de éxito*/
        <div className="text-center">
          <p className="font-body text-[16px] text-body-text">
            {t('signup.success')}
          </p>

          <Link
            to="/login"
            className="mt-5 inline-block font-link text-[14px] text-heading transition-opacity hover:opacity-70"
          >
            {t('signup.goToLogin')}
          </Link>
        </div>
      ) : (
        /*Formulario*/
        <form onSubmit={handleSignUp} noValidate>
          {/*Nombre y Apellido*/}
          <div className="grid grid-cols-2 gap-[55px]">
            {/*Nombre*/}
            <TextField
              id="signup-firstname"
              type="text"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value)

                if (firstNameValidationError) {
                  setFirstNameValidationError(null)
                }
              }}
              label={t('signup.firstName')}
              error={firstNameValidationError}
            />

            {/*Apellido*/}
            <TextField
              id="signup-lastname"
              type="text"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value)

                if (lastNameValidationError) {
                  setLastNameValidationError(null)
                }
              }}
              label={t('signup.lastName')}
              error={lastNameValidationError}
            />
          </div>

          {/*Correo y Contraseña*/}
          <div className="mt-[32px] grid grid-cols-2 gap-[55px]">
            {/*Correo*/}
            <TextField
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)

                if (emailValidationError) {
                  setEmailValidationError(null)
                }
              }}
              label={t('signup.email')}
              error={emailValidationError}
            />

            {/*Contraseña*/}
            <TextField
              id="signup-password"
              label={t('signup.password')}
              error={passwordValidationError}
            >
              <PasswordInput
                id="signup-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)

                  if (passwordValidationError) {
                    setPasswordValidationError(null)
                  }
                }}
                className="h-9.5 w-full border-b border-neutral-300 bg-transparent px-0 font-body text-[15px] text-body-text outline-none transition focus:border-green-500"
                showAriaLabel={t('passwordInput.showPassword')}
                hideAriaLabel={t('passwordInput.hidePassword')}
              />
            </TextField>
          </div>

          {/*Rol*/}
          <div className="mx-auto mt-[32px] w-[55%]">
            <label
              htmlFor="signup-role"
              className="mb-[4px] block text-left font-body text-[16px] text-body-text"
            >
              {t('signup.role')}
            </label>

            <select
              id="signup-role"
              value={role}
              onChange={(e) => {
                setRole(e.target.value)

                if (roleValidationError) {
                  setRoleValidationError(null)
                }
              }}
              className="h-[38px] w-full border-b border-neutral-300 bg-transparent px-0 font-body text-[15px] text-body-text outline-none transition focus:border-green-500"
            >
              <option value="">{t('signup.selectRole')}</option>

              <option value="User">{t('signup.userRole')}</option>

              <option value="Admin">{t('signup.adminRole')}</option>
            </select>

            {roleValidationError && (
              <p className="mt-2 text-left font-body text-sm text-danger">
                {roleValidationError}
              </p>
            )}
          </div>

          {/*Error backend*/}
          {error && (
            <p className="mt-4 text-center font-body text-sm text-danger">
              {error}
            </p>
          )}

          {/*Botón*/}
          <div className="mx-auto mt-[38px] w-[70%]">
            <AuthButton loading={loading}>
              {loading ? t('signup.loading') : t('signup.buttonLabel')}
            </AuthButton>
          </div>

          {/*Regresar al Login*/}
          <p className="mt-[28px] text-center font-body text-[14px] text-body-text">
            {t('signup.hasAccount')}{' '}
            <Link
              to="/login"
              className="font-link text-heading transition-opacity hover:opacity-70"
            >
              {t('signup.goToLogin')}
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  )
}

export default SignUpPage