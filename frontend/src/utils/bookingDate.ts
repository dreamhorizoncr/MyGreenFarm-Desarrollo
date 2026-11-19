/**
 * Translation key of each weekday (`Date.getDay()`) on which visits can be booked; `null` on weekends.
 */
export const WEEKDAY_BOOKING_KEYS: Record<
  number,
  'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | null
> = {
  0: null,
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: null,
}

/**
 * @param date - a date in local time
 * @returns the date as `yyyy-MM-dd`, without shifting it to UTC
 */
export function toISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * @param date - day as `yyyy-MM-dd`
 * @returns whether it falls from Monday to Friday
 */
export function isBookableWeekday(date: string): boolean {
  const day = new Date(`${date}T12:00:00`).getDay()
  return day >= 1 && day <= 5
}

/** @returns tomorrow at the current time, the first day that can be booked */
export function getTomorrow(): Date {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  return tomorrow
}
