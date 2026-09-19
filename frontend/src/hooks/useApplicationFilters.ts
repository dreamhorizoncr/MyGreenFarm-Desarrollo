import { useState } from 'react'
import type { Curriculum } from '../types/curriculum.ts'
import type { Vacancy } from '../types/vacancy.ts'

export const ALL_VACANCIES = 'ALL'
export const SPONTANEOUS_APPLICATIONS = 'SPONTANEOUS'

export function useApplicationFilters(curriculums: Curriculum[], vacancies: Vacancy[]) {
  const [searchTerm, setSearchTerm] = useState('')
  const [vacancyFilter, setVacancyFilter] = useState(ALL_VACANCIES)

  const vacancyTitleById = new Map(vacancies.map((v) => [v.id, v.title]))

  const term = searchTerm.trim().toLowerCase()
  const filteredApplications = curriculums.filter((application) => {
    if (vacancyFilter === SPONTANEOUS_APPLICATIONS) {
      if (application.vacancyId !== null) return false
    } else if (vacancyFilter !== ALL_VACANCIES && application.vacancyId !== vacancyFilter) {
      return false
    }
    if (!term) return true
    return [application.applicantName, application.applicantEmail].some((field) =>
      field.toLowerCase().includes(term),
    )
  })

  return { searchTerm, setSearchTerm, vacancyFilter, setVacancyFilter, vacancyTitleById, filteredApplications }
}
