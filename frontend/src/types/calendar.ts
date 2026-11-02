export type CalendarEventType = 'APPOINTMENT' | 'BIRTHDAY'

export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  date: string
  type: CalendarEventType
  allDay: boolean
}
