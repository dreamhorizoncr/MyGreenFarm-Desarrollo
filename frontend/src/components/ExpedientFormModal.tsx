import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDownIcon, ImageIcon, XIcon } from "@animateicons/react/lucide";
import Select from "./ui/Select.tsx";

import { expedientService } from "../services/expedient";
import { notify } from "../utils/notifications.ts";
import { useModalExit } from "../hooks/useModalExit.ts";
import { validateRequired } from "../utils/validators.ts";

import type {
  EducationalLevel,
  Expedient,
  ExpedientRequest,
} from "../types/expedient";
import { childService, type ChildOption } from "../services/child.ts";
import { educationalLevelKeys } from "../utils/educationalLevels.ts";

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

function ExpedientFormModal({
  onClose,
  onCreated,
  expedient,
}: Readonly<ExpedientFormModalProps>) {
  const { t } = useTranslation();
  const { closing, requestClose } = useModalExit(onClose);

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

  const [studentError, setStudentError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

  const [isOpen, setIsOpen] = useState(false);

  // Sincronizar searchTerm cuando carga un expediente existente
  useEffect(() => {
    if (expedient && childrenOptions.length > 0) {
      const match = childrenOptions.find((opt) => opt.studentId === expedient.studentId);
      if (match) {
        setSearchTerm(`${match.fullName ?? match.childName}`);
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

    const studentErrorMessage = studentId
      ? null
      : t("admin.expedients.selectStudentError");
    const dateErrorMessage = validateRequired(admisionDate, t("admin.expedients.admisiondate"), t);

    setStudentError(studentErrorMessage);
    setDateError(dateErrorMessage);

    if (studentErrorMessage || dateErrorMessage) return;

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
      requestClose();
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
    <div className="fixed inset-0 z-50 overflow-y-auto scrollbar-none bg-black/50 p-[16px] md:p-[30px]">
      <button
        type="button"
        tabIndex={-1}
        aria-label={t("admin.expedients.cancel")}
        className="absolute inset-0 size-full cursor-default"
        onClick={requestClose}
      />

      <form
        onSubmit={handleSubmit}
        className={`relative mx-auto w-full max-w-[820px] rounded-[20px] border border-neutral-200 bg-white p-lg shadow-lg md:p-xl ${closing ? 'animate-[modal-out_0.32s_ease-in]' : 'animate-[modal-in_0.32s_ease-out]'}`}
      >
        <div className="flex items-center justify-between gap-md">
          <h2 className="m-0 font-heading text-2xl font-bold text-heading">
            {isEditing
              ? t("admin.expedients.editTitle")
              : t("admin.expedients.addTitle")}
          </h2>

          <button
            type="button"
            onClick={requestClose}
            aria-label={t("admin.expedients.cancel")}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-heading shadow-sm transition hover:bg-neutral-100"
          >
            <XIcon size={20} />
          </button>
        </div>

        <div className="mt-lg grid gap-md md:grid-cols-2">
          {/* Estudiante (Dropdown) */}
          <div className="font-body text-body-sm font-semibold text-heading md:col-span-2">
            {t("admin.expedients.childName")}

            <div className="relative mt-xs">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setStudentId(""); // Resetea ID hasta que elija una opción válida
                  setIsOpen(true);
                  if (studentError) setStudentError(null);
                }}
                onFocus={() => setIsOpen(true)}
                onBlur={() => setTimeout(() => setIsOpen(false), 200)} // Delay para permitir click en opciones
                placeholder={
                  loadingOptions
                    ? t("admin.expedients.loadingStudents")
                    : t("admin.expedients.childNamePlaceholder") ?? "Buscar estudiante..."
                }
                disabled={isEditing || loadingOptions}
                className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-md pr-11 font-normal outline-none focus:border-heading disabled:cursor-not-allowed disabled:bg-neutral-100"
              />

              <ChevronDownIcon
                size={16}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500"
                aria-hidden="true"
              />

              {/* Desplegable de resultados */}
              {isOpen && !isEditing && (
                <ul className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-neutral-200 bg-white py-2 font-body text-body-sm shadow-lg">
                  {filteredOptions.length > 0 ? (
                    filteredOptions.map((option) => (
                      <li
                        key={option.studentId}
                        onMouseDown={() => {
                          setStudentId(option.studentId);
                          setSearchTerm(`${option.fullName ?? option.childName}`);
                          setIsOpen(false);
                          setStudentError(null);
                        }}
                        className="mx-2 cursor-pointer rounded-lg px-4 py-2 text-heading transition-colors hover:bg-orange-100"
                      >
                        {option.fullName ?? option.childName}
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-2 text-neutral-400">{t("admin.expedients.noResults")}</li>
                  )}
                </ul>
              )}
            </div>
            {studentError && (
              <span className="mt-xs block font-body text-body-sm font-normal text-danger">{studentError}</span>
            )}
          </div>

          {/* Fecha de admisión */}
          <label className="font-body text-body-sm font-semibold text-heading">
            {t("admin.expedients.admisiondate")}
            <input
              type="date"
              value={admisionDate}
              onChange={(e) => {
                setAdmisionDate(e.target.value);
                if (dateError) setDateError(null);
              }}
              className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
            />
            {dateError && (
              <span className="mt-xs block font-body text-body-sm font-normal text-danger">{dateError}</span>
            )}
          </label>

          {/* Nivel educativo */}
          <label className="font-body text-body-sm font-semibold text-heading">
            {t("admin.expedients.grade")}
            <div className="mt-xs">
              <Select
                value={educationalLevel}
                onChange={(value) =>
                  setEducationalLevel(value as EducationalLevel)
                }
                options={educationalLevels.map((level) => ({
                  value: level,
                  label: t(`admin.expedients.levels.${educationalLevelKeys[level]}`),
                }))}
                className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-md"
                aria-label={t("admin.expedients.grade")}
              />
            </div>
          </label>

          {/* Observaciones */}
          <label className="font-body text-body-sm font-semibold text-heading md:col-span-2">
            {t("admin.expedients.notes")}
            <textarea
              value={generalObservations}
              onChange={(e) => setGeneralObservations(e.target.value)}
              maxLength={600}
              rows={4}
              placeholder={t("admin.expedients.observationsPlaceholder")}
              className="mt-xs w-full resize-none rounded-xl border border-neutral-200 bg-white p-md font-normal outline-none focus:border-heading"
            />

            <p className="mt-xs text-right font-body text-caption font-normal text-neutral-500">
              {generalObservations.length}/600
            </p>
          </label>

          {/* Fotografía */}
          <div className="font-body text-body-sm font-semibold text-heading md:col-span-2">
            {t("admin.expedients.photo")}

            <div className="mt-xs flex items-center gap-3">
              <label className="flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-md font-normal text-heading transition-colors hover:border-heading">
                <ImageIcon size={18} />
                <span>{t("admin.expedients.photo")}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0])}
                  className="hidden"
                />
              </label>

              {/* Muestra el nombre del archivo si ya se seleccionó uno */}
              {file && (
                <span className="max-w-[200px] truncate font-body text-body-sm font-normal text-neutral-500">
                  {file.name}
                </span>
              )}
            </div>

            <p className="mt-xs font-body text-caption font-normal text-neutral-500">
              {isEditing
                ? t("admin.expedients.replacePhoto")
                : t("admin.expedients.optionalPhoto")}
            </p>
          </div>
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
            {t("admin.expedients.cancel")}
          </button>

          <button
            type="submit"
            disabled={saving}
            className="h-11 rounded-full bg-orange-500 px-lg font-body text-body-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? t("admin.expedients.saving") : idleSaveLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ExpedientFormModal;
