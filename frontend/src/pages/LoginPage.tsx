import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button.tsx";
import Navbar from "../components/Navbar.tsx";
import { useLogin } from "../hooks/useLogin.ts";
import { useState, useEffect, type FormEvent } from "react";
import { validateEmail, validatePassword } from "../utils/validators.ts";
import i18n from "../i18n/index.ts";
import rutySitted from "../assets/imgs/RutySitted.png";
import loginBackground from "../assets/imgs/LogInLandscape.png";

function LoginPage() {
  const { t } = useTranslation();
  const { submitLogin, loading, error } = useLogin();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailValidationError, setEmailValidationError] = useState<
    string | null
  >(null);
  const [passwordValidationError, setPasswordValidationError] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (emailValidationError) setEmailValidationError(validateEmail(email, t));
    if (passwordValidationError)
      setPasswordValidationError(validatePassword(password, t));
  }, [i18n.language]); //Le lanza el error en el idioma que esté

  const handleLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const emailErrorMessage = validateEmail(email, t);
    const passwordErrorMessage = validatePassword(password, t);
    setEmailValidationError(emailErrorMessage);
    setPasswordValidationError(passwordErrorMessage);
    if (emailErrorMessage || passwordErrorMessage) return;
    submitLogin({ email, password }, (user) =>
      navigate(user.role === "ADMIN" ? "/admin/users" : "/")
    );
  };

  return (
    <div className="min-h-screen overflow-hidden bg-cream-100">
      {/*NAVBAR*/}
      <Navbar variant="full" />

      {/*LOGIN / ILUSTRACIONES*/}
      <main className="relative h-[calc(100vh-64px)] min-h-[700px] overflow-hidden">
        {/* Paisaje */}
        <img
          src={loginBackground}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-center"
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

        {/*PORTAL ADMINISTRATIVO*/}
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
          {/* Título del portal */}
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
              {t('login.overtitle')}
            </p>

            <h2
              className="
              mt-6
              mb-7
              font-heading
              text-h2
              font-normal
              leading-none
              text-heading
            "
            >
              {t("login.title")}
            </h2>
          </div>

          {/*FORMULARIO*/}
          <div className="rounded-[38px] bg-white px-[19px] pb-[42px] pt-[34px]">
            <form onSubmit={handleLogin} noValidate className="font-body">
              {/* Correo */}
              <div className="mb-4">
                <label
                  htmlFor="login-email"
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
                  {t("login.email")}
                </label>

                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);

                    if (emailValidationError) {
                      setEmailValidationError(null);
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
                  htmlFor="login-password"
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
                  {t("login.password")}
                </label>

                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);

                    if (passwordValidationError) {
                      setPasswordValidationError(null);
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

              {/* Recuperar contraseña */}
              <div className="mt-4 text-right">
                <Link
                  to="/forgot-password"
                  className="
                  font-body
                  text-sm
                  text-primary
                  transition-opacity
                  hover:opacity-70
                "
                >
                  {t('login.forgotPassword')}
                </Link>
              </div>

              {/* Error de autenticación */}
              {error && (
                <p className="mt-4 text-center text-sm text-danger">{error}</p>
              )}

              {/* Botón */}
              <div className="mt-7">
                <Button type="submit" loading={loading} variant="success" className= "text-xl">
                  {loading ? t("login.loading") : t("login.buttonLabel")}
                </Button>
              </div>

              {/* Registro si no tiene una cuenta existente */}
              <p className="mt-5 text-center font-body text-sm text-primary">
                {t("login.noAccount")}{" "}
                <Link
                  to="/signup"
                  className="font-link font-bold hover:underline"
                >
                  {t("login.goToSignup")}
                </Link>
              </p>
            </form>
          </div>
        </section>

      </main>
    </div>
  );
}

export default LoginPage;
