import { apiClient } from './api.ts'
import type {
  Appointment,
  AppointmentRequest,
  AppointmentPage,
  AppointmentStatus,
  AvailableWeek,
} from '../types/appointment.ts'
import { translateBatch } from './translation.ts'

/** Visit appointments (`/api/appointments`): booking them without an account and managing them. */
export const appointmentService = {
  /**
   * @param date - first day, `yyyy-MM-dd`
   * @returns the free slots of seven days starting no earlier than tomorrow
   */
  async getAvailableWeek(date: string): Promise<AvailableWeek> {
    const response = await apiClient.get<AvailableWeek>('/appointments/available-week', {
      params: { date },
    })
    return response.data
  },

  /**
   * @param date - day, `yyyy-MM-dd`
   * @returns the start times of that day's free slots
   */
  async getAvailableSlots(date: string): Promise<string[]> {
    const response = await apiClient.get<string[]>('/appointments/available-slots', {
      params: { date },
    })
    return response.data
  },

  /**
   * Holds a slot for ten minutes while the booking form is filled in.
   *
   * @param slot - start of the slot, ISO date and time
   * @param holderId - random ID of the form
   * @returns the held slot and when the hold expires
   */
  async holdSlot(slot: string, holderId: string): Promise<{ slot: string; expiresAt: string }> {
    const response = await apiClient.post<{ slot: string; expiresAt: string }>('/appointments/holds', { slot, holderId })
    return response.data
  },

  /** @param holderId - random ID of the form whose holds are released */
  async releaseHold(holderId: string): Promise<void> {
    await apiClient.post('/appointments/holds/release', null, { params: { holderId } })
  },

  /**
   * @param holderId - random ID of the form
   * @returns the URL that releases its holds, for `navigator.sendBeacon` when the page is closed
   */
  releaseHoldUrl(holderId: string): string {
    return `${apiClient.defaults.baseURL}/appointments/holds/release?holderId=${encodeURIComponent(holderId)}`
  },

  /** @returns the URL of the Server-Sent Events with the slots held, released or booked */
  slotEventsUrl(): string {
    return `${apiClient.defaults.baseURL}/appointments/holds/stream`
  },

  /**
   * Books the appointment of the held slot. Fails with 409 if the slot is no longer free.
   *
   * @param data - family's data, the slot and the hold's ID
   */
  async createAppointment(data: AppointmentRequest): Promise<void> {
    await apiClient.post('/appointments', data)
  },

  /**
   * @param params - page, filters and the limit for past appointments
   * @returns one page of appointments, sorted by date
   */
  async getAppointments(params: {
    page: number
    size: number
    status?: AppointmentStatus
    date?: string
    search?: string
    excludePast: boolean
    notBefore: string
  }): Promise<AppointmentPage> {
    const response = await apiClient.get<AppointmentPage>('/appointments', { params })
    return response.data
  },

  /**
   * @param id - appointment's ID
   * @param status - new status
   * @param conclusion - notes after the visit, optional
   * @param lang - language of the email to the family
   * @returns the updated appointment
   */
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

  /**
   * @param id - appointment's ID
   * @param newDate - new slot, ISO date and time
   * @param lang - language of the email to the family
   * @returns the updated appointment
   */
  async reschedule(id: string, newDate: string, lang = 'es'): Promise<Appointment> {
    const response = await apiClient.patch<Appointment>(
      `/appointments/${id}/reschedule`,
      null,
      { params: { newDate, lang } },
    )
    return response.data
  },
  translateBatch,
}