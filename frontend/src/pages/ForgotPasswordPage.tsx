import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import TextField from "../components/ui/TextField.tsx";
import AuthButton from "../components/ui/AuthButton.tsx";
import AuthLayout from "../layout/AuthLayout.tsx";
import { useForgotPassword } from "../hooks/useForgotPassword.ts";
import { validateEmail } from "../utils/validators.ts";
import { notify } from "../utils/notifications.ts";
import { userStorage } from "../utils/userStorage.ts";
import i18n from "../i18n/index.ts";

function ForgotPasswordPage() {
  const { t } = useTranslation();
  const isAuthenticated = !!userStorage.getUser();
  const [email, setEmail] = useState("");
  const [emailValidationError, setEmailValidationError] = useState<
    string | null
  >(null);

  const { submitForgotPassword, loading, error, success } = useForgotPassword();

  useEffect(() => {
    if (emailValidationError) {
      setEmailValidationError(validateEmail(email, t));
    }
  }, [i18n.language]);

  const handleForgotPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const emailErrorMessage = validateEmail(email, t);

    setEmailValidationError(emailErrorMessage);

    if (emailErrorMessage) return;

    await submitForgotPassword(
      { email },
      () => {
        notify.success({
          title: t("forgotPassword.successToastTitle"),
          description: t("forgotPassword.success"),
        });
      },
      (message) => {
        notify.error({
          title: t("forgotPassword.errorToastTitle"),
          description: message,
        });
      },
    );
  };

  return (
    <AuthLayout
      overtitle={t("forgotPassword.overtitle")}
      closeTo={isAuthenticated ? "/profile" : "/login"}
      contentClassName="max-w-[303px] md:max-w-[430px]"
    >
      <h2 className="mb-[28px] text-left font-heading text-h1 leading-none text-heading md:mb-[45px]">
        {t("forgotPassword.title")}
      </h2>

      <p className="mb-[36px] text-left font-body text-body-sm leading-[1.5] text-body-text md:mb-[50px] md:text-body-sm md:leading-[1.7]">
        {t("forgotPassword.description")}
      </p>

      <form onSubmit={handleForgotPassword} noValidate>
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

        {error && (
          <p className="mt-4 text-center font-body text-body-sm text-danger">
            {error}
          </p>
        )}

        {success && (
          <p className="mt-4 text-center font-body text-body-sm text-body-text">
            {t("forgotPassword.success")}
          </p>
        )}

        <div className="mx-auto mt-[30px] w-[209px] md:mt-[55px] md:w-[72%]">
          <AuthButton loading={loading}>
            {loading
              ? t("forgotPassword.loading")
              : t("forgotPassword.buttonLabel")}
          </AuthButton>
        </div>

      </form>
    </AuthLayout>
  );
}

export default ForgotPasswordPage
