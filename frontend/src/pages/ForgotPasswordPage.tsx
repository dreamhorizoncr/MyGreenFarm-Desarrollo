// Esto de aquí es para la pantalla de recuperar contraseña.
import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import TextField from "../components/ui/TextField.tsx";
import AuthButton from "../components/ui/AuthButton.tsx";
import AuthLayout from "../layout/AuthLayout.tsx";
import { useForgotPassword } from "../hooks/useForgotPassword.ts";
import { validateEmail } from "../utils/validators.ts";
import i18n from "../i18n/index.ts";

function ForgotPasswordPage() {
  const { t } = useTranslation();
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
    <AuthLayout
      overtitle={t("forgotPassword.overtitle")}
      contentClassName="max-w-[303px] md:max-w-[430px]"
    >
      {/* Título */}
      <h2 className="mb-[28px] text-center font-heading text-[28px] leading-none text-heading md:mb-[45px] md:text-[42px]">
        {t("forgotPassword.title")}
      </h2>

      {/* Descripción */}
      <p className="mb-[36px] text-center font-body text-[13px] leading-[1.5] text-body-text md:mb-[50px] md:text-[15px] md:leading-[1.7]">
        {t("forgotPassword.description")}
      </p>

      {/* Formulario */}
      <form onSubmit={handleForgotPassword} noValidate>
        {/* Correo */}
        <TextField
          id="forgot-password-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);

            if (emailValidationError) {
              setEmailValidationError(null);
            }
          }}
          label={t("forgotPassword.email")}
          error={emailValidationError}
        />

        {/* Error del backend */}
        {error && (
          <p className="mt-4 text-center font-body text-sm text-danger">
            {error}
          </p>
        )}

        {/* Mensaje de éxito */}
        {success && (
          <p className="mt-4 text-center font-body text-sm text-body-text">
            {t("forgotPassword.success")}
          </p>
        )}

        {/* Botón */}
        <div className="mx-auto mt-[30px] w-[209px] md:mt-[55px] md:w-[72%]">
          <AuthButton loading={loading}>
            {loading
              ? t("forgotPassword.loading")
              : t("forgotPassword.buttonLabel")}
          </AuthButton>
        </div>

        {/* Volver al Login */}
        <p className="mt-[20px] text-center md:mt-[35px]">
          <Link
            to="/login"
            className="font-link text-[12px] text-heading transition-opacity hover:opacity-70 md:text-[14px]"
          >
            {t("forgotPassword.backToLogin")}
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default ForgotPasswordPage
