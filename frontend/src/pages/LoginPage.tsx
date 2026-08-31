import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button.tsx";
import PasswordInput from "../components/ui/PasswordInput.tsx";
import LanguageSwitcher from "../components/LanguageSwitcher.tsx";
import { useLogin } from "../hooks/useLogin.ts";
import { useState, useEffect, type FormEvent } from "react";
import { validateEmail, validatePassword } from "../utils/validators.ts";
import i18n from "../i18n/index.ts";
import loginIlustration from "../assets/imgs/IlustrationAuth.png";

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
      navigate(user.role === "ADMIN" ? "/admin/dashboard" : "/"),
    );
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-page px-6 py-10">
      {/*Contenedor Principal*/}
      <section className="relative flex h-[650px] w-full max-w-[1180px] overflow-hidden rounded-2xl bg-bg-card shadow">
        {/*Panel Izquierdo*/}
        <div className="relative hidden w-1/2 overflow-hidden md:block">
          {/*Ilustración*/}
          <img
            src={loginIlustration}
            alt="My Green Farm"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />

          {/*Welcome*/}
          <div className="absolute left-0 top-[9%] z-10 w-full text-center">
            <h1 className="m-0 font-heading text-[45px] leading-none tracking-wide text-white">
              {t("login.overtitle")}
            </h1>
          </div>
        </div>

        {/*Panel Derecho*/}
        <div className="relative flex w-full flex-col bg-bg-card px-[70px] py-[55px] md:w-1/2">
          {/*Selector de idioma*/}
          <div className="absolute right-[30px] top-[25px] z-20">
            <LanguageSwitcher />
          </div>

          {/*Contenido*/}
          <div className="mx-auto flex h-full w-full max-w-[390px] flex-col justify-center">
            {/*Título*/}
            <h2 className="mb-[55px] text-center font-heading text-[42px] leading-none text-heading">
              {t("login.title")}
            </h2>

            {/*Formulario*/}
            <form onSubmit={handleLogin} noValidate>
              {/*Correo*/}
              <div className="mb-[30px]">
                <label
                  htmlFor="login-email"
                  className="mb-[4px] block text-left font-body text-[16px] text-body-text"
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
                  className="h-[38px] w-full border-b border-neutral-300 bg-transparent px-0 font-body text-[15px] text-body-text outline-none transition focus:border-green-500"
                />

                {/*Error de validación*/}
                {emailValidationError && (
                  <p className="mt-2 text-left font-body text-sm text-danger">
                    {emailValidationError}
                  </p>
                )}
              </div>

              {/*Contraseña*/}
              <div>
                <label
                  htmlFor="login-password"
                  className="mb-[4px] block text-left font-body text-[16px] text-body-text"
                >
                  {t("login.password")}
                </label>

                <PasswordInput
                  id="login-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);

                    if (passwordValidationError) {
                      setPasswordValidationError(null);
                    }
                  }}
                  className="h-[38px] w-full border-b border-neutral-300 bg-transparent px-0 font-body text-[15px] text-body-text outline-none transition focus:border-green-500"
                  showAriaLabel={t("passwordInput.showPassword")}
                  hideAriaLabel={t("passwordInput.hidePassword")}
                />

                {/*Error de validación*/}
                {passwordValidationError && (
                  <p className="mt-2 text-left font-body text-sm text-danger">
                    {passwordValidationError}
                  </p>
                )}
              </div>

              {/*Recuperar contraseña*/}
              <div className="mt-[15px] text-right">
                <Link
                  to="/forgot-password"
                  className="font-link text-[13px] text-heading transition-opacity hover:opacity-70"
                >
                  {t("login.forgotPassword")}
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
                  {loading ? t("login.loading") : t("login.buttonLabel")}
                </Button>
              </div>

              {/*Registro*/}
              <p className="mt-[26px] text-center font-body text-[14px] text-body-text">
                {t("login.noAccount")}{" "}
                <Link
                  to="/signup"
                  className="font-link text-heading transition-opacity hover:opacity-70"
                >
                  {t("login.goToSignup")}
                </Link>
              </p>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
