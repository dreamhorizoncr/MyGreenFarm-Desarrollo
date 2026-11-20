import { apiClient } from './api.ts'
import type { ScheduleException, WeeklySchedule } from '../types/availability.ts'
import { translateBatch } from './translation.ts'

/** Opening hours for visits and their exceptions (`/api/admin/schedule`). */
export const availabilityService = {
  /** @returns the visiting hours of each weekday */
  async getWeekly(): Promise<WeeklySchedule[]> {
    const response = await apiClient.get<WeeklySchedule[]>('/admin/schedule/weekly')
    return response.data
  },

  /**
   * @param schedule - visiting hours of one weekday
   * @returns the saved hours
   */
  async saveWeekly(schedule: WeeklySchedule): Promise<WeeklySchedule> {
    const response = await apiClient.post<WeeklySchedule>('/admin/schedule/weekly', schedule)
    return response.data
  },

  /** @returns the days with different hours or closed, such as holidays */
  async getExceptions(): Promise<ScheduleException[]> {
    const response = await apiClient.get<ScheduleException[]>('/admin/schedule/exceptions')
    return response.data
  },

  /**
   * Creates or updates an exception.
   *
   * @param exception - the day and its hours, or closed
   * @returns the saved exception
   */
  async saveException(exception: ScheduleException): Promise<ScheduleException> {
    const response = await apiClient.post<ScheduleException>('/admin/schedule/exceptions', exception)
    return response.data
  },

  /** @param id - ID of the exception to delete */
  async deleteException(id: number): Promise<void> {
    await apiClient.delete(`/admin/schedule/exceptions/${id}`)
  },

  translateBatch,
}
