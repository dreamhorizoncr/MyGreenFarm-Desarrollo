import type { TFunction } from 'i18next'

export interface ScheduleValue {
  days: number[]
  start: string
  end: string
}

export const WEEK_DAYS = [1, 2, 3, 4, 5, 6, 7]

export const emptySchedule = (): ScheduleValue => ({ days: [], start: '', end: '' })

// Formato guardado en el backend: "1,2,3,4,5 07:00-17:00" (1 = lunes, 7 = domingo).
const SCHEDULE_PATTERN = /^([1-7](?:,[1-7])*) (\d{2}:\d{2})-(\d{2}:\d{2})$/

export function parseSchedule(value: string | null | undefined): ScheduleValue | null {
  const match = SCHEDULE_PATTERN.exec(value?.trim() ?? '')
  if (!match) return null
  const days = Array.from(new Set(match[1].split(',').map(Number))).sort((a, b) => a - b)
  return { days, start: match[2], end: match[3] }
}

export function serializeSchedule({ days, start, end }: ScheduleValue): string {
  return `${[...days].sort((a, b) => a - b).join(',')} ${start}-${end}`
}

export function validateSchedule({ days, start, end }: ScheduleValue, t: TFunction): string | null {
  if (days.length === 0) return t('common.schedule.daysRequired')
  if (!start || !end) return t('common.schedule.timesRequired')
  if (end <= start) return t('common.schedule.endAfterStart')
  return null
}

// 2 de enero de 2023 fue lunes: sirve para obtener el nombre de cada día en el idioma actual.
const dayDate = (day: number) => new Date(2023, 0, 1 + day)

export function dayName(day: number, language: string, style: 'long' | 'short' | 'narrow' = 'long'): string {
  return new Intl.DateTimeFormat(language, { weekday: style }).format(dayDate(day))
}

function formatTime(time: string, language: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  return new Intl.DateTimeFormat(language, { hour: 'numeric', minute: '2-digit', hour12: !language.startsWith('fr') }).format(
    new Date(2000, 0, 1, hours, minutes),
  )
}

function dayRuns(days: number[]): number[][] {
  return days.reduce<number[][]>((runs, day) => {
    const last = runs.at(-1)
    if (last && day === last.at(-1)! + 1) last.push(day)
    else runs.push([day])
    return runs
  }, [])
}

function capitalize(text: string): string {
  return text.charAt(0).toLocaleUpperCase() + text.slice(1)
}

export function formatSchedule(value: string | null | undefined, t: TFunction, language: string): string {
  const schedule = parseSchedule(value)
  if (!schedule) return value ?? ''

  const parts = dayRuns(schedule.days).flatMap((run) =>
    run.length >= 3
      ? [t('common.schedule.dayRange', { from: dayName(run[0], language), to: dayName(run.at(-1)!, language) })]
      : run.map((day) => dayName(day, language)),
  )
  const days = capitalize(new Intl.ListFormat(language, { style: 'long', type: 'conjunction' }).format(parts))
  const hours = t('common.schedule.timeRange', {
    from: formatTime(schedule.start, language),
    to: formatTime(schedule.end, language),
  })
  return `${days}, ${hours}`
}
