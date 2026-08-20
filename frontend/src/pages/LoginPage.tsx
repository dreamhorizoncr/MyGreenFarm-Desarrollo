import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button.tsx'
import LanguageSwitcher from '../components/LanguageSwitcher.tsx'
import { useLogin } from '../hooks/useLogin.ts'
import { useState, useEffect, type FormEvent } from 'react'
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language])

  const handleLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const emailErrorMessage = validateEmail(email, t)
    const passwordErrorMessage = validatePassword(password, t)
    setEmailValidationError(emailErrorMessage)
    setPasswordValidationError(passwordErrorMessage)
    if (emailErrorMessage || passwordErrorMessage) return
    submitLogin({ email, password }, () => navigate('/'))
  }

  return (
    <section id="login">
      <h1>{t('login.title')}</h1>
      <LanguageSwitcher />

      <form onSubmit={handleLogin} noValidate>
        <div>
          <label htmlFor="login-email">{t('login.email')}</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => { 
              setEmail(e.target.value)
              //  borrar el mensaje de error de validación si el usuario comienza a escribir nuevamente
              if (emailValidationError) setEmailValidationError(null) 
            }}
          />
          {emailValidationError && <p className="text-danger">{emailValidationError}</p>}
        </div>

        <div>
          <label htmlFor="login-password">{t('login.password')}</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => { 
              setPassword(e.target.value)
              if (passwordValidationError) setPasswordValidationError(null) 
            }}
          />
          {passwordValidationError && <p className="text-danger">{passwordValidationError}</p>}
        </div>

        {error && <p className="text-danger">{error}</p>}

        <Button type="submit" loading={loading}>
          {loading ? t('login.loading') : t('login.buttonLabel')}
        </Button>
      </form>

      <p>
        {t('login.noAccount')}{' '}
        <Link to="/signup">{t('login.goToSignup')}</Link>
      </p>
    </section>
  )
}

export default LoginPage