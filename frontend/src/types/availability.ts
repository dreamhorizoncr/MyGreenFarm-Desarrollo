export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY'

export interface WeeklySchedule {
  id?: number
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  active: boolean
}

export interface ScheduleException {
  id?: number
  exceptionDate: string
  startTime: string
  endTime: string
  closed: boolean
  reason?: string | null
}

export interface WeeklyScheduleDraft extends WeeklySchedule {
  dirty?: boolean
}

export const WEEK_DAYS: Array<{ value: DayOfWeek; label: string }> = [
  { value: 'MONDAY', label: 'Lunes' },
  { value: 'TUESDAY', label: 'Martes' },
  { value: 'WEDNESDAY', label: 'Miércoles' },
  { value: 'THURSDAY', label: 'Jueves' },
  { value: 'FRIDAY', label: 'Viernes' },
]

export const DEFAULT_START_TIME = '06:00:00'
export const DEFAULT_END_TIME = '20:00:00'

export function timeValue(time: string): string {
  return time.slice(0, 5)
}

export function toApiTime(time: string): string {
  return time.length === 5 ? `${time}:00` : time
}
