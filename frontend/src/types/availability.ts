/** Weekdays on which visits can be booked. */
export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY'

/** Visiting hours of a weekday. */
export interface WeeklySchedule {
  id?: number
  dayOfWeek: DayOfWeek
  /** Opening time, `HH:mm:ss`. */
  startTime: string
  /** Closing time, `HH:mm:ss`. */
  endTime: string
  /** Whether visits can be booked that weekday. */
  active: boolean
}

/** A day with different hours than usual, or closed. */
export interface ScheduleException {
  id?: number
  /** Day, `yyyy-MM-dd`. */
  exceptionDate: string
  startTime: string
  endTime: string
  /** Whether the school receives no visits that day. */
  closed: boolean
  reason?: string | null
}

/** Hours of a weekday being edited. */
export interface WeeklyScheduleDraft extends WeeklySchedule {
  /** Whether it has changes that are not saved. */
  dirty?: boolean
}

