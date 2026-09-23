import { useState } from "react";
import { expedientService } from "../services/expedient";
import { getErrorMessage } from "../utils/error";

import type { Expedient } from "../types/expedient.ts";

export function useExpedients() {
    const [expedients, setExpedients] = useState<Expedient[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

  // Obtiene todos los expedientes del backend
    const fetchExpedients = async () => {
        setLoading(true);
        setError(null);

    try {
        const data = await expedientService.getExpedients();
        setExpedients(data);
    } catch (err) {
        setError(getErrorMessage(err));
    } finally {
        setLoading(false);
    }
    };

    return {
        expedients,
        loading,
        error,
        fetchExpedients,
    };
}
