import type { Vacancy, VacancyInput } from '../types/vacancy.ts'
import { apiClient } from './api.ts'
import { translateBatch } from './translation.ts'

/** Job vacancies (`/api/vacancies`). */
export const vacancyService = {
  /** @returns all the vacancies, newest first */
  async getVacancies(): Promise<Vacancy[]> {
    const response = await apiClient.get<Vacancy[]>('/vacancies')
    return response.data
  },

  /**
   * @param data - title and description
   * @returns the created vacancy
   */
  async createVacancy(data: VacancyInput): Promise<Vacancy> {
    const response = await apiClient.post<Vacancy>('/vacancies', data)
    return response.data
  },

  /**
   * Opens or closes a vacancy to applications.
   *
   * @param id - vacancy's ID
   * @param isOpen - whether it accepts applications
   * @returns the updated vacancy
   */
  async setVacancyOpen(id: string, isOpen: boolean): Promise<Vacancy> {
    const response = await apiClient.patch<Vacancy>(`/vacancies/${id}/status`, null, { params: { isOpen } })
    return response.data
  },

  /**
   * Marks which application filled the vacancy.
   *
   * @param id - vacancy's ID
   * @param applicationId - the chosen application, or `null` to clear it
   * @returns the updated vacancy
   */
  async setVacancyFilledBy(id: string, applicationId: string | null): Promise<Vacancy> {
    const response = await apiClient.patch<Vacancy>(`/vacancies/${id}/filled-by`, null, { params: { applicationId } })
    return response.data
  },

  /** @param id - ID of the vacancy to delete */
  async deleteVacancy(id: string): Promise<void> {
    await apiClient.delete(`/vacancies/${id}`)
  },

  translateBatch,
}
