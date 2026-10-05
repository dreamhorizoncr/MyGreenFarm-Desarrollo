import { PencilIcon, Trash2Icon } from "@animateicons/react/lucide";

import type { Evaluation } from "../types/evaluation";
import type { Expedient } from "../types/expedient";

    interface EvaluationCardProps {
    evaluation: Evaluation;
    expedient?: Expedient;
    onEdit: (evaluation: Evaluation) => void;
    onDelete: (evaluation: Evaluation) => void;
    }

    function EvaluationCard({
    evaluation,
    expedient,
    onEdit,
    onDelete,
    }: EvaluationCardProps) {
    const formattedDate = new Date(
        `${evaluation.evaluationDate}T00:00:00`,
    ).toLocaleDateString();

    return (
        <div className="rounded-2xl border border-neutral-200 bg-white p-lg shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
        {/* Encabezado */}
        <div className="flex items-start justify-between gap-md">
            <div className="min-w-0">
            <h3 className="m-0 font-heading text-h4 font-bold text-heading">
                {expedient?.childName ?? "Expediente"}
            </h3>

            <p className="mt-1 font-body text-body-sm text-neutral-500">
                {expedient?.studentId ?? evaluation.expedientId}
            </p>

            <p className="mt-1 font-body text-body-sm font-semibold text-heading">
                {formattedDate}
            </p>
            </div>

            {/* Acciones */}
            <div className="flex shrink-0 items-center gap-3">
            <button
                type="button"
                onClick={() => onEdit(evaluation)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-green-500 bg-white text-green-600 transition-all duration-200 hover:bg-green-50"
                aria-label="Editar evaluación"
                title="Editar"
            >
                <PencilIcon size={17} />
            </button>

            <button
                type="button"
                onClick={() => onDelete(evaluation)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-red-400 bg-white text-red-500 transition-all duration-200 hover:bg-red-50"
                aria-label="Eliminar evaluación"
                title="Eliminar"
            >
                <Trash2Icon size={17} />
            </button>
            </div>
        </div>

        {/* Progresos */}
        <div className="mt-lg grid grid-cols-1 gap-md sm:grid-cols-2">
            <div>
            <p className="m-0 font-body text-body-sm font-semibold text-heading">
                Comunicación
            </p>
            <p className="mt-1 line-clamp-3 font-body text-body-sm text-neutral-600">
                {evaluation.communicationProgress}
            </p>
            </div>

            <div>
            <p className="m-0 font-body text-body-sm font-semibold text-heading">
                Lenguaje
            </p>
            <p className="mt-1 line-clamp-3 font-body text-body-sm text-neutral-600">
                {evaluation.languageProgress}
            </p>
            </div>

            <div>
            <p className="m-0 font-body text-body-sm font-semibold text-heading">
                Lectura
            </p>
            <p className="mt-1 line-clamp-3 font-body text-body-sm text-neutral-600">
                {evaluation.readingProgress}
            </p>
            </div>

            <div>
            <p className="m-0 font-body text-body-sm font-semibold text-heading">
                Desarrollo motor
            </p>
            <p className="mt-1 line-clamp-3 font-body text-body-sm text-neutral-600">
                {evaluation.motorProgress}
            </p>
            </div>
        </div>

        {/* Observación */}
        <div className="mt-lg border-t border-neutral-100 pt-md">
            <p className="m-0 font-body text-body-sm font-semibold text-heading">
            Observación del profesor
            </p>

            <p className="mt-1 line-clamp-4 font-body text-body-sm text-neutral-600">
            {evaluation.teacherObservation}
            </p>
        </div>
        </div>
    );
}

export default EvaluationCard;