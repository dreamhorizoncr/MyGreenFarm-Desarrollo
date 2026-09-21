import { useState } from "react";

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
const educationalLevels: {
  value: EducationalLevel;
  label: string;
}[] = [
  { value: "LACTANTES", label: "Lactantes" },
  { value: "MATERNAL", label: "Maternal" },
  { value: "INTERACTIVO", label: "Interactivo" },
  { value: "MATERNO", label: "Materno" },
  { value: "KINDER", label: "Kinder" },
  { value: "PRIMER_GRADO", label: "Primer grado" },
  { value: "SEGUNDO_GRADO", label: "Segundo grado" },
  { value: "TERCER_GRADO", label: "Tercer grado" },
  { value: "CUARTO_GRADO", label: "Cuarto grado" },
  { value: "QUINTO_GRADO", label: "Quinto grado" },
  { value: "SEXTO_GRADO", label: "Sexto grado" },
];

function ExpedientFormModal({
  onClose,
  onCreated,
  expedient,
}: ExpedientFormModalProps) {
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
          ? "No se pudo actualizar el expediente."
          : "No se pudo crear el expediente.",
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
              {isEditing ? "Editar expediente" : "Agregar expediente"}
            </h2>

            <p className="mt-1 font-body text-sm text-body-text">
              {isEditing
                ? "Modifica la información académica del niño o niña."
                : "Ingresa la información académica del niño o niña."}
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
              Nombre del niño o niña
            </label>

            <input
              type="text"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              required
              placeholder="Nombre completo"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 font-body outline-none focus:border-heading"
            />
          </div>

          {/* Fecha y nivel */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Fecha de admisión */}
            <div>
              <label className="mb-2 block font-body font-bold text-heading">
                Fecha de admisión
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
                Nivel educativo
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
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="mb-2 block font-body font-bold text-heading">
              Observaciones generales
            </label>

            <textarea
              value={generalObservations}
              onChange={(e) => setGeneralObservations(e.target.value)}
              maxLength={600}
              rows={4}
              placeholder="Escribe las observaciones generales..."
              className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 font-body outline-none focus:border-heading"
            />

            <p className="mt-1 text-right font-body text-xs text-body-text">
              {generalObservations.length}/600
            </p>
          </div>

          {/* Fotografía */}
          <div>
            <label className="mb-2 block font-body font-bold text-heading">
              Fotografía
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0])}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 font-body text-body-text"
            />

            <p className="mt-1 font-body text-xs text-body-text">
              {isEditing
                ? "Selecciona una nueva fotografía únicamente si deseas reemplazar la actual."
                : "La fotografía es opcional."}
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
              Cancelar
            </button>

            {/* Guardar */}
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-heading px-7 py-3 font-body font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Guardando..."
                : isEditing
                  ? "Guardar cambios"
                  : "Guardar expediente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ExpedientFormModal;
