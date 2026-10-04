import { useState, useEffect, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ArrowRightIcon } from "@animateicons/react/lucide";
import PasswordInput from "../components/ui/PasswordInput.tsx";
import TextField from "../components/ui/TextField.tsx";
import AuthButton from "../components/ui/AuthButton.tsx";
import AuthLayout from "../layout/AuthLayout.tsx";
import { useRegister } from "../hooks/useRegister.ts";
import {
  validateEmail,
  validatePassword,
  validateRequired,
} from "../utils/validators.ts";
import { notify } from "../utils/notifications.ts";
import { userStorage } from "../utils/userStorage.ts";
import i18n from "../i18n/index.ts";

function SignUpPage() {
  const { t } = useTranslation();
  const { submitRegister, loading, error, success } = useRegister();
  const isAdminAddingTeacher = !!userStorage.getUser();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [birthday, setBirthday] = useState("");

  const [firstNameValidationError, setFirstNameValidationError] = useState<
    string | null
  >(null);
  const [lastNameValidationError, setLastNameValidationError] = useState<
    string | null
  >(null);
  const [emailValidationError, setEmailValidationError] = useState<
    string | null
  >(null);
  const [passwordValidationError, setPasswordValidationError] = useState<
    string | null
  >(null);
  const [roleValidationError, setRoleValidationError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (firstNameValidationError)
      setFirstNameValidationError(
        validateRequired(firstName, t("signup.firstName"), t),
      );
    if (lastNameValidationError)
      setLastNameValidationError(
        validateRequired(lastName, t("signup.lastName"), t),
      );
    if (emailValidationError) setEmailValidationError(validateEmail(email, t));
    if (passwordValidationError)
      setPasswordValidationError(validatePassword(password, t));
    if (roleValidationError) {
      setRoleValidationError(validateRequired(role, t("signup.role"), t));
    }
  }, [i18n.language]);

  const handleSignUp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const firstNameErrorMessage = validateRequired(
      firstName,
      t("signup.firstName"),
      t,
    );
    const lastNameErrorMessage = validateRequired(
      lastName,
      t("signup.lastName"),
      t,
    );
    const emailErrorMessage = validateEmail(email, t);
    const passwordErrorMessage = validatePassword(password, t);
    const roleErrorMessage = validateRequired(role, t("signup.role"), t);

    setFirstNameValidationError(firstNameErrorMessage);
    setLastNameValidationError(lastNameErrorMessage);
    setEmailValidationError(emailErrorMessage);
    setPasswordValidationError(passwordErrorMessage);
    setRoleValidationError(roleErrorMessage);

    if (
      firstNameErrorMessage ||
      lastNameErrorMessage ||
      emailErrorMessage ||
      passwordErrorMessage ||
      roleErrorMessage
    )
      return;

    void submitRegister(
      { firstName, lastName, email, password, role, birthday: role === "TEACHER" && birthday ? birthday : undefined },
      () => {
        notify.success({
          title: t("signup.successToastTitle"),
          description: t("signup.success"),
        });
      },
      (message) => {
        notify.error({
          title: t("signup.errorToastTitle"),
          description: message,
        });
      },
    );
  };

  const roleOptions = [
    { value: 'TEACHER', label: t('signup.teacherRole') },
    { value: 'ADMIN', label: t('signup.adminRole') }
  ] as const;

  return (
    <AuthLayout
      overtitle={t("signup.overtitle")}
      closeTo={isAdminAddingTeacher ? "/admin/users" : "/login"}
      containerClassName="md:max-w-[1250px]"
      rightPanelClassName="flex flex-col overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-[15px] pb-[28px] pt-[65px] md:px-[55px] md:py-[45px]"
      contentClassName="my-auto w-full mx-auto max-w-[303px] md:max-w-[560px]"
    >
      {/* Título */}
      <h2 className="mb-[32px] text-left font-heading text-[28px] leading-none text-heading md:mb-[45px] md:text-h1">
        {t("signup.title")}
      </h2>

      {success ? (
        /* Mensaje de éxito */
        <div className="text-center">
          <p className="font-body text-body-sm text-body-text md:text-body">
            {t("signup.success")}
          </p>

          <Link
            to="/login"
            className="mt-5 inline-block font-link text-body-sm text-heading transition-opacity hover:opacity-70 md:text-body-sm"
          >
            {t("signup.goToLogin")}
          </Link>
        </div>
      ) : (
        /* Formulario */
        <form onSubmit={handleSignUp} noValidate>
          {/* Nombre y Apellido */}
          <div className="grid grid-cols-2 gap-[30px] md:gap-[55px]">
            {/* Nombre */}
            <TextField
              id="signup-firstname"
              type="text"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);

                if (firstNameValidationError) {
                  setFirstNameValidationError(null);
                }
              }}
              label={t("signup.firstName")}
              error={firstNameValidationError}
            />

            {/* Apellido */}
            <TextField
              id="signup-lastname"
              type="text"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);

                if (lastNameValidationError) {
                  setLastNameValidationError(null);
                }
              }}
              label={t("signup.lastName")}
              error={lastNameValidationError}
            />
          </div>

          {/* Correo y Contraseña */}
          <div className="mt-[26px] grid grid-cols-2 items-end gap-[30px] md:mt-[32px] md:items-start md:gap-[55px]">
            {/* Correo */}
            <TextField
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);

                if (emailValidationError) {
                  setEmailValidationError(null);
                }
              }}
              label={t("signup.email")}
              error={emailValidationError}
            />

            {/* Contraseña */}
            <TextField
              id="signup-password"
              label={t("signup.password")}
              error={passwordValidationError}
            >
              <PasswordInput
                id="signup-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);

                  if (passwordValidationError) {
                    setPasswordValidationError(null);
                  }
                }}
                className="h-9.5 w-full border-b border-neutral-300 bg-transparent px-0 font-body text-body-sm text-body-text outline-none transition focus:border-green-500 md:text-body-sm"
                showAriaLabel={t("passwordInput.showPassword")}
                hideAriaLabel={t("passwordInput.hidePassword")}
              />
            </TextField>
          </div>

          {/*Rol*/}
          <fieldset className="mt-[32px] text-left">
            <legend className="mb-[4px] font-body text-body text-body-text">
              {t('signup.role')}
            </legend>

            <div className="flex flex-wrap gap-sm">
              {roleOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-center gap-xs rounded-full border px-lg py-sm font-body text-body-sm transition-colors ${role === option.value
                    ? 'border-green-500 bg-green-500/10 text-heading'
                    : 'border-neutral-300 bg-white text-body-text'
                    }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={option.value}
                    checked={role === option.value}
                    onChange={(e) => {
                      setRole(e.target.value)

                      if (e.target.value !== "TEACHER") {
                        setBirthday("");
                      }

                      if (roleValidationError) {
                        setRoleValidationError(null)
                      }
                    }}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              ))}
            </div>

            {roleValidationError && (
              <p className="mt-2 font-body text-body-sm text-danger">
                {roleValidationError}
              </p>
            )}
          </fieldset>

          {/* Birthday */}
          {role === "TEACHER" && (
            <div className="mt-[26px] md:mt-[32px] md:w-[calc(50%-27.5px)]">
              <TextField
                id="signup-birthday"
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                label={t("signup.birthdayOptional")}
                error={null}
              />
            </div>
          )}
          {/* Error backend */}
          {error && (
            <p className="mt-4 text-center font-body text-body-sm text-danger">
              {error}
            </p>
          )}

          {/* Botón */}
          <div className="mx-auto mt-[30px] w-[209px] md:mt-[38px] md:w-[70%]">
            <AuthButton loading={loading}>
              {loading ? t("signup.loading") : t("signup.buttonLabel")}
            </AuthButton>
          </div>

          {/*Regresar al Login*/}
        </form>
      )}
    </AuthLayout>
  );
}

export default SignUpPage
