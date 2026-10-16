import type { TFunction } from 'i18next'

export interface ScheduleBlock {
  days: number[]
  start: string
  end: string
}

export type ScheduleValue = ScheduleBlock[]

export const WEEK_DAYS = [1, 2, 3, 4, 5, 6, 7]

export const emptyScheduleBlock = (): ScheduleBlock => ({ days: [], start: '', end: '' })

export const emptySchedule = (): ScheduleValue => [emptyScheduleBlock()]

// Formato guardado en el backend: "1,2,3,4,5 07:00-17:00; 6 08:00-12:00" (1 = lunes, 7 = domingo).
const BLOCK_PATTERN = /^([1-7](?:,[1-7])*) (\d{2}:\d{2})-(\d{2}:\d{2})$/
const BLOCK_SEPARATOR = '; '

const sortDays = (days: number[]) => Array.from(new Set(days)).sort((a, b) => a - b)

export function parseSchedule(value: string | null | undefined): ScheduleValue | null {
  const text = value?.trim()
  if (!text) return null
  const blocks: ScheduleValue = []
  for (const part of text.split(';')) {
    const match = BLOCK_PATTERN.exec(part.trim())
    if (!match) return null
    blocks.push({ days: sortDays(match[1].split(',').map(Number)), start: match[2], end: match[3] })
  }
  return blocks
}

export function serializeSchedule(schedule: ScheduleValue): string {
  return schedule
    .map(({ days, start, end }) => `${sortDays(days).join(',')} ${start}-${end}`)
    .join(BLOCK_SEPARATOR)
}

export function validateSchedule(schedule: ScheduleValue, t: TFunction): string | null {
  for (const { days, start, end } of schedule) {
    if (days.length === 0) return t('common.schedule.daysRequired')
    if (!start || !end) return t('common.schedule.timesRequired')
    if (end <= start) return t('common.schedule.endAfterStart')
  }
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

function formatBlock({ days, start, end }: ScheduleBlock, t: TFunction, language: string): string {
  const parts = dayRuns(days).flatMap((run) =>
    run.length >= 3
      ? [t('common.schedule.dayRange', { from: dayName(run[0], language), to: dayName(run.at(-1)!, language) })]
      : run.map((day) => dayName(day, language)),
  )
  const dayText = capitalize(new Intl.ListFormat(language, { style: 'long', type: 'conjunction' }).format(parts))
  const hours = t('common.schedule.timeRange', { from: formatTime(start, language), to: formatTime(end, language) })
  return `${dayText}, ${hours}`
}

export function formatScheduleLines(value: string | null | undefined, t: TFunction, language: string): string[] {
  const schedule = parseSchedule(value)
  if (!schedule) return value ? [value] : []
  return [...schedule]
    .sort((a, b) => a.days[0] - b.days[0])
    .map((block) => formatBlock(block, t, language))
}

export function formatSchedule(value: string | null | undefined, t: TFunction, language: string): string {
  return formatScheduleLines(value, t, language).join('\n')
}
