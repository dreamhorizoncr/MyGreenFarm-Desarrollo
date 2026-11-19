/** Kinds of events of the admin calendar. */
export type CalendarEventType = 'APPOINTMENT' | 'BIRTHDAY'

/** Event of the admin calendar: an appointment or a birthday. */
export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  /** Day of the event, `yyyy-MM-dd`. */
  date: string
  type: CalendarEventType
  allDay: boolean
}
