import type { EducationalLevel, Expedient } from "../types/expedient.ts";
import { useTranslation } from "react-i18next";

interface ExpedientCardProps {
  expedient: Expedient;
  onEdit: (expedient: Expedient) => void;
  onDelete: (expedient: Expedient) => void;
}

// Convierte el nivel educativo a un texto más fácil de leer
const educationalLevelLabels: Record<EducationalLevel, string> = {
  LACTANTES: "Lactantes",
  MATERNAL: "Maternal",
  INTERACTIVO: "Interactivo",
  MATERNO: "Materno",
  KINDER: "Kinder",
  PRIMER_GRADO: "Primer grado",
  SEGUNDO_GRADO: "Segundo grado",
  TERCER_GRADO: "Tercer grado",
  CUARTO_GRADO: "Cuarto grado",
  QUINTO_GRADO: "Quinto grado",
  SEXTO_GRADO: "Sexto grado",
};

// Convierte YYYY-MM-DD a DD/MM/YYYY
function formatDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

function ExpedientCard({ expedient, onEdit, onDelete }: ExpedientCardProps) {

  const { t } = useTranslation();

  return (
    <article className="rounded-3xl bg-gray-100 p-6">
      {/* Nombre y acciones */}
      <div className="flex items-start justify-between gap-4">
        {/* Nombre */}
        <h2 className="font-heading text-xl font-bold text-heading">
          {expedient.childName}
        </h2>

        {/* Botones de editar y eliminar */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(expedient)}
            className="rounded-full bg-white px-4 py-2 font-body text-sm font-bold text-heading transition hover:scale-105"
          >
            {t('admin.expedients.editbutton')}
          </button>

          <button
            type="button"
            onClick={() => onDelete(expedient)}
            className="rounded-full bg-white px-4 py-2 font-body text-sm font-bold text-red-500 transition hover:scale-105"
          >
            {t('admin.expedients.deletebutton')}
          </button>
        </div>
      </div>

      {/* Información del expediente */}
      <div className="mt-4 space-y-2 font-body text-body-text">
        <p>
          <span className="font-bold">{t('admin.expedients.admisiondate')} </span>
          {formatDate(expedient.admisionDate)}
        </p>

        <p>
          <span className="font-bold">{t('admin.expedients.grade')} </span>
          {educationalLevelLabels[expedient.educationalLevel]}
        </p>
      </div>

      {/* Fotografía y observaciones */}
      <div className="mt-6 flex flex-col gap-5 sm:flex-row">
        {/* Fotografía */}
        <div className="h-40 w-full shrink-0 overflow-hidden rounded-2xl bg-white sm:w-40">
          {expedient.photoUrl ? (
            <img
              src={expedient.photoUrl}
              alt={`Fotografía de ${expedient.childName}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-4 text-center">
              <p className="font-body text-sm text-body-text">Sin fotografía</p>
            </div>
          )}
        </div>

        {/* Observaciones */}
        <div className="min-w-0 flex-1 rounded-2xl bg-white p-5">
          <h3 className="font-body text-base font-bold text-heading">
            {t('admin.expedients.notes')}
          </h3>

          <p className="mt-2 break-words font-body text-sm leading-relaxed text-body-text">
            {expedient.generalObservations || "Sin observaciones."}
          </p>
        </div>
      </div>
    </article>
  );
}

export default ExpedientCard;
