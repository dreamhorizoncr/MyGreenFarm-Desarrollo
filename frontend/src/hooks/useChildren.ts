import { useCallback, useState, useRef } from 'react'
import i18n from '../i18n/index.ts'

import { childService } from '../services/child'
import { clubService } from '../services/clubs'
import type { Child, ChildStatusFilter } from '../types/child'

interface CacheData {
    content: Child[]
    totalPages: number
}

async function translateClubNames(children: Child[], targetLang: string): Promise<Map<string, string>> {
    const translatedClubName = new Map<string, string>()

    try {
        const catalog = await clubService.getAll({ size: 50 })
        const idByName = new Map(catalog.content.map((club) => [club.name, String(club.id)]))
        const seen = new Set<string>()
        const clubItems = children.flatMap((child) =>
            child.clubNames.flatMap((name) => {
                const clubId = idByName.get(name)
                if (!clubId || seen.has(clubId)) return []
                seen.add(clubId)
                return [{ entityId: clubId, fieldName: 'name', originalText: name }]
            }),
        )

        const clubTranslated: Record<string, string> = clubItems.length > 0
            ? await clubService.translateBatch('club', targetLang, clubItems).catch(() => ({} as Record<string, string>))
            : {}

        for (const child of children) {
            for (const name of child.clubNames) {
                const clubId = idByName.get(name)
                if (clubId && !translatedClubName.has(name)) {
                    translatedClubName.set(name, clubTranslated[`${clubId}:name`] ?? name)
                }
            }
        }
    } catch {
        // Keep the original names without the clubs catalog
    }

    return translatedClubName
}

/**
 * Children for the admin list, with the names of their clubs translated. Pages are cached by status
 * and language.
 *
 * @returns the children (translated and as stored), the loading and error state, `fetchChildren`,
 *   `invalidateCache` and the number of pages
 */
export function useChildren() {
    const [children, setChildren] = useState<Child[]>([])
    const [sourceChildren, setSourceChildren] = useState<Child[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [totalPages, setTotalPages] = useState(0)

    const cacheRef = useRef<Map<string, CacheData>>(new Map())
    const requestIdRef = useRef(0)
    const invalidateCache = useCallback(() => {
        cacheRef.current.clear()
    }, [])

    const fetchChildren = useCallback(async (
        page = 0,
        lang?: string,
        status: ChildStatusFilter = 'ACTIVE',
        search = '',
    ) => {
        const requestId = ++requestIdRef.current
        const targetLang = lang?.split('-')[0] || 'es'
        const cacheKey = `${status}-${page}-${targetLang}-${search}`

        if (cacheRef.current.has(cacheKey)) {
            const cached = cacheRef.current.get(cacheKey)!
            setSourceChildren(cached.content)
            setChildren(cached.content)
            setTotalPages(cached.totalPages)
            setError(null)
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            setError(null)

            const data = await childService.getAll(page, 10, status, search)
            if (requestId !== requestIdRef.current) return

            const rawContent = data.content
            
            setSourceChildren(rawContent)
            setTotalPages(data.totalPages)
            
            setChildren(rawContent)

            let processedContent = rawContent

            try {
                const notesItems = rawContent.flatMap((child) =>
                    child.medicalNotes
                        ? [{ entityId: String(child.id), fieldName: 'medicalNotes', originalText: child.medicalNotes }]
                        : [],
                )

                const notesTranslated: Record<string, string> = notesItems.length > 0 
                    ? await childService.translateBatch('child', targetLang, notesItems).catch(() => ({} as Record<string, string>))
                    : {}

                const translatedClubName = await translateClubNames(rawContent, targetLang)

                processedContent = rawContent.map((child) => ({
                    ...child,
                    medicalNotes:
                        notesTranslated[`${child.id}:medicalNotes`] ?? child.medicalNotes,
                    clubNames: child.clubNames.map(
                        (name) => translatedClubName.get(name) ?? name,
                    ),
                }))

                if (requestId === requestIdRef.current) {
                    setChildren(processedContent)
                }
            } catch {
                processedContent = rawContent
            }

            if (requestId === requestIdRef.current) {
                cacheRef.current.set(cacheKey, {
                    content: processedContent,
                    totalPages: data.totalPages,
                })
            }

        } catch {
            if (requestId !== requestIdRef.current) return

            if (cacheRef.current.has(cacheKey)) {
                const cached = cacheRef.current.get(cacheKey)!
                setSourceChildren(cached.content)
                setChildren(cached.content)
                setTotalPages(cached.totalPages)
                setError(null)
            } else {
                setError(i18n.t('admin.children.loadError'))
            }
        } finally {
            if (requestId === requestIdRef.current) {
                setLoading(false)
            }
        }
    }, [])

    return {
        children,
        sourceChildren,
        loading,
        error,
        fetchChildren,
        invalidateCache,
        totalPages,
    }
}