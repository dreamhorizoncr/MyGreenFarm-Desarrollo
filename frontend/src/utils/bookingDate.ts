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

export function toISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function isBookableWeekday(date: string): boolean {
  const day = new Date(`${date}T12:00:00`).getDay()
  return day >= 1 && day <= 5
}

export function getTomorrow(): Date {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  return tomorrow
}
