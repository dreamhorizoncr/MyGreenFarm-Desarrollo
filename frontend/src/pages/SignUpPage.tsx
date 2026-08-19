import { useState, useEffect, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button.tsx'
import LanguageSwitcher from '../components/LanguageSwitcher.tsx'
import { useRegister } from '../hooks/useRegister.ts'
import { validateEmail, validatePassword, validateRequired } from '../utils/validators.ts'
import i18n from '../i18n/index.ts'

function SignUpPage() {
  const { t } = useTranslation()
  const { submitRegister, loading, error, success } = useRegister()
  
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  const [firstNameValidationError, setFirstNameValidationError] = useState<string | null>(null)
  const [lastNameValidationError, setLastNameValidationError] = useState<string | null>(null)
  const [emailValidationError, setEmailValidationError] = useState<string | null>(null)
  const [passwordValidationError, setPasswordValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (firstNameValidationError) setFirstNameValidationError(validateRequired(firstName, t('signup.firstName'), t))
    if (lastNameValidationError) setLastNameValidationError(validateRequired(lastName, t('signup.lastName'), t))
    if (emailValidationError) setEmailValidationError(validateEmail(email, t))
    if (passwordValidationError) setPasswordValidationError(validatePassword(password, t))
  }, [i18n.language])

  const handleSignUp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    const firstNameErrorMessage = validateRequired(firstName, t('signup.firstName'), t)
    const lastNameErrorMessage = validateRequired(lastName, t('signup.lastName'), t)
    const emailErrorMessage = validateEmail(email, t)
    const passwordErrorMessage = validatePassword(password, t)
    
    setFirstNameValidationError(firstNameErrorMessage)
    setLastNameValidationError(lastNameErrorMessage)
    setEmailValidationError(emailErrorMessage)
    setPasswordValidationError(passwordErrorMessage)
    
    if (firstNameErrorMessage || lastNameErrorMessage || emailErrorMessage || passwordErrorMessage) return
    
    submitRegister({ firstName, lastName, email, password })
  }

  return (
    <section id="signup">
      <h1>{t('signup.title')}</h1>
      <LanguageSwitcher />

      {success ? (
        <p>{t('signup.success')}</p>
      ) : (
        <form onSubmit={handleSignUp} noValidate>
          <div>
            <label htmlFor="signup-firstname">{t('signup.firstName')}</label>
            <input
              id="signup-firstname"
              type="text"
              value={firstName}
              onChange={(e) => { 
                setFirstName(e.target.value)
                if (firstNameValidationError) setFirstNameValidationError(null) 
              }}
            />
            {firstNameValidationError && <p className="text-danger">{firstNameValidationError}</p>}
          </div>

          <div>
            <label htmlFor="signup-lastname">{t('signup.lastName')}</label>
            <input
              id="signup-lastname"
              type="text"
              value={lastName}
              onChange={(e) => { 
                setLastName(e.target.value)
                if (lastNameValidationError) setLastNameValidationError(null) 
              }}
            />
            {lastNameValidationError && <p className="text-danger">{lastNameValidationError}</p>}
          </div>

          <div>
            <label htmlFor="signup-email">{t('signup.email')}</label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => { 
                setEmail(e.target.value)
                if (emailValidationError) setEmailValidationError(null) 
              }}
            />
            {emailValidationError && <p className="text-danger">{emailValidationError}</p>}
          </div>

          <div>
            <label htmlFor="signup-password">{t('signup.password')}</label>
            <input
              id="signup-password"
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
            {loading ? t('signup.loading') : t('signup.buttonLabel')}
          </Button>
        </form>
      )}

      <p>
        {t('signup.hasAccount')}{' '}
        <Link to="/login">{t('signup.goToLogin')}</Link>
      </p>
    </section>
  )
}

export default SignUpPage