// Esto de aquí es para la pantalla de restablecer contraseña (la que abre el link del correo).
import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import Button from "../components/ui/Button.tsx";
import LanguageSwitcher from "../components/LanguageSwitcher.tsx";
import { useResetPassword } from "../hooks/useResetPassword.ts";
import { validatePassword } from "../utils/validators.ts";
import i18n from "../i18n/index.ts";
import LandscapeIlustration from "../assets/imgs/IlustrationAuth.png";

function ResetPasswordPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordValidationError, setPasswordValidationError] = useState<
    string | null
  >(null);
  const [confirmValidationError, setConfirmValidationError] = useState<
    string | null
  >(null);

  const { submitResetPassword, loading, error, success } = useResetPassword();

  useEffect(() => {
    if (passwordValidationError) {
      setPasswordValidationError(validatePassword(newPassword, t));
    }
  }, [i18n.language]);

  const handleResetPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!token) return;

    const passwordErrorMessage = validatePassword(newPassword, t);
    setPasswordValidationError(passwordErrorMessage);

    const confirmErrorMessage =
      confirmPassword === newPassword
        ? null
        : t("resetPassword.passwordMismatch");
    setConfirmValidationError(confirmErrorMessage);

    if (passwordErrorMessage || confirmErrorMessage) return;

    await submitResetPassword({ token, newPassword });
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
              {t("resetPassword.overtitle")}
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
            <h2 className="mb-[50px] text-center font-heading text-[42px] leading-none text-heading">
              {t("resetPassword.title")}
            </h2>

            {!token ? (
              /*Sin Token*/
              <div className="text-center">
                <p className="mb-[35px] font-body text-[15px] leading-[1.7] text-body-text">
                  {t("resetPassword.missingToken")}
                </p>

                <Link
                  to="/forgot-password"
                  className="font-link text-[14px] text-heading transition-opacity hover:opacity-70"
                >
                  {t("resetPassword.requestNewLink")}
                </Link>
              </div>
            ) : (
              /*Formulario*/
              <form onSubmit={handleResetPassword} noValidate>
                {/*Nueva Contraseña*/}
                <div>
                  <label
                    htmlFor="reset-password-new"
                    className="mb-[4px] block text-left font-body text-[16px] text-body-text"
                  >
                    {t("resetPassword.newPassword")}
                  </label>

                  <input
                    id="reset-password-new"
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);

                      if (passwordValidationError) {
                        setPasswordValidationError(null);
                      }
                    }}
                    className="h-[38px] w-full border-b border-neutral-300 bg-transparent px-0 font-body text-[15px] text-body-text outline-none transition focus:border-green-500"
                  />

                  {/*Error de validación*/}
                  {passwordValidationError && (
                    <p className="mt-2 text-left font-body text-sm text-danger">
                      {passwordValidationError}
                    </p>
                  )}
                </div>

                {/*Confirmar Contraseña*/}
                <div className="mt-[35px]">
                  <label
                    htmlFor="reset-password-confirm"
                    className="mb-[4px] block text-left font-body text-[16px] text-body-text"
                  >
                    {t("resetPassword.confirmPassword")}
                  </label>

                  <input
                    id="reset-password-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);

                      if (confirmValidationError) {
                        setConfirmValidationError(null);
                      }
                    }}
                    className="h-[38px] w-full border-b border-neutral-300 bg-transparent px-0 font-body text-[15px] text-body-text outline-none transition focus:border-green-500"
                  />

                  {/*Error de validación*/}
                  {confirmValidationError && (
                    <p className="mt-2 text-left font-body text-sm text-danger">
                      {confirmValidationError}
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
                  <p className="mt-5 text-center font-body text-sm text-body-text">
                    {t("resetPassword.success")}
                  </p>
                )}

                {/*Botón*/}
                {!success && (
                  <div className="mx-auto mt-[50px] w-[72%]">
                    <Button
                      type="submit"
                      loading={loading}
                      variant="success"
                      className="h-[55px] w-full rounded-xl bg-green-500 font-body text-[17px] font-normal text-white"
                    >
                      {loading
                        ? t("resetPassword.loading")
                        : t("resetPassword.buttonLabel")}
                    </Button>
                  </div>
                )}

                {/*Volver al Login*/}
                <p className="mt-[35px] text-center">
                  <Link
                    to="/login"
                    className="font-link text-[14px] text-heading transition-opacity hover:opacity-70"
                  >
                    {t("resetPassword.backToLogin")}
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default ResetPasswordPage;
