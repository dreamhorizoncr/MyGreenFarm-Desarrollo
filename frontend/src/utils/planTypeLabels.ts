const PLAN_TYPE_LABELS: Record<string, string> = {
  ONE_TIME: 'services.oneTime',
  DAILY: 'services.daily',
  WEEKLY: 'services.weekly',
  TWO_WEEKS: 'services.biweekly',
  MONTHLY: 'services.monthly',
  SIX_MONTHS: 'services.sixMonths',
  ANNUALLY: 'services.annual',
  CUSTOM: 'services.custom',
  CUSTOM_WEEKLY: 'services.customWeekly',
  CUSTOM_MONTHLY: 'services.customMonthly',
}

const INTERVAL_UNITS: Record<string, string> = {
  MONTHS: 'services.months',
  YEARS: 'services.years',
  WEEKS: 'services.weeks',
  DAYS: 'services.days',
}

export function getPlanTypeLabel(type: string, t: (key: string) => string): string {
  const exact = PLAN_TYPE_LABELS[type]
  if (exact) return t(exact)

  const match = type.match(/^(\d+)_(.+)$/)
  if (match) {
    const count = match[1]
    const unitKey = INTERVAL_UNITS[match[2]]
    if (unitKey) return `${count} ${t(unitKey)}`
  }

  return type
}
