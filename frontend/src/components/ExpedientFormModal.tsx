import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDownIcon, ImageIcon } from "@animateicons/react/lucide";
import Select from "./ui/Select.tsx";

import { expedientService } from "../services/expedient";
import { notify } from "../utils/notifications.ts";

import type {
  EducationalLevel,
  Expedient,
  ExpedientRequest,
} from "../types/expedient";
import { childService, type ChildOption } from "../services/child.ts";

interface ExpedientFormModalProps {
  onClose: () => void;
  onCreated: () => void | Promise<void>;
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
}: Readonly<ExpedientFormModalProps>) {
  const { t } = useTranslation();

  // Si existe un expediente, el modal está en modo edición
  const isEditing = Boolean(expedient);

  // Lista de estudiantes para el dropdown
  const [childrenOptions, setChildrenOptions] = useState<ChildOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Selección de estudiante (studentId)
  const [studentId, setStudentId] = useState(expedient?.studentId ?? "");

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

  const [searchTerm, setSearchTerm] = useState("");

  const [isOpen, setIsOpen] = useState(false);

  // Sincronizar searchTerm cuando carga un expediente existente
  useEffect(() => {
    if (expedient && childrenOptions.length > 0) {
      const match = childrenOptions.find((opt) => opt.studentId === expedient.studentId);
      if (match) {
        setSearchTerm(`${match.studentId} - ${match.fullName ?? match.childName}`);
      }
    }
  }, [expedient, childrenOptions]);

  // Opciones filtradas según la búsqueda
  const filteredOptions = childrenOptions.filter((option) => {
    const name = option.fullName ?? option.childName ?? "";
    const query = searchTerm.toLowerCase();
    return (
      name.toLowerCase().includes(query) ||
      option.studentId.toLowerCase().includes(query)
    );
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoadingOptions(true);
        const options = await childService.getChildrenOptions();
        setChildrenOptions(options);
      } catch (err) {
        console.error("Error al obtener las opciones de niños:", err);
      } finally {
        setLoadingOptions(false);
      }
    };

    void fetchOptions();
  }, []);

  // Guarda o actualiza el expediente
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!studentId) {
      notify.error(t("admin.expedients.selectStudentError") ?? "Debe seleccionar un estudiante");
      return;
    }

    setSaving(true);
    setError(null);

    const data: ExpedientRequest = {
      studentId,
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

      notify.success(
        isEditing
          ? t("admin.expedients.updateSuccessToastTitle")
          : t("admin.expedients.createSuccessToastTitle"),
      );

      // Cierra el modal
      onClose();
    } catch (error) {
      console.error("Error al guardar el expediente:", error);

      const errorMessage = isEditing
        ? t("admin.expedients.updateError")
        : t("admin.expedients.createError");

      setError(errorMessage);
      notify.error({
        title: isEditing
          ? t("admin.expedients.updateErrorToastTitle")
          : t("admin.expedients.createErrorToastTitle"),
        description: errorMessage,
      });
    } finally {
      setSaving(false);
    }
  };

  const idleSaveLabel = isEditing
    ? t("admin.expedients.saveChanges")
    : t("admin.expedients.save");

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

            <p className="mt-1 font-body text-body-sm text-body-text">
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
          {/* Estudiante (Dropdown) */}
          <div>
            <label className="mb-2 block font-body font-bold text-heading">
              {t("admin.expedients.childName")}
            </label>

            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setStudentId(""); // Resetea ID hasta que elija una opción válida
                  setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                onBlur={() => setTimeout(() => setIsOpen(false), 200)} // Delay para permitir click en opciones
                placeholder={
                  loadingOptions
                    ? "Cargando estudiantes..."
                    : t("admin.expedients.childNamePlaceholder") ?? "Buscar estudiante..."
                }
                disabled={isEditing || loadingOptions}
                required
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-11 font-body outline-none focus:border-heading disabled:bg-gray-100 disabled:cursor-not-allowed"
              />

              <ChevronDownIcon
                size={16}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500"
                aria-hidden="true"
              />

              {/* Desplegable de resultados */}
              {isOpen && !isEditing && (
                <ul className="absolute z-50 mt-1 max-h-56 w-full overflow-auto border border-gray-600 bg-white py-1 shadow-lg font-body text-body-sm">
                  {filteredOptions.length > 0 ? (
                    filteredOptions.map((option) => (
                      <li
                        key={option.studentId}
                        onMouseDown={() => {
                          setStudentId(option.studentId);
                          setSearchTerm(`${option.fullName ?? option.childName}`);
                          setIsOpen(false);
                        }}
                        className="cursor-pointer px-4 py-2 hover:bg-gray-600 hover:text-white transition-colors"
                      >
                        <span className="font-bold"></span>{option.fullName ?? option.childName}
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-2 text-gray-400">Sin resultados</li>
                  )}
                </ul>
              )}
            </div>
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

              <Select
                value={educationalLevel}
                onChange={(value) =>
                  setEducationalLevel(value as EducationalLevel)
                }
                options={educationalLevels.map((level) => ({
                  value: level,
                  label: t(`admin.expedients.levels.${educationalLevelKeys[level]}`),
                }))}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
                aria-label={t("admin.expedients.grade")}
              />
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

            <p className="mt-1 text-right font-body text-caption text-body-text">
              {generalObservations.length}/600
            </p>
          </div>

          {/* Fotografía */}
          {/* Fotografía */}
          <div>
            <label className="mb-2 block font-body font-bold text-emerald-600">
              {t("admin.expedients.photo")}
            </label>

            <div className="flex items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 rounded-full border border-gray-300 px-6 py-2.5 transition-colors hover:bg-gray-50 active:bg-gray-100">
                <ImageIcon className="h-5 w-5 text-emerald-600" />
                <span className="font-body font-semibold text-emerald-600">
                  {t("admin.expedients.photo")}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0])}
                  className="hidden"
                />
              </label>

              {/* Muestra el nombre del archivo si ya se seleccionó uno */}
              {file && (
                <span className="truncate font-body text-body-sm text-gray-600 max-w-[200px]">
                  {file.name}
                </span>
              )}
            </div>

            <p className="mt-2 font-body text-caption text-gray-400">
              {isEditing
                ? t("admin.expedients.replacePhoto")
                : t("admin.expedients.optionalPhoto")}
            </p>
          </div>

          {/* Error */}
          {error && <p className="font-body text-body-sm text-red-500">{error}</p>}

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-2">
            {/* Cancelar */}
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-11 rounded-full border border-green-500 px-6 font-body font-bold text-heading transition-colors hover:bg-green-50"
            >
              {t("admin.expedients.cancel")}
            </button>

            {/* Guardar */}
            <button
              type="submit"
              disabled={saving}
              className="h-11 rounded-full bg-green-500 px-7 font-body font-bold text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? t("admin.expedients.saving") : idleSaveLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ExpedientFormModal;
