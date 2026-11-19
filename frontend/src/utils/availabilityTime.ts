import type { DayOfWeek } from '../types/availability.ts'

/** Weekdays on which visits can be booked, in order. */
export const BOOKING_WEEK_DAYS: Array<{ value: DayOfWeek }> = [
  { value: 'MONDAY' },
  { value: 'TUESDAY' },
  { value: 'WEDNESDAY' },
  { value: 'THURSDAY' },
  { value: 'FRIDAY' },
]

/** Opening time proposed for a new day or exception. */
export const DEFAULT_START_TIME = '06:00:00'

/** Closing time proposed for a new day or exception. */
export const DEFAULT_END_TIME = '20:00:00'

/**
 * @param time - time as the API sends it, `HH:mm:ss`
 * @returns the time for an `<input type="time">`, `HH:mm`
 */
export function timeValue(time: string): string {
  return time.slice(0, 5)
}

/**
 * @param time - time from an `<input type="time">`, `HH:mm`
 * @returns the time as the API expects it, `HH:mm:ss`
 */
export function toApiTime(time: string): string {
  return time.length === 5 ? `${time}:00` : time
}
