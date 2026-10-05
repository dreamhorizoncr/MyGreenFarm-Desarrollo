import { useState } from "react";
import { useTranslation } from "react-i18next";
import { XIcon } from "@animateicons/react/lucide";
import Select from "./ui/Select.tsx";

import { parentService } from "../services/parent";
import { notify } from "../utils/notifications.ts";

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

  // Guarda o actualiza el padre
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

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
      onClose();
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
        onClick={onClose}
      />

      <form
        onSubmit={handleSubmit}
        className="relative mx-auto w-full max-w-[820px] rounded-[20px] border border-neutral-200 bg-white p-lg shadow-lg md:p-xl"
      >
        <div className="flex items-center justify-between gap-md">
          <h2 className="m-0 font-heading text-2xl font-bold text-heading">
            {isEditing
              ? t("admin.parents.editTitle")
              : t("admin.parents.addTitle")}
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label={t("admin.parents.cancel")}
            className="rounded-full p-2xs text-neutral-500 transition-colors hover:bg-neutral-100"
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
              onChange={(e) => setFirstName(e.target.value)}
              required
              placeholder={t("admin.parents.firstNamePlaceholder")}
              className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
            />
          </label>

          <label className="font-body text-body-sm font-semibold text-heading">
            {t("admin.parents.lastName")}
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              placeholder={t("admin.parents.lastNamePlaceholder")}
              className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
            />
          </label>

          <label className="font-body text-body-sm font-semibold text-heading">
            {t("admin.parents.identification")}
            <input
              type="text"
              value={identification}
              onChange={(e) => setIdentification(e.target.value)}
              required
              placeholder={t("admin.parents.identificationPlaceholder")}
              className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
            />
          </label>

          <label className="font-body text-body-sm font-semibold text-heading">
            {t("admin.parents.phoneNumber")}
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              placeholder={t("admin.parents.phonePlaceholder")}
              className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
            />
          </label>

          <label className="font-body text-body-sm font-semibold text-heading md:col-span-2">
            {t("admin.parents.email")}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={t("admin.parents.emailPlaceholder")}
              className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
            />
          </label>

          <label className="font-body text-body-sm font-semibold text-heading md:col-span-2">
            {t("admin.parents.address")}
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              rows={3}
              placeholder={t("admin.parents.addressPlaceholder")}
              className="mt-xs w-full resize-none rounded-xl border border-neutral-200 bg-white p-md font-normal outline-none focus:border-heading"
            />
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
            onClick={onClose}
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
