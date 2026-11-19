import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Button from "../../components/ui/Button.tsx";
import PasswordInput from "../../components/ui/PasswordInput.tsx";
import TextField from "../../components/ui/TextField.tsx";
import AuthLayout from "../../layout/AuthLayout.tsx";
import { useLogin } from "../../hooks/useLogin.ts";
import { validateEmail, validatePassword } from "../../utils/validators.ts";
import { notify } from "../../utils/notifications.ts";

const FAILED_ATTEMPTS_BEFORE_SUGGESTION = 2;

/** Sign-in page. After two failed attempts it suggests resetting the password. */
function LoginPage() {
  const { t } = useTranslation();
  const { submitLogin, loading, error } = useLogin();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionExpired = searchParams.get("expired") === "true";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showEmailError, setShowEmailError] = useState(false);
  const emailValidationError = showEmailError ? validateEmail(email, t) : null;
  const [showPasswordError, setShowPasswordError] = useState(false);
  const passwordValidationError = showPasswordError ? validatePassword(password, t) : null;

  const handleLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const emailErrorMessage = validateEmail(email, t);
    const passwordErrorMessage = validatePassword(password, t);
    setShowEmailError(emailErrorMessage !== null);
    setShowPasswordError(passwordErrorMessage !== null);
    if (emailErrorMessage || passwordErrorMessage) return;
    void submitLogin(
      { email, password },
      (user) => {
        notify.success({
          title: t("login.successToastTitle"),
          description: t("login.successToastDescription", { name: user.firstName }),
        });
        navigate('/admin/dashboard');
      },
      (message) => {
        notify.error({
          title: t("login.errorToastTitle"),
          description: message,
        });

        const attempts = failedAttempts + 1;
        setFailedAttempts(attempts);
        if (attempts >= FAILED_ATTEMPTS_BEFORE_SUGGESTION) {
          notify.action(
            {
              title: t("login.forgotPasswordSuggestionTitle"),
              description: t("login.forgotPasswordSuggestionDescription"),
            },
            {
              title: t("login.forgotPassword"),
              onClick: () => navigate('/forgot-password'),
            },
          );
        }
      },
    )
  }

  return (
    <AuthLayout
      overtitle={t("login.overtitle")}
      contentClassName="max-w-[303px] md:max-w-[390px]"
    >
      <h2 className="mb-[35px] text-left font-heading text-h3 leading-tight text-heading md:mb-[55px]">
        {t("login.title")}
      </h2>

      {sessionExpired && (
        <p
          role="alert"
          className="mb-4 text-center font-body text-body-sm text-danger"
        >
          {t("common.sessionExpired")}
        </p>
      )}

      <form onSubmit={handleLogin} noValidate>
        <div className="mb-[22px] md:mb-[30px]">
          <TextField
            hint={t("fields.auth.email.hint")}
            placeholder={t("fields.auth.email.placeholder")}
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);

              setShowEmailError(false);
            }}
            label={t("login.email")}
            error={emailValidationError}
          />
        </div>

        <TextField
          hint={t("fields.auth.password.hint")}
          id="login-password"
          label={t("login.password")}
          error={passwordValidationError}
        >
          <PasswordInput
            placeholder={t("fields.auth.password.placeholder")}
            id="login-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);

              setShowPasswordError(false);
            }}
            className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-body text-body-sm text-body-text outline-none transition focus:border-green-500 md:text-body-sm"
            showAriaLabel={t("passwordInput.showPassword")}
            hideAriaLabel={t("passwordInput.hidePassword")}
          />
        </TextField>

        <div className="mt-[12px] text-right md:mt-[15px]">
          <Link
            to="/forgot-password"
            className="inline-flex min-h-6 items-center font-link text-caption text-heading transition-opacity hover:opacity-70 md:text-body-sm"
          >
            {t("login.forgotPassword")}
          </Link>
        </div>

        {error && (
          <p className="mt-4 text-center font-body text-body-sm text-danger">
            {error}
          </p>
        )}

        <div className="mt-[28px] flex justify-center md:mt-[35px]">
          <Button
            type="submit"
            loading={loading}
            disabled={!email.trim() || !password}
            variant="success"
            className="h-11 w-full rounded-full blob-fill bg-orange-500 font-body text-button font-semibold text-white hover:bg-orange-600"
          >
            {loading ? t("login.loading") : t("login.buttonLabel")}
          </Button>
        </div>

        </form>
    </AuthLayout>
  );
}

export default LoginPage;
