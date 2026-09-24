import { useState } from 'react'
import { curriculumService } from '../services/curriculum.ts'
import { getErrorMessage } from '../utils/error.ts'
import i18n from '../i18n/index.ts'
import type { ApplicationInput, Curriculum, CurriculumStatus } from '../types/curriculum.ts'

function currentLang(): string {
  return (i18n.language ?? 'es').split('-')[0] ?? 'es'
}

export function useCurriculums() {
  const [curriculums, setCurriculums] = useState<Curriculum[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCurriculums = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await curriculumService.getCurriculums()
      setCurriculums(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const submitApplication = async (data: ApplicationInput) => {
    setLoading(true)
    setError(null)
    try {
      const created = await curriculumService.submitApplication(data)
      setCurriculums((prev) => [created].concat(prev))
    } catch (err) {
      setError(getErrorMessage(err))
      throw err
    } finally {
      setLoading(false)
    }
  }

  const setCurriculumStatus = async (id: string, status: CurriculumStatus) => {
    setLoading(true)
    setError(null)
    try {
      const updated = await curriculumService.setCurriculumStatus(id, status, currentLang())
      setCurriculums((prev) => prev.map((c) => (c.id === id ? updated : c)))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const deleteCurriculum = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      await curriculumService.deleteCurriculum(id)
      setCurriculums((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      setError(getErrorMessage(err))
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { curriculums, loading, error, fetchCurriculums, submitApplication, setCurriculumStatus, deleteCurriculum }
}
