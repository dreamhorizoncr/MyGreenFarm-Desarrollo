import { useCallback, useState } from 'react'
import { calendarService } from '../services/calendar.ts'
import type { CalendarEvent } from '../types/calendar.ts'
import { getErrorMessage } from '../utils/error.ts'

export function useCalendarEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = useCallback(async (from: string, to: string) => {
    setLoading(true)
    setError(null)
    try {
      setEvents(await calendarService.getEvents(from, to))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  return { events, loading, error, fetchEvents }
}
