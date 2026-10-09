import type { Expedient } from "../types/expedient.ts";
import { useTranslation } from "react-i18next";
import { Pencil, Trash2 } from "@animateicons/react/lucide";
import Skeleton from "./ui/Skeleton.tsx";
import { educationalLevelKeys } from "../utils/educationalLevels.ts";

interface ExpedientCardProps {
  expedient?: Expedient;
  onEdit?: (expedient: Expedient) => void;
  onDelete?: (expedient: Expedient) => void;
  loading?: boolean;
}

// Convierte YYYY-MM-DD a DD/MM/YYYY
function formatDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

function ExpedientCard({ expedient, onEdit, onDelete, loading = false }: Readonly<ExpedientCardProps>) {
  const { t } = useTranslation();

  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-lg shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      {/* Nombre y acciones */}
      <div className="flex items-start justify-between gap-4">
        {/* Nombre */}
        {loading ? (
          <Skeleton shape="line" className="h-6 w-1/2" />
        ) : (
          <h2 className="font-heading text-xl font-bold text-heading">
            {expedient!.childName}
          </h2>
        )}

        {/* Botones de editar y eliminar */}
        <div className="flex shrink-0 items-center gap-2">
          {loading ? (
            <>
              <Skeleton shape="circle" className="size-10" />
              <Skeleton shape="circle" className="size-10" />
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onEdit!(expedient!)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-green-500 text-green-500 transition hover:bg-green-50"
              >
                <Pencil size={16} />
              </button>

              <button
                type="button"
                onClick={() => onDelete!(expedient!)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-red-300 text-danger transition hover:bg-red-50"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Información del expediente */}
      <div className="mt-4 space-y-2 font-body text-body-text">
        {loading ? (
          <>
            <Skeleton shape="line" className="h-4 w-2/3" />
            <Skeleton shape="line" className="h-4 w-1/2" />
          </>
        ) : (
          <>
            <p>
              <span className="font-bold">{t('admin.expedients.admisiondate')} </span>
              {formatDate(expedient!.admisionDate)}
            </p>

            <p>
              <span className="font-bold">{t('admin.expedients.grade')} </span>
              {t(`admin.expedients.levels.${educationalLevelKeys[expedient!.educationalLevel]}`)}
            </p>
          </>
        )}
      </div>

      {/* Fotografía y observaciones */}
      <div className="mt-6 flex flex-col gap-5 border-t border-neutral-100 pt-5 sm:flex-row">
        {/* Fotografía */}
        {loading ? (
          <Skeleton shape="rect" className="h-40 w-full shrink-0 sm:w-40" />
        ) : (
          <div className="h-40 w-full shrink-0 overflow-hidden rounded-2xl bg-[var(--grey-100)] sm:w-40">
            {expedient!.photoUrl ? (
              <img
                src={expedient!.photoUrl}
                alt={t('admin.expedients.photoAlt', { name: expedient!.childName })}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center px-4 text-center">
                <p className="font-body text-body-sm text-body-text">{t('admin.expedients.noPhoto')}</p>
              </div>
            )}
          </div>
        )}

        {/* Observaciones */}
        <div className="min-w-0 flex-1">
          {loading ? (
            <>
              <Skeleton shape="line" className="h-4 w-1/3" />
              <Skeleton shape="line" className="mt-3 h-3 w-full" />
              <Skeleton shape="line" className="mt-2 h-3 w-5/6" />
            </>
          ) : (
            <>
              <h3 className="font-body text-body font-bold text-heading">
                {t('admin.expedients.notes')}
              </h3>

              <p className="mt-2 break-words font-body text-body-sm leading-relaxed text-body-text">
                {expedient!.generalObservations || t('admin.expedients.noObservations')}
              </p>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

export default ExpedientCard;
