import { useState } from 'react'

import { childService } from '../services/child'
import type { Child } from '../types/child'

export function useChildren() {
    const [children, setChildren] = useState<Child[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchChildren = async () => {
        try {
        setLoading(true)
        setError(null)

        const data = await childService.getAll()

        setChildren(data.content)
        } catch {
        setError('No se pudieron cargar los niños.')
        } finally {
        setLoading(false)
        }
    }

    return {
        children,
        loading,
        error,
        fetchChildren,
    }
}