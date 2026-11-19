import { useCallback, useState, useRef } from "react";
import { parentService } from "../services/parent";
import { getErrorMessage } from "../utils/error";

import type { Parent } from "../types/parent.ts";

interface CacheData {
    parents: Parent[];
    totalPages: number;
}

/**
 * Parents for the admin list, with the pages cached.
 *
 * @returns the parents, the loading and error state, `fetchParents` (pass `forceRefresh` after a
 *   change, and the search text if any) and the number of pages
 */
export function useParents() {
    const [parents, setParents] = useState<Parent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalPages, setTotalPages] = useState(0);

    const cacheRef = useRef<Map<string, CacheData>>(new Map());
    const requestIdRef = useRef(0);

    const fetchParents = useCallback(async (page = 0, forceRefresh = false, search = "") => {
        const requestId = ++requestIdRef.current;
        const cacheKey = `${page}|${search}`;
        if (forceRefresh) {
            cacheRef.current.clear();
        } else if (cacheRef.current.has(cacheKey)) {
            const cached = cacheRef.current.get(cacheKey)!;
            setParents(cached.parents);
            setTotalPages(cached.totalPages);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const data = await parentService.getParents(page, 10, search);
            // a newer request (another page or search) already started
            if (requestId !== requestIdRef.current) return;
            
            setParents(data.content);
            setTotalPages(data.totalPages);

            cacheRef.current.set(cacheKey, {
                parents: data.content,
                totalPages: data.totalPages,
            });

        } catch (err) {
            if (requestId === requestIdRef.current) setError(getErrorMessage(err));
        } finally {
            if (requestId === requestIdRef.current) setLoading(false);
        }
    }, []);

    return {
        parents,
        loading,
        error,
        fetchParents,
        totalPages,
    };
}