import { apiClient } from './api.ts'
import type { ScheduleException, WeeklySchedule } from '../types/availability.ts'

export const availabilityService = {
  async getWeekly(): Promise<WeeklySchedule[]> {
    const response = await apiClient.get<WeeklySchedule[]>('/admin/schedule/weekly')
    return response.data
  },

  async saveWeekly(schedule: WeeklySchedule): Promise<WeeklySchedule> {
    const response = await apiClient.post<WeeklySchedule>('/admin/schedule/weekly', schedule)
    return response.data
  },

  async getExceptions(): Promise<ScheduleException[]> {
    const response = await apiClient.get<ScheduleException[]>('/admin/schedule/exceptions')
    return response.data
  },

  async saveException(exception: ScheduleException): Promise<ScheduleException> {
    const response = await apiClient.post<ScheduleException>('/admin/schedule/exceptions', exception)
    return response.data
  },

  async deleteException(id: number): Promise<void> {
    await apiClient.delete(`/admin/schedule/exceptions/${id}`)
  },
}
