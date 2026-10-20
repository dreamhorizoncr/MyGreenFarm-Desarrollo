import { useState, type InputHTMLAttributes } from "react";
import { useTranslation } from "react-i18next";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import Select from "./ui/Select.tsx";
import CountrySelect from "./ui/CountrySelect.tsx";
import { phoneLabels } from "../utils/phoneLabels.ts";
import { normalizeIdentification, toInternationalPhone } from "../utils/contactFormat.ts";

import { parentService } from "../services/parent";
import { notify, notifyError } from "../utils/notifications.ts";
import { getErrorField, getErrorMessage } from "../utils/error.ts";
import { useModalExit } from "../hooks/useModalExit.ts";
import { validateEmail, validateIdentification, validatePhoneNumber, validateRequired, validateSafeText } from "../utils/validators.ts";

import type { Parent, ParentLanguage, ParentRequest } from "../types/parent";
import ModalCloseButton from "./ui/ModalCloseButton.tsx";
import FieldHint from "./ui/FieldHint.tsx";

interface ParentFormModalProps {
  onClose: () => void;
  onCreated: () => void | Promise<void>;
  parent?: Parent;
}

const languages: ParentLanguage[] = ["es", "en", "fr"];

function ParentPhoneInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-full w-full bg-transparent pl-2 font-body text-body-sm font-normal text-body-text-dark outline-none"
    />
  );
}

