import { useState, useEffect, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button.tsx'
import Navbar from '../components/Navbar.tsx'
import { useRegister } from '../hooks/useRegister.ts'
import { validateEmail, validatePassword, validateRequired } from '../utils/validators.ts'
import i18n from '../i18n/index.ts'
import rutySitted from '../assets/imgs/RutySitted.png'
import loginBackground from '../assets/imgs/LogInLandscape.png'

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
    if (firstNameValidationError) setFirstNameValidationError(validateRequired(firstName, t('signup.firstName'), t))
    if (lastNameValidationError) setLastNameValidationError(validateRequired(lastName, t('signup.lastName'), t))
    if (emailValidationError) setEmailValidationError(validateEmail(email, t))
    if (passwordValidationError) setPasswordValidationError(validatePassword(password, t))
    if(roleValidationError){setRoleValidationError(validateRequired(role, t('signup.role'), t))}
  }, [i18n.language])

  const handleSignUp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    const firstNameErrorMessage = validateRequired(firstName, t('signup.firstName'), t)
    const lastNameErrorMessage = validateRequired(lastName, t('signup.lastName'), t)
    const emailErrorMessage = validateEmail(email, t)
    const passwordErrorMessage = validatePassword(password, t)
    const roleErrorMessage = validateRequired(role, t('signup.role'), t)
    
    setFirstNameValidationError(firstNameErrorMessage)
    setLastNameValidationError(lastNameErrorMessage)
    setEmailValidationError(emailErrorMessage)
    setPasswordValidationError(passwordErrorMessage)
    setRoleValidationError(roleErrorMessage)
    
    if (firstNameErrorMessage || lastNameErrorMessage || emailErrorMessage || passwordErrorMessage || roleErrorMessage) return
    
    submitRegister({ firstName, lastName, email, password, role })
  }

  return (
    <div className="min-h-screen overflow-hidden bg-cream-100">
      {/* NAVBAR */}
      <Navbar variant="full" />

      {/* SIGN UP / ILUSTRACIONES */}
      <main className="relative h-[calc(100vh-64px)] min-h-[700px] overflow-hidden">
        {/* Paisaje */}
        <img
          src={loginBackground}
          alt=""
          aria-hidden="true"
          className="
            absolute
            inset-0
            h-full
            w-full
            object-cover
            object-center
          "
        />

        {/* Ruty */}
        <img
          src={rutySitted}
          alt="Ruty"
          className="
            absolute
            bottom-[15%]
            left-[25%]
            z-10
            w-[425px]
            max-w-[32vw]
            object-contain
          "
        />

        {/* PORTAL ADMINISTRATIVO */}
        <section
          className="
            absolute
            right-[3.1%]
            top-[4%]
            z-20
            w-[660px]
            rounded-[45px]
            bg-[var(--bg-surface)]
            px-[22px]
            pb-[30px]
            pt-[28px]
          "
        >
          {/* Títulos */}
          <div className="text-center">
            <p
              className="
                m-0
                font-heading
                text-h4
                font-normal
                leading-tight
                text-body
              "
            >
              {t('signup.overtitle')}
            </p>

            <h2
              className="
                mb-7
                mt-5
                font-heading
                text-h2
                font-normal
                leading-none
                text-heading
              "
            >
              {t('signup.title')}
            </h2>
          </div>

          {/* CONTENEDOR BLANCO */}
          <div
            className="
              rounded-[38px]
              bg-white
              px-[28px]
              pb-[32px]
              pt-[30px]
            "
          >
            {success ? (
              <div className="py-10 text-center">
                <p className="font-body text-base text-body">
                  {t('signup.success')}
                </p>

                <Link
                  to="/login"
                  className="
                    mt-5
                    inline-block
                    font-body
                    text-sm
                    text-primary
                    transition-opacity
                    hover:opacity-70
                  "
                >
                  {t('signup.goToLogin')}
                </Link>
              </div>
            ) : (
              <form
                onSubmit={handleSignUp}
                noValidate
                className="font-body"
              >
                {/* Nombre y Apellido */}
                <div className="grid grid-cols-2 gap-8">
                  {/* Nombre */}
                  <div>
                    <label
                      htmlFor="signup-firstname"
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
                      {t('signup.firstName')}
                    </label>

                    <input
                      id="signup-firstname"
                      type="text"
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value)

                        if (firstNameValidationError) {
                          setFirstNameValidationError(null)
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

                    {firstNameValidationError && (
                      <p className="mt-2 text-sm text-danger">
                        {firstNameValidationError}
                      </p>
                    )}
                  </div>

                  {/* Apellido */}
                  <div>
                    <label
                      htmlFor="signup-lastname"
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
                      {t('signup.lastName')}
                    </label>

                    <input
                      id="signup-lastname"
                      type="text"
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value)

                        if (lastNameValidationError) {
                          setLastNameValidationError(null)
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

                    {lastNameValidationError && (
                      <p className="mt-2 text-sm text-danger">
                        {lastNameValidationError}
                      </p>
                    )}
                  </div>
                </div>

                {/* Correo y Contraseña */}
                <div className="mt-7 grid grid-cols-2 gap-8">
                  {/* Correo */}
                  <div>
                    <label
                      htmlFor="signup-email"
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
                      {t('signup.email')}
                    </label>

                    <input
                      id="signup-email"
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

                    {emailValidationError && (
                      <p className="mt-2 text-sm text-danger">
                        {emailValidationError}
                      </p>
                    )}
                  </div>

                  {/* Contraseña */}
                  <div>
                    <label
                      htmlFor="signup-password"
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
                      {t('signup.password')}
                    </label>

                    <input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)

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

                    {passwordValidationError && (
                      <p className="mt-2 text-sm text-danger">
                        {passwordValidationError}
                      </p>
                    )}
                  </div>
                </div>

                {/* Rol y Botón */}
                <div className="mt-8 grid grid-cols-2 items-end gap-8">
                  {/* Rol */}
                  <div>
                    <label
                      htmlFor="signup-role"
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
                      className="
                        h-[37px]
                        w-full
                        appearance-none
                        rounded-full
                        bg-[var(--bg-surface)]
                        px-5
                        pr-12
                        font-body
                        text-body
                        outline-none
                        focus:ring-2
                        focus:ring-heading
                      "
                    >
                      <option value="">
                        {t('signup.selectRole')}
                      </option>

                      <option value="User">
                        {t('signup.userRole')}
                      </option>

                      <option value="Admin">
                        {t('signup.adminRole')}
                      </option>
                    </select>

                    {roleValidationError && (
                      <p className="mt-2 text-sm text-danger">
                        {roleValidationError}
                      </p>
                    )}
                  </div>

                  {/* Crear cuenta */}
                  <div>
                    <Button
                      type="submit"
                      loading={loading}
                      variant="success"
                      className="text-xl"
                    >
                      {loading
                        ? t('signup.loading')
                        : t('signup.buttonLabel')}
                    </Button>
                  </div>
                </div>

                {/* Error backend */}
                {error && (
                  <p className="mt-4 text-center text-sm text-danger">
                    {error}
                  </p>
                )}

                {/* Regresar al Login */}
                <p
                  className="
                    mt-6
                    text-center
                    font-body
                    text-sm
                    text-primary
                  "
                >
                  {t('signup.hasAccount')}{' '}

                  <Link
                    to="/login"
                    className="
                      transition-opacity
                      hover:opacity-70
                    "
                  >
                    {t('signup.goToLogin')}
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

export default SignUpPage
