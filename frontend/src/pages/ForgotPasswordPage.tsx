// Esto de aquí es para la pantalla de recuperar contraseña.
//Oki
import {useEffect, useState, type FormEvent} from  'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button.tsx'
import Navbar from '../components/Navbar.tsx'
import { useForgotPassword } from '../hooks/useForgotPassword.ts'
import { validateEmail } from '../utils/validators.ts'
import i18n from '../i18n/index.ts'
import LandscapeBackground from '../assets/imgs/LogInLandscape.png'
import loguitoProvisional from '../assets/imgs/loguitoProvisional.png'

function ForgotPasswordPage() {
  const { t } = useTranslation()
  
  //const { submitForgotPassword, loading, error, success } = useForgotPassword()
  const [email, setEmail] = useState('')
  const [emailValidationError, setEmailValidationError]= useState<string | null>(null)

  const{submitForgotPassword, loading, error, success} = useForgotPassword()

  useEffect(() => {
    if (emailValidationError) {
      setEmailValidationError(validateEmail(email, t))
    }

  }, [i18n.language])//Le lanza el error en el idioma que esté

  const handleForgotPassword = async (
    e: FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault()

    const emailErrorMessage = validateEmail(email, t)

    setEmailValidationError(emailErrorMessage)

    if (emailErrorMessage) return

    await submitForgotPassword({ email })
  }

  return (
    <div className="min-h-screen overflow-hidden bg-cream-100">
      {/* NAVBAR */}
      <Navbar variant="full" />

      {/* FORGOT PASSWORD */}
      <main className="relative h-[calc(100vh-64px)] min-h-[700px] overflow-hidden">
        {/* Paisaje */}
        <img
          src={LandscapeBackground}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        {/*Loguito Provisional */}
        <img 
          src={loguitoProvisional} 
          alt="My Green Farm" 
          className="absolute left-[25%] top-[20%] z-10 w-[700px] max-w-[4vw0] object-contain" 
          />

        {/* PANEL */}
        <section
          className="
            absolute
            right-[3.1%]
            top-[5%]
            z-20
            w-[437px]
            rounded-[45px]
            bg-[var(--bg-surface)]
            px-[18px]
            pb-[38px]
            pt-[32px]
          "
        >
          {/* Título */}
          <div className="text-center">
            <h2
              className="
                mb-7
                mt-6
                font-heading
                text-h2
                font-normal
                leading-none
                text-heading
              "
            >
              {t('forgotPassword.title')}
            </h2>
          </div>

          {/* FORMULARIO */}
          <div className="rounded-[38px] bg-white px-[19px] pb-[42px] pt-[34px]">
            <form
              onSubmit={handleForgotPassword}
              noValidate
              className="font-body"
            >
              {/* Descripción */}
              <p className="mb-14 text-sm leading-relaxed text-body">
                {t('forgotPassword.description')}
              </p>

              {/* Correo */}
              <div>
                <label
                  htmlFor="forgot-password-email"
                  className="
                    mb-3
                    block
                    text-left
                    font-subtitle
                    text-h5
                    font-normal
                    leading-none
                    text-heading
                  "
                >
                  {t('forgotPassword.email')}
                </label>

                <input
                  id="forgot-password-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)

                    if (emailValidationError) {
                      setEmailValidationError(null)
                    }
                  }}
                  className="
                    h-[37px]
                    w-full
                    rounded-full
                    bg-[var(--bg-surface)]
                    px-5
                    font-body
                    text-body
                    outline-none
                    focus:ring-2
                    focus:ring-heading
                  "
                />

                {/* Error de validación */}
                {emailValidationError && (
                  <p className="mt-2 text-sm text-danger">
                    {emailValidationError}
                  </p>
                )}
              </div>

              {/* Error del backend */}
              {error && (
                <p className="mt-4 text-center text-sm text-danger">
                  {error}
                </p>
              )}

              {/* Mensaje de éxito */}
              {success && (
                <p className="mt-4 text-center text-sm text-body">
                  {t('forgotPassword.success')}
                </p>
              )}

              {/* Botón */}
              <div className="mt-10">
                <Button
                  type="submit"
                  loading={loading}
                  variant="success"
                  className="text-xl"
                >
                  {loading
                    ? t('forgotPassword.loading')
                    : t('forgotPassword.buttonLabel')}
                </Button>
              </div>

              {/* Volver al Login */}
              <p className="mt-9 text-center font-body text-sm text-primary">
                <Link
                  to="/login"
                  className="transition-opacity hover:opacity-70"
                >
                  {t('forgotPassword.backToLogin')}
                </Link>
              </p>
            </form>
          </div>
        </section>

      </main>
    </div>
  )


}

export default ForgotPasswordPage
