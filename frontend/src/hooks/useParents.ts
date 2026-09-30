import { useState } from "react";
import { parentService } from "../services/parent";
import { getErrorMessage } from "../utils/error";

import type { Parent } from "../types/parent.ts";

export function useParents() {
    const [parents, setParents] = useState<Parent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

  // Obtiene todos los padres del backend
    const fetchParents = async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await parentService.getParents();
                setParents(data);
        } catch (err) {
        setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return {
        parents,
        loading,
        error,
        fetchParents,
    };
}