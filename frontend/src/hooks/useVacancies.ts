import { useState } from 'react'
import { vacancyService } from '../services/vacancy.ts'
import { getErrorMessage } from '../utils/error.ts'
import type { Vacancy, VacancyInput } from '../types/vacancy.ts'

const SOURCE_LANG = 'es'
const ENTITY_TYPE = 'vacancy'

export function useVacancies() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchVacancies = async (lang: string = SOURCE_LANG) => {
    setLoading(true)
    setError(null)
    try {
      const data = await vacancyService.getVacancies()
      // Se muestran de una vez sin traducir: así, si la traducción falla, el
      // contenido original sigue visible en vez de quedar en blanco.
      setVacancies(data)

      // No asumimos que el admin siempre escribe en español: aunque se esté
      // viendo en "es", se pide la traducción igual (como hace el foro), para
      // que una vacante redactada en otro idioma también se traduzca.
      try {
        const items = data.flatMap((v) => [
          { entityId: v.id, fieldName: 'title', originalText: v.title },
          { entityId: v.id, fieldName: 'description', originalText: v.description },
        ])
        const translated = await vacancyService.translateBatch(ENTITY_TYPE, lang, items)
        setVacancies(data.map((v) => ({
          ...v,
          title: translated[`${v.id}:title`] ?? v.title,
          description: translated[`${v.id}:description`] ?? v.description,
        })))
      } catch {
        // Se deja el contenido original visible si la traducción no está disponible.
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const createVacancy = async (data: VacancyInput) => {
    setLoading(true)
    setError(null)
    try {
      const created = await vacancyService.createVacancy(data)
      setVacancies((prev) => [created].concat(prev))
    } catch (err) {
      setError(getErrorMessage(err))
      throw err
    } finally {
      setLoading(false)
    }
  }

  const setVacancyOpen = async (id: string, isOpen: boolean) => {
    setLoading(true)
    setError(null)
    try {
      const updated = await vacancyService.setVacancyOpen(id, isOpen)
      setVacancies((prev) => prev.map((v) => (v.id === id ? updated : v)))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const setVacancyFilledBy = async (id: string, applicationId: string | null) => {
    setLoading(true)
    setError(null)
    try {
      const updated = await vacancyService.setVacancyFilledBy(id, applicationId)
      setVacancies((prev) => prev.map((v) => (v.id === id ? updated : v)))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const deleteVacancy = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      await vacancyService.deleteVacancy(id)
      setVacancies((prev) => prev.filter((v) => v.id !== id))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return { vacancies, loading, error, fetchVacancies, createVacancy, setVacancyOpen, setVacancyFilledBy, deleteVacancy }
}
