import { useState } from "react";
import { useTranslation } from "react-i18next";
import { XIcon } from "@animateicons/react/lucide";
import Select from "./ui/Select.tsx";

import { parentService } from "../services/parent";
import { notify } from "../utils/notifications.ts";
import { useModalExit } from "../hooks/useModalExit.ts";
import { validateEmail, validateRequired } from "../utils/validators.ts";

import type { Parent, ParentLanguage, ParentRequest } from "../types/parent";

interface ParentFormModalProps {
  onClose: () => void;
  onCreated: () => void | Promise<void>;
  parent?: Parent;
}

// Idiomas disponibles
const languages: ParentLanguage[] = ["es", "en", "fr"];

function ParentFormModal({
  onClose,
  onCreated,
  parent,
}: Readonly<ParentFormModalProps>) {
  const { t } = useTranslation();
  const { closing, requestClose } = useModalExit(onClose);

  // Si existe un padre, el modal está en modo edición
  const isEditing = Boolean(parent);

  // Datos del formulario
  const [firstName, setFirstName] = useState(parent?.firstName ?? "");
  const [lastName, setLastName] = useState(parent?.lastName ?? "");
  const [identification, setIdentification] = useState(
    parent?.identification ?? "",
  );
  const [email, setEmail] = useState(parent?.email ?? "");
  const [phoneNumber, setPhoneNumber] = useState(parent?.phoneNumber ?? "");
  const [address, setAddress] = useState(parent?.address ?? "");
  const [language, setLanguage] = useState<ParentLanguage>(
    parent?.language ?? "es",
  );

  // Estado del formulario
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({});

  const clearFieldError = (field: string) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      return { ...current, [field]: null };
    });
  };

  // Guarda o actualiza el padre
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const errors: Record<string, string | null> = {
      firstName: validateRequired(firstName, t("admin.parents.firstName"), t),
      lastName: validateRequired(lastName, t("admin.parents.lastName"), t),
      identification: validateRequired(identification, t("admin.parents.identification"), t),
      phoneNumber: validateRequired(phoneNumber, t("admin.parents.phoneNumber"), t),
      email: validateRequired(email, t("admin.parents.email"), t) ?? validateEmail(email, t),
      address: validateRequired(address, t("admin.parents.address"), t),
    };

    setFieldErrors(errors);

    if (Object.values(errors).some((message) => message !== null)) return;

    setSaving(true);
    setError(null);

    const data: ParentRequest = {
      identification,
      email,
      phoneNumber,
      address,
      firstName,
      lastName,
      language,
    };

    try {
      // Si existe un padre, lo actualiza
      if (parent) {
        await parentService.update(parent.id, data);
      } else {
        // Si no existe, crea uno nuevo
        await parentService.create(data);
      }

      // Actualiza la lista de padres
      await onCreated();

      notify.success(
        isEditing
          ? t("admin.parents.updateSuccessToastTitle")
          : t("admin.parents.createSuccessToastTitle"),
      );

      // Cierra el modal
      requestClose();
    } catch (error) {
      console.error("Error al guardar el padre:", error);

      const errorMessage = isEditing
        ? t("admin.parents.updateError")
        : t("admin.parents.createError");

      setError(errorMessage);

      notify.error({
        title: isEditing
          ? t("admin.parents.updateErrorToastTitle")
          : t("admin.parents.createErrorToastTitle"),
        description: errorMessage,
      });
    } finally {
      setSaving(false);
    }
  };

  const idleSaveLabel = isEditing
    ? t("admin.parents.saveChanges")
    : t("admin.parents.save");

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto scrollbar-none bg-black/50 p-[16px] md:p-[30px]">
      <button
        type="button"
        tabIndex={-1}
        aria-label={t("admin.parents.cancel")}
        className="absolute inset-0 size-full cursor-default"
        onClick={requestClose}
      />

      <form
        onSubmit={handleSubmit}
        className={`relative mx-auto w-full max-w-[820px] rounded-[20px] border border-neutral-200 bg-white p-lg shadow-lg md:p-xl ${closing ? 'animate-[modal-out_0.32s_ease-in]' : 'animate-[modal-in_0.32s_ease-out]'}`}
        noValidate
      >
        <div className="flex items-center justify-between gap-md">
          <h2 className="m-0 font-heading text-2xl font-bold text-heading">
            {isEditing
              ? t("admin.parents.editTitle")
              : t("admin.parents.addTitle")}
          </h2>

          <button
            type="button"
            onClick={requestClose}
            aria-label={t("admin.parents.cancel")}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-heading shadow-sm transition hover:bg-neutral-100"
          >
            <XIcon size={20} />
          </button>
        </div>

        <div className="mt-lg grid gap-md md:grid-cols-2">
          <label className="font-body text-body-sm font-semibold text-heading">
            {t("admin.parents.firstName")}
            <input
              type="text"
              value={firstName}
              onChange={(e) => { setFirstName(e.target.value); clearFieldError("firstName"); }}
              placeholder={t("admin.parents.firstNamePlaceholder")}
              className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
            />
            {fieldErrors.firstName && (
              <span className="mt-xs block font-body text-body-sm font-normal text-danger">{fieldErrors.firstName}</span>
            )}
          </label>

          <label className="font-body text-body-sm font-semibold text-heading">
            {t("admin.parents.lastName")}
            <input
              type="text"
              value={lastName}
              onChange={(e) => { setLastName(e.target.value); clearFieldError("lastName"); }}
              placeholder={t("admin.parents.lastNamePlaceholder")}
              className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
            />
            {fieldErrors.lastName && (
              <span className="mt-xs block font-body text-body-sm font-normal text-danger">{fieldErrors.lastName}</span>
            )}
          </label>

          <label className="font-body text-body-sm font-semibold text-heading">
            {t("admin.parents.identification")}
            <input
              type="text"
              value={identification}
              onChange={(e) => { setIdentification(e.target.value); clearFieldError("identification"); }}
              placeholder={t("admin.parents.identificationPlaceholder")}
              className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
            />
            {fieldErrors.identification && (
              <span className="mt-xs block font-body text-body-sm font-normal text-danger">{fieldErrors.identification}</span>
            )}
          </label>

          <label className="font-body text-body-sm font-semibold text-heading">
            {t("admin.parents.phoneNumber")}
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => { setPhoneNumber(e.target.value); clearFieldError("phoneNumber"); }}
              placeholder={t("admin.parents.phonePlaceholder")}
              className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
            />
            {fieldErrors.phoneNumber && (
              <span className="mt-xs block font-body text-body-sm font-normal text-danger">{fieldErrors.phoneNumber}</span>
            )}
          </label>

          <label className="font-body text-body-sm font-semibold text-heading md:col-span-2">
            {t("admin.parents.email")}
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearFieldError("email"); }}
              placeholder={t("admin.parents.emailPlaceholder")}
              className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
            />
            {fieldErrors.email && (
              <span className="mt-xs block font-body text-body-sm font-normal text-danger">{fieldErrors.email}</span>
            )}
          </label>

          <label className="font-body text-body-sm font-semibold text-heading md:col-span-2">
            {t("admin.parents.address")}
            <textarea
              value={address}
              onChange={(e) => { setAddress(e.target.value); clearFieldError("address"); }}
              rows={3}
              placeholder={t("admin.parents.addressPlaceholder")}
              className="mt-xs w-full resize-none rounded-xl border border-neutral-200 bg-white p-md font-normal outline-none focus:border-heading"
            />
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
            </div>
          </label>
        </div>

        {error && (
          <p className="mt-md rounded-xl bg-red-50 p-md font-body text-body-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-lg flex flex-wrap justify-end gap-sm">
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
            disabled={saving}
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
