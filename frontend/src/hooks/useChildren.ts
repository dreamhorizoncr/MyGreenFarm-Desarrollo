import { useState } from 'react'

import { childService } from '../services/child'
import { clubService } from '../services/clubs'
import type { Child } from '../types/child'

export function useChildren() {
    const [children, setChildren] = useState<Child[]>([])
    const [sourceChildren, setSourceChildren] = useState<Child[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchChildren = async (lang?: string) => {
        try {
        setLoading(true)
        setError(null)

        const data = await childService.getAll()
        setSourceChildren(data.content)

        const targetLang = lang?.split('-')[0]
        if (!targetLang) {
            setChildren(data.content)
            return
        }

        try {
            // 1. Notas médicas: texto libre del niño (entityType "child").
            // Nombres, apellidos, studentId, fechas y relationship NO se traducen.
            const notesItems = data.content.flatMap((child) =>
                child.medicalNotes
                    ? [{ entityId: String(child.id), fieldName: 'medicalNotes', originalText: child.medicalNotes }]
                    : [],
            )
            const notesTranslated = await childService.translateBatch('child', targetLang, notesItems)

            // 2. Clubes del niño: llegan como nombres sin id; se resuelven contra
            // el catálogo y se traducen con entityType "club" (solo el nombre).
            const translatedClubName = new Map<string, string>()
            try {
                const catalog = await clubService.getAll({ size: 50 })
                const idByName = new Map(catalog.content.map((club) => [club.name, String(club.id)]))
                const seen = new Set<string>()
                const clubItems = data.content.flatMap((child) =>
                    child.clubNames.flatMap((name) => {
                        const clubId = idByName.get(name)
                        if (!clubId || seen.has(clubId)) return []
                        seen.add(clubId)
                        return [{ entityId: clubId, fieldName: 'name', originalText: name }]
                    }),
                )
                const clubTranslated = await clubService.translateBatch('club', targetLang, clubItems)
                for (const child of data.content) {
                    for (const name of child.clubNames) {
                        const clubId = idByName.get(name)
                        if (clubId && !translatedClubName.has(name)) {
                            translatedClubName.set(name, clubTranslated[`${clubId}:name`] ?? name)
                        }
                    }
                }
            } catch {
                // Si falla el catálogo o su traducción, las pills quedan en original
            }

            setChildren(
                data.content.map((child) => ({
                    ...child,
                    medicalNotes:
                        notesTranslated[`${child.id}:medicalNotes`] ?? child.medicalNotes,
                    clubNames: child.clubNames.map(
                        (name) => translatedClubName.get(name) ?? name,
                    ),
                })),
            )
        } catch {
            // Si falla la traducción se muestra el original
            setChildren(data.content)
        }
        } catch {
        setError('No se pudieron cargar los niños.')
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
    }
}
