import type { Vacancy, VacancyInput } from '../types/vacancy.ts'
import { apiClient } from './api.ts'
import type { TranslationItem } from './announcement.ts'

export const vacancyService = {
  async getVacancies(): Promise<Vacancy[]> {
    const response = await apiClient.get<Vacancy[]>('/vacancies')
    return response.data
  },

  async createVacancy(data: VacancyInput): Promise<Vacancy> {
    const response = await apiClient.post<Vacancy>('/vacancies', data)
    return response.data
  },

  async setVacancyOpen(id: string, isOpen: boolean): Promise<Vacancy> {
    const response = await apiClient.patch<Vacancy>(`/vacancies/${id}/status`, null, { params: { isOpen } })
    return response.data
  },

  async setVacancyFilledBy(id: string, applicationId: string | null): Promise<Vacancy> {
    const response = await apiClient.patch<Vacancy>(`/vacancies/${id}/filled-by`, null, { params: { applicationId } })
    return response.data
  },

  async deleteVacancy(id: string): Promise<void> {
    await apiClient.delete(`/vacancies/${id}`)
  },

  async translateBatch(entityType: string, targetLanguage: string, items: TranslationItem[]): Promise<Record<string, string>> {
    const response = await apiClient.post<Record<string, string>>('/translations/batch', {
      entityType,
      targetLanguage,
      items,
    })
    return response.data
  },
}
