import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button.tsx";
import LanguageSwitcher from "../components/LanguageSwitcher.tsx";
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
      <header className="relative z-40 h-[120px] bg-cream-100">
        <nav className="mx-auto flex h-full w-full items-center px-11">
          {/* Marca */}
          <Link to="/" className="font-heading text-[26px] text-heading">
            My Green Farm
          </Link>

          {/* Navegación */}
          <div className="ml-auto flex items-center gap-7 font-link">
            <Link
              to="/"
              className="text-body transition-opacity hover:opacity-70"
            >
              {t('navbar.home')}
            </Link>

            <Link
              to="/news"
              className="text-body transition-opacity hover:opacity-70"
            >
              {t('navbar.news')}
            </Link>

            <Link
              to="/multimedia"
              className="text-body transition-opacity hover:opacity-70"
            >
              {t('navbar.multimedia')}
            </Link>

            <Link
              to="/forum"
              className="text-body transition-opacity hover:opacity-70"
            >
              {t('navbar.forum')}
            </Link>

            <Link
              to="/services"
              className="text-body transition-opacity hover:opacity-70"
            >
              {t('navbar.services')}
            </Link>

            <Link
              to="/login"
              className="rounded-full bg-success px-11 py-4 text-white transition-opacity hover:opacity-90"
            >
              {t('navbar.signIn')}
            </Link>

            <Link
              to="/signup"
              className="rounded-full border border-heading px-11 py-[15px] text-body transition-colors hover:bg-cream-200"
            >
              {t('navbar.signUp')}
            </Link>
          </div>
        </nav>
      </header>

      {/*LOGIN / ILUSTRACIONES*/}
      <main className="relative h-[calc(100vh-120px)] min-h-[700px] overflow-hidden">
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
          bg-[#EEF0E5]
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
              font-body
              text-[34px]
              font-normal
              leading-tight
              text-[#517538]
            "
            >
              {t('login.overtitle')}
            </p>

            <h2
              className="
              mt-6
              mb-7
              font-heading
              text-[32px]
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
                  font-heading
                  text-[25px]
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
                  bg-[#F0EEEE]
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
                  font-heading
                  text-[25px]
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
                  bg-[#F0EEEE]
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

        {/* Language switcher */}
        <div className="absolute left-8 top-8 z-30">
          <LanguageSwitcher />
        </div>
      </main>
    </div>
  );
}

export default LoginPage;
