import { useState, useRef } from "react";
import { expedientService } from "../services/expedient";
import { getErrorMessage } from "../utils/error";

import type { Expedient } from "../types/expedient.ts";

const ENTITY_TYPE = "expedient";

interface CacheData {
    expedients: Expedient[];
    sourceExpedients: Expedient[];
    totalPages: number;
}

export function useExpedients() {
    const [expedients, setExpedients] = useState<Expedient[]>([]);
    const [sourceExpedients, setSourceExpedients] = useState<Expedient[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalPages, setTotalPages] = useState(0);

    const cacheRef = useRef<Map<string, CacheData>>(new Map());

    const fetchExpedients = async (page = 0, lang?: string) => {
        const targetLang = lang?.split('-')[0] || 'es';
        const cacheKey = `${page}-${targetLang}`;

        if (cacheRef.current.has(cacheKey)) {
            const cached = cacheRef.current.get(cacheKey)!;
            setSourceExpedients(cached.sourceExpedients);
            setExpedients(cached.expedients);
            setTotalPages(cached.totalPages);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const data = await expedientService.getExpedients(page);
            const rawContent = data.content;
            
            setSourceExpedients(rawContent);
            setTotalPages(data.totalPages);

            const items = rawContent.flatMap((expedient) =>
                expedient.generalObservations
                    ? [{ entityId: expedient.id, fieldName: 'generalObservations', originalText: expedient.generalObservations }]
                    : [],
            );

            let processedExpedients = rawContent;

            if (targetLang && items.length > 0) {
                try {
                    const translated = await expedientService.translateBatch(ENTITY_TYPE, targetLang, items);
                    processedExpedients = rawContent.map((expedient) => ({
                        ...expedient,
                        generalObservations:
                            translated[`${expedient.id}:generalObservations`] ?? expedient.generalObservations,
                    }));
                } catch {
                    processedExpedients = rawContent;
                }
            }

            setExpedients(processedExpedients);

            cacheRef.current.set(cacheKey, {
                expedients: processedExpedients,
                sourceExpedients: rawContent,
                totalPages: data.totalPages,
            });

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