function ParentFormModal({
  onClose,
  onCreated,
  parent,
}: Readonly<ParentFormModalProps>) {
  const { t, i18n } = useTranslation();
  const { closing, requestClose } = useModalExit(onClose);

  const isEditing = Boolean(parent);

  const [firstName, setFirstName] = useState(parent?.firstName ?? "");
  const [lastName, setLastName] = useState(parent?.lastName ?? "");
  const [identification, setIdentification] = useState(
    parent?.identification ?? "",
  );
  const [email, setEmail] = useState(parent?.email ?? "");
  const [initialPhone] = useState(() => toInternationalPhone(parent?.phoneNumber));
  const [phoneNumber, setPhoneNumber] = useState(initialPhone.value);
  const [phoneCountry, setPhoneCountry] = useState<string | undefined>(initialPhone.country);
  const [address, setAddress] = useState(parent?.address ?? "");
  const [language, setLanguage] = useState<ParentLanguage>(
    parent?.language ?? "es",
  );
  // Estado isActive (por defecto true si es nuevo, o el valor actual si se edita)
  const [isActive, setIsActive] = useState<boolean>(parent?.isActive ?? true);

  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({});

  const clearFieldError = (field: string) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      return { ...current, [field]: null };
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const cleanIdentification = normalizeIdentification(identification);
    setIdentification(cleanIdentification);

    const errors: Record<string, string | null> = {
      firstName: validateRequired(firstName, t("admin.parents.firstName"), t) ?? validateSafeText(firstName, t),
      lastName: validateRequired(lastName, t("admin.parents.lastName"), t) ?? validateSafeText(lastName, t),
      identification: validateRequired(cleanIdentification, t("admin.parents.identification"), t) ?? validateIdentification(cleanIdentification, t),
      phoneNumber: validateRequired(phoneNumber, t("admin.parents.phoneNumber"), t)
        ?? (phoneCountry ? validatePhoneNumber(phoneNumber, t) : t("validation.countryRequired")),
      email: validateRequired(email, t("admin.parents.email"), t) ?? validateEmail(email, t),
      address: validateRequired(address, t("admin.parents.address"), t) ?? validateSafeText(address, t),
    };

    setFieldErrors(errors);

    if (Object.values(errors).some((message) => message !== null)) return;

    setSaving(true);

    const data: ParentRequest = {
      identification: cleanIdentification,
      email,
      phoneNumber,
      address,
      firstName,
      lastName,
      language,
      isActive,
    };

    try {
      if (parent) {
        await parentService.update(parent.id, data);
      } else {
        await parentService.create(data);
      }

      await onCreated();

      notify.success(
        isEditing
          ? t("admin.parents.updateSuccessToastTitle")
          : t("admin.parents.createSuccessToastTitle"),
      );

      requestClose();
    } catch (error) {
      console.error("Error al guardar el padre:", error);

      const field = getErrorField(error);
      if (field) setFieldErrors((current) => ({ ...current, [field]: getErrorMessage(error) }));

      notifyError(
        isEditing ? t("admin.parents.updateErrorToastTitle") : t("admin.parents.createErrorToastTitle"),
        error,
      );
    } finally {
      setSaving(false);
    }
  };

  const idleSaveLabel = isEditing
    ? t("admin.parents.saveChanges")
    : t("admin.parents.save");

  return (
    <div className="text-left fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/50 p-[16px] md:p-[30px]">
      <button
        type="button"
        tabIndex={-1}
        aria-label={t("admin.parents.cancel")}
        className="absolute inset-0 size-full cursor-default"
        onClick={requestClose}
      />

      <form
        onSubmit={handleSubmit}
        className={`relative mx-auto max-h-full modal-scroll w-full max-w-[820px] rounded-[20px] border border-neutral-200 bg-white p-lg shadow-lg md:p-xl ${closing ? 'animate-[modal-out_0.32s_ease-in]' : 'animate-[modal-in_0.32s_ease-out]'}`}
        noValidate
      >
        <div className="flex items-center justify-between gap-md">
          <h2 className="m-0 font-heading text-h4 font-bold text-heading">
            {isEditing
              ? t("admin.parents.editTitle")
              : t("admin.parents.addTitle")}
          </h2>

          <ModalCloseButton
            onClick={requestClose}
            aria-label={t("admin.parents.cancel")}
          />
        </div>

        <div className="mt-lg grid grid-cols-1 gap-md md:grid-cols-2">
          <label className="font-body text-body-sm font-semibold text-heading">
            {t("admin.parents.firstName")}
            <input
              type="text"
              autoComplete="off"
              value={firstName}
              onChange={(e) => { setFirstName(e.target.value); clearFieldError("firstName"); }}
              placeholder={t("fields.person.firstName.placeholder")}
              className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
            />
            <FieldHint>{t("fields.person.firstName.hint")}</FieldHint>
            {fieldErrors.firstName && (
              <span className="mt-xs block font-body text-body-sm font-normal text-danger">{fieldErrors.firstName}</span>
            )}
          </label>

          <label className="font-body text-body-sm font-semibold text-heading">
            {t("admin.parents.lastName")}
            <input
              type="text"
              autoComplete="off"
              value={lastName}
              onChange={(e) => { setLastName(e.target.value); clearFieldError("lastName"); }}
              placeholder={t("fields.person.lastName.placeholder")}
              className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
            />
            <FieldHint>{t("fields.person.lastName.hint")}</FieldHint>
            {fieldErrors.lastName && (
              <span className="mt-xs block font-body text-body-sm font-normal text-danger">{fieldErrors.lastName}</span>
            )}
          </label>

          <label className="font-body text-body-sm font-semibold text-heading">
            {t("admin.parents.identification")}
            <input
              type="text"
              autoComplete="off"
              value={identification}
              onChange={(e) => { setIdentification(e.target.value); clearFieldError("identification"); }}
              placeholder={t("fields.parent.identification.placeholder")}
              className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
            />
            <FieldHint>{t("fields.parent.identification.hint")}</FieldHint>
            {fieldErrors.identification && (
              <span className="mt-xs block font-body text-body-sm font-normal text-danger">{fieldErrors.identification}</span>
            )}
          </label>

          <div className="font-body text-body-sm font-semibold text-heading">
            <label htmlFor="parent-phone">{t("admin.parents.phoneNumber")}</label>
            <PhoneInput
              id="parent-phone"
              autoComplete="off"
              placeholder={t("fields.parent.phone.placeholder")}
              className="mt-xs h-11 rounded-xl border border-neutral-200 bg-white px-md focus-within:border-heading"
              value={phoneNumber}
              onChange={(next = "") => { setPhoneNumber(next); clearFieldError("phoneNumber"); }}
              onCountryChange={(country) => { setPhoneCountry(country); clearFieldError("phoneNumber"); }}
              inputComponent={ParentPhoneInput}
              countrySelectComponent={CountrySelect}
              labels={phoneLabels(i18n.language)}
            />
            <FieldHint>{t("fields.parent.phone.hint")}</FieldHint>
            {fieldErrors.phoneNumber && (
              <span className="mt-xs block font-body text-body-sm font-normal text-danger">{fieldErrors.phoneNumber}</span>
            )}
          </div>

          <label className="font-body text-body-sm font-semibold text-heading md:col-span-2">
            {t("admin.parents.email")}
            <input
              type="email"
              autoComplete="off"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearFieldError("email"); }}
              placeholder={t("fields.parent.email.placeholder")}
              className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
            />
            <FieldHint>{t("fields.parent.email.hint")}</FieldHint>
            {fieldErrors.email && (
              <span className="mt-xs block font-body text-body-sm font-normal text-danger">{fieldErrors.email}</span>
            )}
          </label>

          <label className="font-body text-body-sm font-semibold text-heading md:col-span-2">
            {t("admin.parents.address")}
            <textarea
              value={address}
              autoComplete="off"
              onChange={(e) => { setAddress(e.target.value); clearFieldError("address"); }}
              rows={3}
              placeholder={t("fields.parent.address.placeholder")}
              className="mt-xs w-full resize-none rounded-xl border border-neutral-200 bg-white p-md font-normal outline-none focus:border-heading"
            />
            <FieldHint>{t("fields.parent.address.hint")}</FieldHint>
            {fieldErrors.address && (
              <span className="mt-xs block font-body text-body-sm font-normal text-danger">{fieldErrors.address}</span>
            )}
          </label>

          <label className="font-body text-body-sm font-semibold text-heading">
            {t("admin.parents.language")}
            <div className="mt-xs">
              <Select
                value={language}
                onChange={(value) => setLanguage(value as ParentLanguage)}
                options={languages.map((lang) => ({
                  value: lang,
                  label: t(`admin.parents.languages.${lang}`),
                }))}
                className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-md"
                aria-label={t("admin.parents.language")}
              />
              <FieldHint>{t("fields.parent.language.hint")}</FieldHint>
            </div>
          </label>

          {/* Switch estilizado para Activo / Inactivo */}
          <div className="md:col-span-2 flex items-center gap-md rounded-xl border border-neutral-200 bg-neutral-50 p-md">
            <label className="relative inline-flex items-center cursor-pointer">
              <span className="sr-only">{t("admin.parents.isActive")}</span>
              <input
                type="checkbox"
                autoComplete="off"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
            </label>
            <div>
              <span className="block font-body text-body-sm font-semibold text-heading">
                {t("admin.parents.isActive")}
              </span>
              <span className="text-caption text-neutral-500">
                {t("admin.parents.isActiveDescription")}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-lg flex justify-end gap-md *:flex-1">
          <button
            type="button"
            onClick={requestClose}
            disabled={saving}
            className="h-11 rounded-full border border-green-500 px-lg font-body text-body-sm font-semibold text-heading transition-colors hover:bg-green-50 disabled:opacity-50"
          >
            {t("admin.parents.cancel")}
          </button>

          <button
            type="submit"
            disabled={saving || !firstName.trim() || !lastName.trim() || !identification.trim() || !phoneNumber.trim() || !email.trim() || !address.trim()}
            className="h-11 rounded-full bg-orange-500 px-lg font-body text-body-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? t("admin.parents.saving") : idleSaveLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ParentFormModal;