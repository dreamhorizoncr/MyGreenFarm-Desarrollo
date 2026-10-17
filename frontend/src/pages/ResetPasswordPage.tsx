import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import TextField from '../components/ui/TextField.tsx'
import AuthButton from '../components/ui/AuthButton.tsx'
import AuthLayout from '../layout/AuthLayout.tsx'
import { useResetPassword } from '../hooks/useResetPassword.ts'
import { validatePassword } from '../utils/validators.ts'
import { notify } from '../utils/notifications.ts'
import { userStorage } from '../utils/userStorage.ts'
import i18n from '../i18n/index.ts'

function ResetPasswordPage() {
  const { t } = useTranslation();
  const isAuthenticated = !!userStorage.getUser();
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
        : t('resetPassword.passwordMismatch')
    setConfirmValidationError(confirmErrorMessage)

    if (passwordErrorMessage || confirmErrorMessage) return;

    await submitResetPassword(
      { token, newPassword },
      () => {
        notify.success({
          title: t('resetPassword.successToastTitle'),
          description: t('resetPassword.success'),
        });
      },
      () => {
        notify.error({
          title: t('resetPassword.errorToastTitle'),
          description: t('resetPassword.errorToastDescription'),
        });
      },
    );
  };

  return (
    <AuthLayout overtitle={t('resetPassword.overtitle')} closeTo={isAuthenticated ? '/profile' : '/login'}>
      <h2 className="mb-[50px] text-left font-heading text-h1 leading-none text-heading">
        {t('resetPassword.title')}
      </h2>

      {!token ? (
        <div className="text-center">
          <p className="mb-[35px] font-body text-body-sm leading-[1.7] text-body-text">
            {t('resetPassword.missingToken')}
          </p>

          <Link
            to="/forgot-password"
            className="font-link text-body-sm text-heading transition-opacity hover:opacity-70"
          >
            {t('resetPassword.requestNewLink')}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleResetPassword} noValidate>
          <TextField
            id="reset-password-new"
            type="password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value)

              if (passwordValidationError) {
                setPasswordValidationError(null)
              }
            }}
            label={t('resetPassword.newPassword')}
            error={passwordValidationError}
          />

          <div className="mt-[35px]">
            <TextField
              id="reset-password-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)

                if (confirmValidationError) {
                  setConfirmValidationError(null)
                }
              }}
              label={t('resetPassword.confirmPassword')}
              error={confirmValidationError}
            />
          </div>

          {error && (
            <p className="mt-4 text-center font-body text-body-sm text-danger">
              {error}
            </p>
          )}

          {success && (
            <p className="mt-5 text-center font-body text-body-sm text-body-text">
              {t('resetPassword.success')}
            </p>
          )}

          {!success && (
            <div className="mx-auto mt-[50px] w-[72%]">
              <AuthButton loading={loading}>
                {loading
                  ? t('resetPassword.loading')
                  : t('resetPassword.buttonLabel')}
              </AuthButton>
            </div>
          )}

          <p className="mt-[35px] text-center">
            <Link
              to={isAuthenticated ? '/profile' : '/login'}
              className="font-link text-body-sm text-heading transition-opacity hover:opacity-70"
            >
              {isAuthenticated ? t('resetPassword.backToProfile') : t('resetPassword.backToLogin')}
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  )
}

export default ResetPasswordPage
