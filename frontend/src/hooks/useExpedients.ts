import { useState } from "react";
import { expedientService } from "../services/expedient";
import { getErrorMessage } from "../utils/error";

import type { Expedient } from "../types/expedient.ts";

const ENTITY_TYPE = "expedient";

export function useExpedients() {
    const [expedients, setExpedients] = useState<Expedient[]>([]);
    const [sourceExpedients, setSourceExpedients] = useState<Expedient[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [totalPages, setTotalPages] = useState(0);
    const fetchExpedients = async (page = 0, lang?: string) => {
        setLoading(true);
        setError(null);

    try {
        const data = await expedientService.getExpedients(page);
        setSourceExpedients(data.content);
        setTotalPages(data.totalPages);

        const targetLang = lang?.split('-')[0];
        const items = data.content.flatMap((expedient) =>
            expedient.generalObservations
                ? [{ entityId: expedient.id, fieldName: 'generalObservations', originalText: expedient.generalObservations }]
                : [],
        );

        if (targetLang && items.length > 0) {
            try {
                const translated = await expedientService.translateBatch(ENTITY_TYPE, targetLang, items);
                setExpedients(
                    data.content.map((expedient) => ({
                        ...expedient,
                        generalObservations:
                            translated[`${expedient.id}:generalObservations`] ?? expedient.generalObservations,
                    })),
                );
            } catch {
                setExpedients(data.content);
            }
        } else {
            setExpedients(data.content);
        }
    } catch (err) {
        setError(getErrorMessage(err));
    } finally {
        setLoading(false);
    }
    };

    return {
        expedients,
        sourceExpedients,
        loading,
        error,
        fetchExpedients,
        totalPages,
    };
}
