import { useState, useRef } from 'react'

import { childService } from '../services/child'
import { clubService } from '../services/clubs'
import type { Child } from '../types/child'

interface CacheData {
    content: Child[]
    totalPages: number
}

export function useChildren() {
    const [children, setChildren] = useState<Child[]>([])
    const [sourceChildren, setSourceChildren] = useState<Child[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [totalPages, setTotalPages] = useState(0)

    const cacheRef = useRef<Map<string, CacheData>>(new Map())

    const fetchChildren = async (page = 0, lang?: string) => {
        const targetLang = lang?.split('-')[0] || 'es'
        const cacheKey = `${page}-${targetLang}`

        if (cacheRef.current.has(cacheKey)) {
            const cached = cacheRef.current.get(cacheKey)!
            setSourceChildren(cached.content)
            setChildren(cached.content)
            setTotalPages(cached.totalPages)
            return
        }

        try {
            setLoading(true)
            setError(null)

            // Petición principal (Obligatoria para mostrar los datos)
            const data = await childService.getAll(page, 10)
            const rawContent = data.content
            
            setSourceChildren(rawContent)
            setTotalPages(data.totalPages)
            
            // Si la red es lenta, mostramos los datos base de inmediato para que el usuario no espere
            setChildren(rawContent)

            let processedContent = rawContent

            // Traducciones secundarias en segundo plano (Protegidas ante fallos de red)
            try {
                const notesItems = rawContent.flatMap((child) =>
                    child.medicalNotes
                        ? [{ entityId: String(child.id), fieldName: 'medicalNotes', originalText: child.medicalNotes }]
                        : [],
                )

                const notesTranslated: Record<string, string> = notesItems.length > 0 
                    ? await childService.translateBatch('child', targetLang, notesItems).catch(() => ({} as Record<string, string>))
                    : {}

                const translatedClubName = new Map<string, string>()
                try {
                    const catalog = await clubService.getAll({ size: 50 })
                    const idByName = new Map(catalog.content.map((club) => [club.name, String(club.id)]))
                    const seen = new Set<string>()
                    const clubItems = rawContent.flatMap((child) =>
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

                    for (const child of rawContent) {
                        for (const name of child.clubNames) {
                            const clubId = idByName.get(name)
                            if (clubId && !translatedClubName.has(name)) {
                                translatedClubName.set(name, clubTranslated[`${clubId}:name`] ?? name)
                            }
                        }
                    }
                } catch {
                    // Si el catálogo de clubes falla por red lenta, se omiten las traducciones de clubes silenciosamente
                }

                processedContent = rawContent.map((child) => ({
                    ...child,
                    medicalNotes:
                        notesTranslated[`${child.id}:medicalNotes`] ?? child.medicalNotes,
                    clubNames: child.clubNames.map(
                        (name) => translatedClubName.get(name) ?? name,
                    ),
                }))

                setChildren(processedContent)
            } catch {
                // Si la traducción masiva falla por completo, dejamos la data limpia en crudo
                processedContent = rawContent
            }

            // Guardamos en caché el resultado final
            cacheRef.current.set(cacheKey, {
                content: processedContent,
                totalPages: data.totalPages,
            })

        } catch (err) {
            // Si falla la petición principal pero teníamos algo en caché de emergencia, lo salvamos
            if (cacheRef.current.has(cacheKey)) {
                const cached = cacheRef.current.get(cacheKey)!
                setSourceChildren(cached.content)
                setChildren(cached.content)
                setTotalPages(cached.totalPages)
                setError(null)
            } else {
                console.error("Error crítico cargando niños:", err)
                setError('No se pudieron cargar los niños.')
            }
        } finally {
            setLoading(false)
        }
    }

    return {
        children,
        sourceChildren,
        loading,
        error,
        fetchChildren,
        totalPages,
    }
}