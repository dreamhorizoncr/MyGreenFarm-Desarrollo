// Esto de aquí es para la pantalla de recuperar contraseña.
import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import TextField from '../components/ui/TextField.tsx'
import AuthButton from '../components/ui/AuthButton.tsx'
import AuthLayout from '../layout/AuthLayout.tsx'
import { useForgotPassword } from '../hooks/useForgotPassword.ts'
import { validateEmail } from '../utils/validators.ts'
import i18n from '../i18n/index.ts'

function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [emailValidationError, setEmailValidationError] = useState<string | null>(null)

  const { submitForgotPassword, loading, error, success } = useForgotPassword()

  useEffect(() => {
    if (emailValidationError) {
      setEmailValidationError(validateEmail(email, t));
    }
  }, [i18n.language]) //Le lanza el error en el idioma que esté

  const handleForgotPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const emailErrorMessage = validateEmail(email, t);

    setEmailValidationError(emailErrorMessage);

    if (emailErrorMessage) return;

    await submitForgotPassword({ email });
  };

  return (
    <AuthLayout overtitle={t('forgotPassword.overtitle')}>
      {/*Título*/}
      <h2 className="mb-[45px] text-center font-heading text-[42px] leading-none text-heading">
        {t('forgotPassword.title')}
      </h2>

      {/*Descripción*/}
      <p className="mb-[50px] text-center font-body text-[15px] leading-[1.7] text-body-text">
        {t('forgotPassword.description')}
      </p>

      {/*Formulario*/}
      <form onSubmit={handleForgotPassword} noValidate>
        {/*Correo*/}
        <TextField
          id="forgot-password-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)

            if (emailValidationError) {
              setEmailValidationError(null)
            }
          }}
          label={t('forgotPassword.email')}
          error={emailValidationError}
        />

        {/*Error del backend*/}
        {error && (
          <p className="mt-4 text-center font-body text-sm text-danger">
            {error}
          </p>
        )}

        {/*Mensaje de éxito*/}
        {success && (
          <p className="mt-4 text-center font-body text-sm text-body-text">
            {t('forgotPassword.success')}
          </p>
        )}

        {/*Botón*/}
        <div className="mx-auto mt-[55px] w-[72%]">
          <AuthButton loading={loading}>
            {loading
              ? t('forgotPassword.loading')
              : t('forgotPassword.buttonLabel')}
          </AuthButton>
        </div>

        {/*Volver al Login*/}
        <p className="mt-[35px] text-center">
          <Link
            to="/login"
            className="font-link text-[14px] text-heading transition-opacity hover:opacity-70"
          >
            {t('forgotPassword.backToLogin')}
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}

export default ForgotPasswordPage
