// Esto de aquí es para la pantalla de recuperar contraseña.
//Oki
import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button.tsx";
import LanguageSwitcher from "../components/LanguageSwitcher.tsx";
import { useForgotPassword } from "../hooks/useForgotPassword.ts";
import { validateEmail } from "../utils/validators.ts";
import i18n from "../i18n/index.ts";
import LandscapeIlustration from "../assets/imgs/IlustrationAuth.png";

function ForgotPasswordPage() {
  const { t } = useTranslation();

  //const { submitForgotPassword, loading, error, success } = useForgotPassword()
  const [email, setEmail] = useState("");
  const [emailValidationError, setEmailValidationError] = useState<
    string | null
  >(null);

  const { submitForgotPassword, loading, error, success } = useForgotPassword();

  useEffect(() => {
    if (emailValidationError) {
      setEmailValidationError(validateEmail(email, t));
    }
  }, [i18n.language]); //Le lanza el error en el idioma que esté

  const handleForgotPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const emailErrorMessage = validateEmail(email, t);

    setEmailValidationError(emailErrorMessage);

    if (emailErrorMessage) return;

    await submitForgotPassword({ email });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-page px-6 py-10">
      {/*Contenedor Principal*/}
      <section className="relative flex h-[650px] w-full max-w-[1180px] overflow-hidden rounded-2xl bg-bg-card shadow">
        {/*Panel Izquierdo*/}
        <div className="relative hidden w-1/2 overflow-hidden md:block">
          {/*Ilustración*/}
          <img
            src={LandscapeIlustration}
            alt="My Green Farm"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />

          {/*Welcome*/}
          <div className="absolute left-0 top-[9%] z-10 w-full text-center">
            <h1 className="m-0 font-heading text-[45px] leading-none tracking-wide text-white">
              {t("forgotPassword.overtitle")}
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
          <div className="mx-auto flex h-full w-full max-w-[430px] flex-col justify-center">
            {/*Título*/}
            <h2 className="mb-[45px] text-center font-heading text-[42px] leading-none text-heading">
              {t("forgotPassword.title")}
            </h2>

            {/*Descripción*/}
            <p className="mb-[50px] text-center font-body text-[15px] leading-[1.7] text-body-text">
              {t("forgotPassword.description")}
            </p>

            {/*Formulario*/}
            <form onSubmit={handleForgotPassword} noValidate>
              {/*Correo*/}
              <div>
                <label
                  htmlFor="forgot-password-email"
                  className="mb-[4px] block text-left font-body text-[16px] text-body-text"
                >
                  {t("forgotPassword.email")}
                </label>

                <input
                  id="forgot-password-email"
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

              {/*Error del backend*/}
              {error && (
                <p className="mt-4 text-center font-body text-sm text-danger">
                  {error}
                </p>
              )}

              {/*Mensaje de éxito*/}
              {success && (
                <p className="mt-4 text-center font-body text-sm text-body-text">
                  {t("forgotPassword.success")}
                </p>
              )}

              {/*Botón*/}
              <div className="mx-auto mt-[55px] w-[72%]">
                <Button
                  type="submit"
                  loading={loading}
                  variant="success"
                  className="h-[55px] w-full rounded-xl bg-green-500 font-body text-[17px] font-normal text-white"
                >
                  {loading
                    ? t("forgotPassword.loading")
                    : t("forgotPassword.buttonLabel")}
                </Button>
              </div>

              {/*Volver al Login*/}
              <p className="mt-[35px] text-center">
                <Link
                  to="/login"
                  className="font-link text-[14px] text-heading transition-opacity hover:opacity-70"
                >
                  {t("forgotPassword.backToLogin")}
                </Link>
              </p>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

export default ForgotPasswordPage;
