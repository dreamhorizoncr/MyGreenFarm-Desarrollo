import { apiClient } from './api.ts'
import type {
  Appointment,
  AppointmentRequest,
  AppointmentStatus,
  AvailableWeek,
} from '../types/appointment.ts'

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
}