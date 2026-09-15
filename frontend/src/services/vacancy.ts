import type { Vacancy, VacancyInput } from '../types/vacancy.ts'
import { SEED_VACANCIES } from '../data/vacancies.seed.ts'
import { createMockStore } from '../utils/mockStore.ts'

// No existe endpoint real todavía. Cuando lo haya, este archivo se ve
// igual que services/announcement.ts o services/appointment.ts (usando
// apiClient de ./api.ts), sin createMockStore ni SEED_VACANCIES:
//
// import { apiClient } from './api.ts'
//
// async getVacancies(): Promise<Vacancy[]> {
//   const response = await apiClient.get<Vacancy[]>('/vacancies')
//   return response.data
// }
//
// async createVacancy(data: VacancyInput): Promise<Vacancy> {
//   const response = await apiClient.post<Vacancy>('/vacancies', data)
//   return response.data
// }
//
// async setVacancyOpen(id: string, isOpen: boolean): Promise<Vacancy> {
//   const response = await apiClient.patch<Vacancy>(`/vacancies/${id}/status`, null, { params: { isOpen } })
//   return response.data
// }
//
// async setVacancyFilledBy(id: string, applicationId: string | null): Promise<Vacancy> {
//   const response = await apiClient.patch<Vacancy>(`/vacancies/${id}/filled-by`, null, { params: { applicationId } })
//   return response.data
// }
//
// async deleteVacancy(id: string): Promise<void> {
//   await apiClient.delete(`/vacancies/${id}`)
// }
const store = createMockStore<Vacancy>('mgf_mock_vacancies_v3', SEED_VACANCIES)

let mockVacancies: Vacancy[] = store.load()

const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms))

export const vacancyService = {
  async getVacancies(): Promise<Vacancy[]> {
    await delay()
    return mockVacancies.slice()
  },

  async createVacancy(data: VacancyInput): Promise<Vacancy> {
    await delay(500)
    const vacancy: Vacancy = {
      id: crypto.randomUUID(),
      title: data.title,
      description: data.description,
      isOpen: true,
      createdAt: new Date().toISOString(),
      filledByApplicationId: null,
    }
    mockVacancies.unshift(vacancy)
    store.save(mockVacancies)
    return vacancy
  },

  async setVacancyOpen(id: string, isOpen: boolean): Promise<Vacancy> {
    await delay(300)
    const target = mockVacancies.find((v) => v.id === id)
    if (!target) throw new Error('Vacancy not found')

    target.isOpen = isOpen
    store.save(mockVacancies)
    return target
  },

  async setVacancyFilledBy(id: string, applicationId: string | null): Promise<Vacancy> {
    await delay(300)
    const target = mockVacancies.find((v) => v.id === id)
    if (!target) throw new Error('Vacancy not found')

    target.filledByApplicationId = applicationId
    target.isOpen = applicationId === null
    store.save(mockVacancies)
    return target
  },

  async deleteVacancy(id: string): Promise<void> {
    await delay()
    mockVacancies = mockVacancies.filter((v) => v.id !== id)
    store.save(mockVacancies)
  },
}
