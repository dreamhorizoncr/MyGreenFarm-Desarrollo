import { useState, useEffect, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button.tsx";
import LanguageSwitcher from "../components/LanguageSwitcher.tsx";
import { useRegister } from "../hooks/useRegister.ts";
import {
  validateEmail,
  validatePassword,
  validateRequired,
} from "../utils/validators.ts";
import i18n from "../i18n/index.ts";
import loginIlustration from "../assets/imgs/IlustrationAuth.png";

function SignUpPage() {
  const { t } = useTranslation();
  const { submitRegister, loading, error, success } = useRegister();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");

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

    submitRegister({ firstName, lastName, email, password, role });
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
              {t("signup.overtitle")}
            </h1>
          </div>
        </div>

        {/*Panel Derecho*/}
        <div className="relative flex w-full flex-col bg-bg-card px-[55px] py-[45px] md:w-1/2">
          {/*Selector de idioma*/}
          <div className="absolute right-[30px] top-[25px] z-20">
            <LanguageSwitcher />
          </div>

          {/*Contenido*/}
          <div className="mx-auto flex h-full w-full max-w-[490px] flex-col justify-center">
            {/*Título*/}
            <h2 className="mb-[45px] text-center font-heading text-[42px] leading-none text-heading">
              {t("signup.title")}
            </h2>

            {success ? (
              /*Mensaje de éxito*/
              <div className="text-center">
                <p className="font-body text-[16px] text-body-text">
                  {t("signup.success")}
                </p>

                <Link
                  to="/login"
                  className="mt-5 inline-block font-link text-[14px] text-heading transition-opacity hover:opacity-70"
                >
                  {t("signup.goToLogin")}
                </Link>
              </div>
            ) : (
              /*Formulario*/
              <form onSubmit={handleSignUp} noValidate>
                {/*Nombre y Apellido*/}
                <div className="grid grid-cols-2 gap-[55px]">
                  {/*Nombre*/}
                  <div>
                    <label
                      htmlFor="signup-firstname"
                      className="mb-[4px] block text-left font-body text-[16px] text-body-text"
                    >
                      {t("signup.firstName")}
                    </label>

                    <input
                      id="signup-firstname"
                      type="text"
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value);

                        if (firstNameValidationError) {
                          setFirstNameValidationError(null);
                        }
                      }}
                      className="h-[38px] w-full border-b border-neutral-300 bg-transparent px-0 font-body text-[15px] text-body-text outline-none transition focus:border-green-500"
                    />

                    {firstNameValidationError && (
                      <p className="mt-2 text-left font-body text-sm text-danger">
                        {firstNameValidationError}
                      </p>
                    )}
                  </div>

                  {/*Apellido*/}
                  <div>
                    <label
                      htmlFor="signup-lastname"
                      className="mb-[4px] block text-left font-body text-[16px] text-body-text"
                    >
                      {t("signup.lastName")}
                    </label>

                    <input
                      id="signup-lastname"
                      type="text"
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value);

                        if (lastNameValidationError) {
                          setLastNameValidationError(null);
                        }
                      }}
                      className="h-[38px] w-full border-b border-neutral-300 bg-transparent px-0 font-body text-[15px] text-body-text outline-none transition focus:border-green-500"
                    />

                    {lastNameValidationError && (
                      <p className="mt-2 text-left font-body text-sm text-danger">
                        {lastNameValidationError}
                      </p>
                    )}
                  </div>
                </div>

                {/*Correo y Contraseña*/}
                <div className="mt-[32px] grid grid-cols-2 gap-[55px]">
                  {/*Correo*/}
                  <div>
                    <label
                      htmlFor="signup-email"
                      className="mb-[4px] block text-left font-body text-[16px] text-body-text"
                    >
                      {t("signup.email")}
                    </label>

                    <input
                      id="signup-email"
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

                    {emailValidationError && (
                      <p className="mt-2 text-left font-body text-sm text-danger">
                        {emailValidationError}
                      </p>
                    )}
                  </div>

                  {/*Contraseña*/}
                  <div>
                    <label
                      htmlFor="signup-password"
                      className="mb-[4px] block text-left font-body text-[16px] text-body-text"
                    >
                      {t("signup.password")}
                    </label>

                    <input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);

                        if (passwordValidationError) {
                          setPasswordValidationError(null);
                        }
                      }}
                      className="h-[38px] w-full border-b border-neutral-300 bg-transparent px-0 font-body text-[15px] text-body-text outline-none transition focus:border-green-500"
                    />

                    {passwordValidationError && (
                      <p className="mt-2 text-left font-body text-sm text-danger">
                        {passwordValidationError}
                      </p>
                    )}
                  </div>
                </div>

                {/*Rol*/}
                <div className="mx-auto mt-[32px] w-[55%]">
                  <label
                    htmlFor="signup-role"
                    className="mb-[4px] block text-left font-body text-[16px] text-body-text"
                  >
                    {t("signup.role")}
                  </label>

                  <select
                    id="signup-role"
                    value={role}
                    onChange={(e) => {
                      setRole(e.target.value);

                      if (roleValidationError) {
                        setRoleValidationError(null);
                      }
                    }}
                    className="h-[38px] w-full border-b border-neutral-300 bg-transparent px-0 font-body text-[15px] text-body-text outline-none transition focus:border-green-500"
                  >
                    <option value="">{t("signup.selectRole")}</option>

                    <option value="User">{t("signup.userRole")}</option>

                    <option value="Admin">{t("signup.adminRole")}</option>
                  </select>

                  {roleValidationError && (
                    <p className="mt-2 text-left font-body text-sm text-danger">
                      {roleValidationError}
                    </p>
                  )}
                </div>

                {/*Error backend*/}
                {error && (
                  <p className="mt-4 text-center font-body text-sm text-danger">
                    {error}
                  </p>
                )}

                {/*Botón*/}
                <div className="mx-auto mt-[38px] w-[70%]">
                  <Button
                    type="submit"
                    loading={loading}
                    variant="success"
                    className="h-[55px] w-full rounded-xl bg-green-500 font-body text-[17px] font-normal text-white"
                  >
                    {loading ? t("signup.loading") : t("signup.buttonLabel")}
                  </Button>
                </div>

                {/*Regresar al Login*/}
                <p className="mt-[28px] text-center font-body text-[14px] text-body-text">
                  {t("signup.hasAccount")}{" "}
                  <Link
                    to="/login"
                    className="font-link text-heading transition-opacity hover:opacity-70"
                  >
                    {t("signup.goToLogin")}
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

export default SignUpPage;
