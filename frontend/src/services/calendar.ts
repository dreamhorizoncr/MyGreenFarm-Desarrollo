import { apiClient } from './api.ts'
import type { CalendarEvent } from '../types/calendar.ts'

export const calendarService = {
  async getEvents(from: string, to: string): Promise<CalendarEvent[]> {
    const response = await apiClient.get<CalendarEvent[]>('/calendar/events', {
      params: { from, to },
    })
    return response.data
  },
}
