import { useTranslation } from "react-i18next";

import type { Evaluation } from "../types/evaluation";
import type { Expedient } from "../types/expedient";
import Skeleton from "./ui/Skeleton.tsx";
import CardActionButton from "./ui/CardActionButton.tsx";

    interface EvaluationCardProps {
    evaluation?: Evaluation;
    expedient?: Expedient;
    onEdit?: (evaluation: Evaluation) => void;
    onDelete?: (evaluation: Evaluation) => void;
    loading?: boolean;
    }

    function EvaluationCard({
    evaluation,
    expedient,
    onEdit,
    onDelete,
    loading = false,
    }: Readonly<EvaluationCardProps>) {
    const { t } = useTranslation();
    const formattedDate = evaluation
        ? new Date(`${evaluation.evaluationDate}T00:00:00`).toLocaleDateString()
        : ""

    const progressFields = [
        { label: t("admin.evaluations.cardCommunication"), value: evaluation?.communicationProgress },
        { label: t("admin.evaluations.cardLanguage"), value: evaluation?.languageProgress },
        { label: t("admin.evaluations.cardReading"), value: evaluation?.readingProgress },
        { label: t("admin.evaluations.cardMotor"), value: evaluation?.motorProgress },
    ]

    return (
        <div className="rounded-2xl border border-neutral-200 bg-white p-lg shadow-sm transition hover:shadow-lg">
        {/* Encabezado */}
        <div className="flex items-start justify-between gap-md">
            {loading ? (
              <div className="min-w-0 flex-1">
                <Skeleton shape="line" className="h-5 w-1/2" />
                <Skeleton shape="line" className="mt-2 h-4 w-1/3" />
                <Skeleton shape="line" className="mt-2 h-4 w-1/4" />
              </div>
            ) : (
              <div className="min-w-0">
                <h3 className="m-0 font-heading text-h4 font-bold text-heading">
                    {expedient?.childName ?? t("admin.evaluations.cardDefaultExpedient")}
                </h3>

                <p className="mt-1 font-body text-body-sm text-neutral-500">
                    {expedient?.studentId ?? evaluation!.expedientId}
                </p>

                <p className="mt-1 font-body text-body-sm font-semibold text-heading">
                    {formattedDate}
                </p>
              </div>
            )}

            {/* Acciones */}
            <div className="flex shrink-0 items-center gap-3">
              {loading ? (
                <>
                  <Skeleton shape="circle" className="size-10" />
                  <Skeleton shape="circle" className="size-10" />
                </>
              ) : (
                <>
                  <CardActionButton
                    action="edit"
                    label={t("admin.evaluations.cardEditAriaLabel")}
                    title={t("admin.evaluations.cardEditTitle")}
                    onClick={() => onEdit!(evaluation!)}
                  />

                  <CardActionButton
                    action="delete"
                    label={t("admin.evaluations.cardDeleteAriaLabel")}
                    title={t("admin.evaluations.cardDeleteTitle")}
                    onClick={() => onDelete!(evaluation!)}
                  />
                </>
              )}
            </div>
        </div>

        {/* Progresos */}
        <div className="mt-lg grid grid-cols-1 gap-md sm:grid-cols-2">
            {progressFields.map(({ label, value }) => (
              <div key={label}>
                {loading ? (
                  <>
                    <Skeleton shape="line" className="h-3 w-1/2" />
                    <Skeleton shape="line" className="mt-2 h-3 w-full" />
                    <Skeleton shape="line" className="mt-1 h-3 w-2/3" />
                  </>
                ) : (
                  <>
                    <p className="m-0 font-body text-body-sm font-semibold text-heading">
                        {label}
                    </p>
                    <p className="mt-1 line-clamp-3 font-body text-body-sm text-neutral-600">
                        {value}
                    </p>
                  </>
                )}
              </div>
            ))}
        </div>

        {/* Observación */}
        <div className="mt-lg border-t border-neutral-100 pt-md">
            {loading ? (
              <>
                <Skeleton shape="line" className="h-3 w-1/3" />
                <Skeleton shape="line" className="mt-2 h-3 w-full" />
                <Skeleton shape="line" className="mt-1 h-3 w-full" />
                <Skeleton shape="line" className="mt-1 h-3 w-1/2" />
              </>
            ) : (
              <>
                <p className="m-0 font-body text-body-sm font-semibold text-heading">
                {t("admin.evaluations.cardTeacherObservation")}
                </p>
                <p className="mt-1 line-clamp-4 font-body text-body-sm text-neutral-600">
                {evaluation!.teacherObservation}
                </p>
              </>
            )}
        </div>
        </div>
    );
}

export default EvaluationCard;
