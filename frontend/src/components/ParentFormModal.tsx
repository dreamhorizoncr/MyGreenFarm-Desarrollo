import { useState } from "react";
import { useTranslation } from "react-i18next";
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">
      {/* Modal */}
      <div className="max-h-[90vh] w-[min(90vw,700px)] overflow-y-auto rounded-3xl bg-white p-7 shadow-xl">
        {/* Encabezado */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-2xl font-bold text-heading">
              {isEditing
                ? t("admin.parents.editTitle")
                : t("admin.parents.addTitle")}
            </h2>

            <p className="mt-1 font-body text-body-sm text-body-text">
              {isEditing
                ? t("admin.parents.editDescription")
                : t("admin.parents.addDescription")}
            </p>
          </div>

          {/* Cerrar modal */}
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-2xl text-body-text transition hover:bg-gray-100"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          {/* Nombre y apellido */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block font-body font-bold text-heading">
                {t("admin.parents.firstName")}
              </label>

              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                placeholder={t("admin.parents.firstNamePlaceholder")}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 font-body outline-none focus:border-heading"
              />
            </div>

            <div>
              <label className="mb-2 block font-body font-bold text-heading">
                {t("admin.parents.lastName")}
              </label>

              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                placeholder={t("admin.parents.lastNamePlaceholder")}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 font-body outline-none focus:border-heading"
              />
            </div>
          </div>

          {/* Identificación y teléfono */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block font-body font-bold text-heading">
                {t("admin.parents.identification")}
              </label>

              <input
                type="text"
                value={identification}
                onChange={(e) => setIdentification(e.target.value)}
                required
                placeholder={t("admin.parents.identificationPlaceholder")}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 font-body outline-none focus:border-heading"
              />
            </div>

            <div>
              <label className="mb-2 block font-body font-bold text-heading">
                {t("admin.parents.phoneNumber")}
              </label>

              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                placeholder={t("admin.parents.phonePlaceholder")}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 font-body outline-none focus:border-heading"
              />
            </div>
          </div>

          {/* Correo */}
          <div>
            <label className="mb-2 block font-body font-bold text-heading">
              {t("admin.parents.email")}
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={t("admin.parents.emailPlaceholder")}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 font-body outline-none focus:border-heading"
            />
          </div>

          {/* Dirección */}
          <div>
            <label className="mb-2 block font-body font-bold text-heading">
              {t("admin.parents.address")}
            </label>

            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              rows={3}
              placeholder={t("admin.parents.addressPlaceholder")}
              className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 font-body outline-none focus:border-heading"
            />
          </div>

          {/* Idioma */}
          <div>
            <label className="mb-2 block font-body font-bold text-heading">
              {t("admin.parents.language")}
            </label>

            <Select
              value={language}
              onChange={(value) => setLanguage(value as ParentLanguage)}
              options={languages.map((lang) => ({
                value: lang,
                label: t(`admin.parents.languages.${lang}`),
              }))}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
              aria-label={t("admin.parents.language")}
            />
          </div>

          {/* Error */}
          {error && <p className="font-body text-body-sm text-red-500">{error}</p>}

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-11 rounded-full border border-green-500 px-6 font-body font-bold text-heading transition-colors hover:bg-green-50"
            >
              {t("admin.parents.cancel")}
            </button>

            <button
              type="submit"
              disabled={saving}
              className="h-11 rounded-full bg-orange-500 px-7 font-body font-bold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? t("admin.parents.saving") : idleSaveLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ParentFormModal;
