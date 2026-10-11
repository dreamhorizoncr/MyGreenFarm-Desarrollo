import { useState } from "react";
import { useTranslation } from "react-i18next";

import { evaluationService } from "../services/evaluation";
import type { Evaluation } from "../types/evaluation";

const ENTITY_TYPE = "evaluation";
const TRANSLATABLE_FIELDS = [
    "communicationProgress",
    "languageProgress",
    "readingProgress",
    "motorProgress",
    "teacherObservation",
] as const;

export function useEvaluations() {
    const { t } = useTranslation();
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [sourceEvaluations, setSourceEvaluations] = useState<Evaluation[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchEvaluations = async (lang?: string) => {
        try {
        setLoading(true);
        setError(null);

        const data = await evaluationService.getAll();
        setSourceEvaluations(data);

        const targetLang = lang?.split('-')[0];
        const items = data.flatMap((evaluation) =>
            TRANSLATABLE_FIELDS.flatMap((field) => {
                const originalText = evaluation[field];
                return originalText
                    ? [{ entityId: evaluation.id, fieldName: field, originalText }]
                    : [];
            }),
        );

        // Siempre batch (como foro): el original puede estar en ES, EN o FR.
        // Se excluyen nombres/fechas/ids: solo los 5 textos pedagógicos.
        if (targetLang && items.length > 0) {
            try {
                const translated = await evaluationService.translateBatch(ENTITY_TYPE, targetLang, items);
                setEvaluations(
                    data.map((evaluation) => ({
                        ...evaluation,
                        communicationProgress:
                            translated[`${evaluation.id}:communicationProgress`] ?? evaluation.communicationProgress,
                        languageProgress:
                            translated[`${evaluation.id}:languageProgress`] ?? evaluation.languageProgress,
                        readingProgress:
                            translated[`${evaluation.id}:readingProgress`] ?? evaluation.readingProgress,
                        motorProgress:
                            translated[`${evaluation.id}:motorProgress`] ?? evaluation.motorProgress,
                        teacherObservation:
                            translated[`${evaluation.id}:teacherObservation`] ?? evaluation.teacherObservation,
                    })),
                );
            } catch {
                // Si falla la traducción se muestra el original
                setEvaluations(data);
            }
        } else {
            setEvaluations(data);
        }
        } catch {
        setError(t("admin.evaluations.loadError"));
        } finally {
        setLoading(false);
        }
    };

    return {
        evaluations,
        sourceEvaluations,
        loading,
        error,
        fetchEvaluations,
    };
}
