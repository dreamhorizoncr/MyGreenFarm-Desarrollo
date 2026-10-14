import { useState, useRef } from "react";
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

interface CacheData {
    evaluations: Evaluation[];
    sourceEvaluations: Evaluation[];
}

export function useEvaluations() {
    const { t } = useTranslation();
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [sourceEvaluations, setSourceEvaluations] = useState<Evaluation[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cacheRef = useRef<Map<string, CacheData>>(new Map());

    const fetchEvaluations = async (lang?: string) => {
        const targetLang = lang?.split('-')[0] || 'es';
        const cacheKey = `${targetLang}`;

        if (cacheRef.current.has(cacheKey)) {
            const cached = cacheRef.current.get(cacheKey)!;
            setSourceEvaluations(cached.sourceEvaluations);
            setEvaluations(cached.evaluations);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const data = await evaluationService.getAll();
            const evaluationsList = data; 
            setSourceEvaluations(evaluationsList);

            const items = evaluationsList.flatMap((evaluation: Evaluation) =>
                TRANSLATABLE_FIELDS.flatMap((field) => {
                    const originalText = evaluation[field];
                    return originalText
                        ? [{ entityId: evaluation.id, fieldName: field, originalText }]
                        : [];
                }),
            );

            let processedEvaluations = evaluationsList;

            if (targetLang && items.length > 0) {
                try {
                    const translated = await evaluationService.translateBatch(ENTITY_TYPE, targetLang, items);
                    processedEvaluations = evaluationsList.map((evaluation: Evaluation) => ({
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
                    }));
                } catch {
                    processedEvaluations = evaluationsList;
                }
            }

            setEvaluations(processedEvaluations);

            cacheRef.current.set(cacheKey, {
                evaluations: processedEvaluations,
                sourceEvaluations: evaluationsList,
            });

        } catch (err) {
            console.error("Error al cargar evaluaciones:", err);
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