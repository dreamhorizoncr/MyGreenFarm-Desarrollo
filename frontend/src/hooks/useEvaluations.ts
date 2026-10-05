import { useState } from "react";

import { evaluationService } from "../services/evaluation";
import type { Evaluation } from "../types/evaluation";

export function useEvaluations() {
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchEvaluations = async () => {
        try {
        setLoading(true);
        setError(null);

        const data = await evaluationService.getAll();
        setEvaluations(data);
        } catch {
        setError("No se pudieron cargar las evaluaciones.");
        } finally {
        setLoading(false);
        }
    };

    return {
        evaluations,
        loading,
        error,
        fetchEvaluations,
    };
}