import { useState, useRef } from "react";
import { parentService } from "../services/parent";
import { getErrorMessage } from "../utils/error";

import type { Parent } from "../types/parent.ts";

interface CacheData {
    parents: Parent[];
    totalPages: number;
}

export function useParents() {
    const [parents, setParents] = useState<Parent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalPages, setTotalPages] = useState(0);

    const cacheRef = useRef<Map<number, CacheData>>(new Map());

    const fetchParents = async (page = 0) => {
        if (cacheRef.current.has(page)) {
            const cached = cacheRef.current.get(page)!;
            setParents(cached.parents);
            setTotalPages(cached.totalPages);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const data = await parentService.getParents(page);
            
            setParents(data.content);
            setTotalPages(data.totalPages);

            cacheRef.current.set(page, {
                parents: data.content,
                totalPages: data.totalPages,
            });

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
        totalPages,
    };
}