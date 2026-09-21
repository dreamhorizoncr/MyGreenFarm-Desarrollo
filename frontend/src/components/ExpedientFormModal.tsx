import { useState } from "react";
import { useTranslation } from "react-i18next";

import { expedientService } from "../services/expedient";

import type {
  EducationalLevel,
  Expedient,
  ExpedientRequest,
} from "../types/expedient";

interface ExpedientFormModalProps {
  onClose: () => void;
  onCreated: () => void;
  expedient?: Expedient;
}

// Niveles educativos disponibles
const educationalLevels: EducationalLevel[] = [
  "LACTANTES",
  "MATERNAL",
  "INTERACTIVO",
  "MATERNO",
  "KINDER",
  "PRIMER_GRADO",
  "SEGUNDO_GRADO",
  "TERCER_GRADO",
  "CUARTO_GRADO",
  "QUINTO_GRADO",
  "SEXTO_GRADO",
];

// Relaciona los niveles del backend con las traducciones
const educationalLevelKeys = {
  LACTANTES: "lactantes",
  MATERNAL: "maternal",
  INTERACTIVO: "interactivo",
  MATERNO: "materno",
  KINDER: "kinder",
  PRIMER_GRADO: "primerGrado",
  SEGUNDO_GRADO: "segundoGrado",
  TERCER_GRADO: "tercerGrado",
  CUARTO_GRADO: "cuartoGrado",
  QUINTO_GRADO: "quintoGrado",
  SEXTO_GRADO: "sextoGrado",
} as const satisfies Record<EducationalLevel, string>;

function ExpedientFormModal({
  onClose,
  onCreated,
  expedient,
}: ExpedientFormModalProps) {
  const { t } = useTranslation();

  // Si existe un expediente, el modal está en modo edición
  const isEditing = Boolean(expedient);

  // Datos del formulario
  const [childName, setChildName] = useState(expedient?.childName ?? "");

  const [admisionDate, setAdmisionDate] = useState(
    expedient?.admisionDate ?? "",
  );

  const [educationalLevel, setEducationalLevel] = useState<EducationalLevel>(
    expedient?.educationalLevel ?? "MATERNAL",
  );

  const [generalObservations, setGeneralObservations] = useState(
    expedient?.generalObservations ?? "",
  );

  // Fotografía seleccionada
  const [file, setFile] = useState<File | undefined>();

  // Estado del formulario
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Guarda o actualiza el expediente
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setSaving(true);
    setError(null);

    const data: ExpedientRequest = {
      childName,
      admisionDate,
      educationalLevel,
      generalObservations,
    };

    try {
      // Si existe un expediente, lo actualiza
      if (expedient) {
        await expedientService.update(expedient.id, data, file);
      } else {
        // Si no existe, crea uno nuevo
        await expedientService.create(data, file);
      }

      // Actualiza la lista de expedientes
      await onCreated();

      // Cierra el modal
      onClose();
    } catch (error) {
      console.error("Error al guardar el expediente:", error);

      setError(
        isEditing
          ? t("admin.expedients.updateError")
          : t("admin.expedients.createError"),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">
      {/* Modal */}
      <div className="max-h-[90vh] w-[min(90vw,700px)] overflow-y-auto rounded-3xl bg-white p-7 shadow-xl">
        {/* Encabezado */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-2xl font-bold text-heading">
              {isEditing
                ? t("admin.expedients.editTitle")
                : t("admin.expedients.addTitle")}
            </h2>

            <p className="mt-1 font-body text-sm text-body-text">
              {isEditing
                ? t("admin.expedients.editDescription")
                : t("admin.expedients.addDescription")}
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
          {/* Nombre */}
          <div>
            <label className="mb-2 block font-body font-bold text-heading">
              {t("admin.expedients.childName")}
            </label>

            <input
              type="text"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              required
              placeholder={t("admin.expedients.childNamePlaceholder")}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 font-body outline-none focus:border-heading"
            />
          </div>

          {/* Fecha y nivel */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Fecha de admisión */}
            <div>
              <label className="mb-2 block font-body font-bold text-heading">
                {t("admin.expedients.admisiondate")}
              </label>

              <input
                type="date"
                value={admisionDate}
                onChange={(e) => setAdmisionDate(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 font-body outline-none focus:border-heading"
              />
            </div>

            {/* Nivel educativo */}
            <div>
              <label className="mb-2 block font-body font-bold text-heading">
                {t("admin.expedients.grade")}
              </label>

              <select
                value={educationalLevel}
                onChange={(e) =>
                  setEducationalLevel(e.target.value as EducationalLevel)
                }
                required
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-body outline-none focus:border-heading"
              >
                {educationalLevels.map((level) => (
                  <option key={level} value={level}>
                    {t(
                      `admin.expedients.levels.${educationalLevelKeys[level]}`,
                    )}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="mb-2 block font-body font-bold text-heading">
              {t("admin.expedients.notes")}
            </label>

            <textarea
              value={generalObservations}
              onChange={(e) => setGeneralObservations(e.target.value)}
              maxLength={600}
              rows={4}
              placeholder={t("admin.expedients.observationsPlaceholder")}
              className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 font-body outline-none focus:border-heading"
            />

            <p className="mt-1 text-right font-body text-xs text-body-text">
              {generalObservations.length}/600
            </p>
          </div>

          {/* Fotografía */}
          <div>
            <label className="mb-2 block font-body font-bold text-heading">
              {t("admin.expedients.photo")}
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0])}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 font-body text-body-text"
            />

            <p className="mt-1 font-body text-xs text-body-text">
              {isEditing
                ? t("admin.expedients.replacePhoto")
                : t("admin.expedients.optionalPhoto")}
            </p>
          </div>

          {/* Error */}
          {error && <p className="font-body text-sm text-red-500">{error}</p>}

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-2">
            {/* Cancelar */}
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-full border border-heading px-6 py-3 font-body font-bold text-heading transition hover:bg-gray-50"
            >
              {t("admin.expedients.cancel")}
            </button>

            {/* Guardar */}
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-heading px-7 py-3 font-body font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? t("admin.expedients.saving")
                : isEditing
                  ? t("admin.expedients.saveChanges")
                  : t("admin.expedients.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ExpedientFormModal;
