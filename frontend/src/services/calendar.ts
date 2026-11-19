import { apiClient } from './api.ts'
import type { CalendarEvent } from '../types/calendar.ts'

/** Events of the school's Google Calendar (`/api/calendar`). */
export const calendarService = {
  /**
   * @param from - first day, `yyyy-MM-dd`
   * @param to - last day, `yyyy-MM-dd`
   * @returns the events between both days
   */
  async getEvents(from: string, to: string): Promise<CalendarEvent[]> {
    const response = await apiClient.get<CalendarEvent[]>('/calendar/events', {
      params: { from, to },
    })
    return response.data
  },
}
