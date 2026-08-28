// Esto de aquí es para la pantalla de restablecer contraseña (la que abre el link del correo).
import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import Button from '../components/ui/Button.tsx'
import Navbar from '../components/Navbar.tsx'
import { useResetPassword } from '../hooks/useResetPassword.ts'
import { validatePassword } from '../utils/validators.ts'
import i18n from '../i18n/index.ts'
import LandscapeBackground from '../assets/imgs/LogInLandscape.png'
import loguitoProvisional from '../assets/imgs/loguitoProvisional.png'

function ResetPasswordPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordValidationError, setPasswordValidationError] = useState<string | null>(null)
  const [confirmValidationError, setConfirmValidationError] = useState<string | null>(null)

  const { submitResetPassword, loading, error, success } = useResetPassword()

  useEffect(() => {
    if (passwordValidationError) {
      setPasswordValidationError(validatePassword(newPassword, t))
    }
  }, [i18n.language])

  const handleResetPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!token) return

    const passwordErrorMessage = validatePassword(newPassword, t)
    setPasswordValidationError(passwordErrorMessage)

    const confirmErrorMessage =
      confirmPassword === newPassword ? null : t('resetPassword.passwordMismatch')
    setConfirmValidationError(confirmErrorMessage)

    if (passwordErrorMessage || confirmErrorMessage) return

    await submitResetPassword({ token, newPassword })
  }

  return (
    <div className="min-h-screen overflow-hidden bg-cream-100">
      {/* NAVBAR */}
      <Navbar variant="minimal" />

      {/* RESET PASSWORD */}
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
              {t('resetPassword.title')}
            </h2>
          </div>

          {/* FORMULARIO */}
          <div className="rounded-[38px] bg-white px-[19px] pb-[42px] pt-[34px]">
            {!token ? (
              <>
                {/* Enlace sin token */}
                <p className="mb-10 text-sm leading-relaxed text-body">
                  {t('resetPassword.missingToken')}
                </p>

                <p className="text-center font-body text-sm text-primary">
                  <Link
                    to="/forgot-password"
                    className="transition-opacity hover:opacity-70"
                  >
                    {t('resetPassword.requestNewLink')}
                  </Link>
                </p>
              </>
            ) : (
              <form
                onSubmit={handleResetPassword}
                noValidate
                className="font-body"
              >
                {/* Nueva contraseña */}
                <div>
                  <label
                    htmlFor="reset-password-new"
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
                    {t('resetPassword.newPassword')}
                  </label>

                  <input
                    id="reset-password-new"
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value)

                      if (passwordValidationError) {
                        setPasswordValidationError(null)
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
                  {passwordValidationError && (
                    <p className="mt-2 text-sm text-danger">
                      {passwordValidationError}
                    </p>
                  )}
                </div>

                {/* Confirmar contraseña */}
                <div className="mt-8">
                  <label
                    htmlFor="reset-password-confirm"
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
                    {t('resetPassword.confirmPassword')}
                  </label>

                  <input
                    id="reset-password-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)

                      if (confirmValidationError) {
                        setConfirmValidationError(null)
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
                  {confirmValidationError && (
                    <p className="mt-2 text-sm text-danger">
                      {confirmValidationError}
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
                    {t('resetPassword.success')}
                  </p>
                )}

                {/* Botón */}
                {!success && (
                  <div className="mt-10">
                    <Button
                      type="submit"
                      loading={loading}
                      variant="success"
                      className="text-xl"
                    >
                      {loading
                        ? t('resetPassword.loading')
                        : t('resetPassword.buttonLabel')}
                    </Button>
                  </div>
                )}

                {/* Ir al Login */}
                <p className="mt-9 text-center font-body text-sm text-primary">
                  <Link
                    to="/login"
                    className="transition-opacity hover:opacity-70"
                  >
                    {t('resetPassword.backToLogin')}
                  </Link>
                </p>
              </form>
            )}
          </div>
        </section>

      </main>
    </div>
  )
}

export default ResetPasswordPage
