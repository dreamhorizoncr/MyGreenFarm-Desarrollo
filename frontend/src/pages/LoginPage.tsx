import { useState, useEffect, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button.tsx'
import PasswordInput from '../components/ui/PasswordInput.tsx'
import TextField from '../components/ui/TextField.tsx'
import AuthLayout from '../layout/AuthLayout.tsx'
import { useLogin } from '../hooks/useLogin.ts'
import { validateEmail, validatePassword } from '../utils/validators.ts'
import i18n from '../i18n/index.ts'

function LoginPage() {
  const { t } = useTranslation()
  const { submitLogin, loading, error } = useLogin()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailValidationError, setEmailValidationError] = useState<string | null>(null)
  const [passwordValidationError, setPasswordValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (emailValidationError) setEmailValidationError(validateEmail(email, t))
    if (passwordValidationError) setPasswordValidationError(validatePassword(password, t))
  }, [i18n.language]) //Le lanza el error en el idioma que esté

  const handleLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const emailErrorMessage = validateEmail(email, t)
    const passwordErrorMessage = validatePassword(password, t)
    setEmailValidationError(emailErrorMessage)
    setPasswordValidationError(passwordErrorMessage)
    if (emailErrorMessage || passwordErrorMessage) return
    submitLogin({ email, password }, (user) =>
      navigate(user.role === 'ADMIN' ? '/admin/dashboard' : '/'),
    )
  }

  return (
    <AuthLayout
      overtitle={t('login.overtitle')}
      contentClassName="max-w-[390px]"
    >
      {/*Título*/}
      <h2 className="mb-[55px] text-center font-heading text-[42px] leading-none text-heading">
        {t('login.title')}
      </h2>

      {/*Formulario*/}
      <form onSubmit={handleLogin} noValidate>
        {/*Correo*/}
        <div className="mb-[30px]">
          <TextField
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)

              if (emailValidationError) {
                setEmailValidationError(null)
              }
            }}
            label={t('login.email')}
            error={emailValidationError}
          />
        </div>

        {/*Contraseña*/}
        <TextField
          id="login-password"
          label={t('login.password')}
          error={passwordValidationError}
        >
          <PasswordInput
            id="login-password"
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

        {/*Recuperar contraseña*/}
        <div className="mt-[15px] text-right">
          <Link
            to="/forgot-password"
            className="font-link text-[13px] text-heading transition-opacity hover:opacity-70"
          >
            {t('login.forgotPassword')}
          </Link>
        </div>

        {/*Error de autenticación*/}
        {error && (
          <p className="mt-4 text-center font-body text-sm text-danger">
            {error}
          </p>
        )}

        {/*Botón*/}
        <div className="mt-[35px]">
          <Button
            type="submit"
            loading={loading}
            variant="success"
            className="h-[47px] w-full rounded-none bg-green-500 font-body text-[17px] font-normal uppercase tracking-wide text-white"
          >
            {loading ? t('login.loading') : t('login.buttonLabel')}
          </Button>
        </div>

        {/*Registro*/}
        <p className="mt-[26px] text-center font-body text-[14px] text-body-text">
          {t('login.noAccount')}{' '}
          <Link
            to="/signup"
            className="font-link text-heading transition-opacity hover:opacity-70"
          >
            {t('login.goToSignup')}
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}

export default LoginPage