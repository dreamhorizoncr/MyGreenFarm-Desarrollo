import { useCallback, useRef, useState } from "react"
import i18n from "../i18n/index.ts"

import { groupService } from "../services/group"

import type { Group } from "../types/group"
import { translateBatch, type TranslationItem } from "../services/translation.ts"

interface CacheData {
    sourceGroups: Group[]
    groups: Group[]
}


/**
 * Groups for the admin list, with their descriptions translated and cached by language. A request
 * that finishes after a newer one is ignored.
 *
 * @returns the groups (translated and as stored), the loading and error state, `fetchGroups`,
 *   `refreshGroups` and `invalidateCache`
 */
export function useGroups() {
    const [groups, setGroups] = useState<Group[]>([])
    const [sourceGroups, setSourceGroups] = useState<Group[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const cacheRef = useRef<Map<string, CacheData>>(new Map())
    const requestIdRef = useRef(0)

    const invalidateCache = useCallback(() => {
        cacheRef.current.clear()
    }, [])

    const fetchGroups = useCallback(
        async (lang?: string, forceRefresh = false) => {
            const targetLang =
            lang?.split("-")[0] ||
            i18n.language?.split("-")[0] ||
            "es"

            const requestId = ++requestIdRef.current

            if (!forceRefresh) {
                const cached = cacheRef.current.get(targetLang)

                if (cached) {
                    setSourceGroups(cached.sourceGroups)
                    setGroups(cached.groups)
                    setError(null)
                    setLoading(false)
                    return
                }
            }

            try {
                setLoading(true)
                setError(null)

                const rawGroups = await groupService.getAll()

                if (requestId !== requestIdRef.current) return

                setSourceGroups(rawGroups)
                setGroups(rawGroups)

                let processedGroups = rawGroups

                const items: TranslationItem[] = rawGroups.flatMap(
                    (group) =>
                    group.description
                    ? [
                        {
                            entityId: String(group.id),
                            fieldName: "description",
                            originalText: group.description,
                        },
                    ]
                    : [],
                )

                if (items.length > 0 && targetLang !== "es") {
                    try {
                        const translations = await translateBatch("group", targetLang, items)

if (requestId !== requestIdRef.current) return

                        processedGroups = rawGroups.map((group) => ({
                            ...group,
                            description:
                            translations[`${group.id}:description`] ??
                            group.description,
                        }))
                    } catch {
                        // Keep the original descriptions.
                    }
                }

                if (requestId !== requestIdRef.current) return

                setGroups(processedGroups)

                cacheRef.current.set(targetLang, {
                    sourceGroups: rawGroups,
                    groups: processedGroups,
                })
            } catch {
                if (requestId !== requestIdRef.current) return

                setError(i18n.t("admin.groups.loadError"))
            } finally {
                if (requestId === requestIdRef.current) {
                    setLoading(false)
                }
            }
        },
        [],
    )

    const refreshGroups = useCallback(
        async (lang?: string) => {
            invalidateCache()
            await fetchGroups(lang, true)
        },
        [fetchGroups, invalidateCache],
    )

    return {
        groups,
        sourceGroups,
        loading,
        error,
        fetchGroups,
        refreshGroups,
        invalidateCache,
    }
}
