import {
  CalendarDaysIcon,
  FileTextIcon,
  PencilIcon,
  Trash2Icon,
  UserIcon,
} from "@animateicons/react/lucide";

import type { Child } from "../types/child";
import { useTranslation } from "react-i18next";

interface ChildCardProps {
  child: Child;
  onEdit: (child: Child) => void;
  onDelete: (child: Child) => void;
}

function ChildCard({ child, onEdit, onDelete }: ChildCardProps) {
  const fullName = `${child.firstName} ${child.lastName}`;
  const { t } = useTranslation();

  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-lg shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-heading text-xl font-bold text-heading">
            {fullName}
          </h2>

          <p className="mt-1 font-body text-body-sm text-body-text">
            ID estudiantil: {child.studentId}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(child)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-green-500 bg-white text-green-600 transition-all duration-200 hover:bg-green-50"
            aria-label={`${t("admin.children.editTitle")} ${fullName}`}
            title={t("admin.children.editTitle")}
          >
            <PencilIcon size={17} />
          </button>

          <button
            type="button"
            onClick={() => onDelete(child)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-red-400 bg-white text-red-500 transition-all duration-200 hover:bg-red-50"
            aria-label={`${t("admin.children.deleteTitle")} ${fullName}`}
            title={t("admin.children.deleteTitle")}
          >
            <Trash2Icon size={17} />
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <UserIcon
            size={18}
            className="mt-0.5 shrink-0 text-heading"
            aria-hidden="true"
          />

          <div>
            <p className="font-body text-body-sm font-semibold text-heading">
              {t('admin.children.parentOrGuardian')}
            </p>

            <p className="font-body text-body-sm text-body-text">
              {child.parentName}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <CalendarDaysIcon
            size={18}
            className="mt-0.5 shrink-0 text-heading"
            aria-hidden="true"
          />

          <div>
            <p className="font-body text-body-sm font-semibold text-heading">
              {t('admin.children.birthDate')}
            </p>

            <p className="font-body text-body-sm text-body-text">
              {child.birthDate}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <FileTextIcon
            size={18}
            className="mt-0.5 shrink-0 text-heading"
            aria-hidden="true"
          />

          <div>
            <p className="font-body text-body-sm font-semibold text-heading">
              {t('admin.children.medicalNotes')}
            </p>

            <p className="font-body text-body-sm text-body-text">
              {child.medicalNotes || "Sin notas médicas"}
            </p>
          </div>
        </div>
      </div>

      {child.clubNames.length > 0 && (
        <div className="mt-6 border-t border-neutral-100 pt-4">
          <p className="font-body text-body-sm font-semibold text-heading">
            {t('admin.children.clubs')}
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            {child.clubNames.map((club) => (
              <span
                key={club}
                className="rounded-full bg-[var(--pink-400)] px-sm py-2xs font-body text-caption font-semibold text-white"
              >
                {club}
              </span>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

export default ChildCard;
