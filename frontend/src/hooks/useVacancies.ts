import { useState } from 'react'
import { vacancyService } from '../services/vacancy.ts'
import { getErrorMessage } from '../utils/error.ts'
import type { Vacancy, VacancyInput } from '../types/vacancy.ts'

export function useVacancies() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchVacancies = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await vacancyService.getVacancies()
      setVacancies(data)
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
