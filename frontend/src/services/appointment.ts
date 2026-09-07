import { apiClient } from './api.ts'
import type {
  Appointment,
  AppointmentRequest,
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
}