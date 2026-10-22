import { apiClient } from './api.ts'
import type {
  Appointment,
  AppointmentRequest,
  AppointmentStatus,
  AvailableWeek,
} from '../types/appointment.ts'
import type { TranslationItem } from './announcement.ts'

export const appointmentService = {
  async getAvailableWeek(date: string): Promise<AvailableWeek> {
    const response = await apiClient.get<AvailableWeek>('/appointments/available-week', {
      params: { date },
    })
    return response.data
  },

  async getAvailableSlots(date: string): Promise<string[]> {
    const response = await apiClient.get<string[]>('/appointments/available-slots', {
      params: { date },
    })
    return response.data
  },

  async holdSlot(slot: string, holderId: string): Promise<{ slot: string; expiresAt: string }> {
    const response = await apiClient.post<{ slot: string; expiresAt: string }>('/appointments/holds', { slot, holderId })
    return response.data
  },

  async releaseHold(holderId: string): Promise<void> {
    await apiClient.post('/appointments/holds/release', null, { params: { holderId } })
  },

  releaseHoldUrl(holderId: string): string {
    return `${apiClient.defaults.baseURL}/appointments/holds/release?holderId=${encodeURIComponent(holderId)}`
  },

  slotEventsUrl(): string {
    return `${apiClient.defaults.baseURL}/appointments/holds/stream`
  },

  async createAppointment(data: AppointmentRequest): Promise<Appointment> {
    const response = await apiClient.post<Appointment>('/appointments', data)
    return response.data
  },

  async getAppointments(): Promise<Appointment[]> {
    const response = await apiClient.get<Appointment[]>('/appointments')
    return response.data
  },

  async updateStatus(
    id: string,
    status: AppointmentStatus,
    conclusion?: string,
    lang = 'es',
  ): Promise<Appointment> {
    const response = await apiClient.patch<Appointment>(
      `/appointments/${id}/status`,
      null,
      { params: { status, conclusion, lang } },
    )
    return response.data
  },

  async reschedule(id: string, newDate: string, lang = 'es'): Promise<Appointment> {
    const response = await apiClient.patch<Appointment>(
      `/appointments/${id}/reschedule`,
      null,
      { params: { newDate, lang } },
    )
    return response.data
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