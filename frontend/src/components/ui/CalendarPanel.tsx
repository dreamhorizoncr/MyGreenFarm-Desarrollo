import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Calendar, Button, ButtonGroup } from '@heroui/react'
import { today, getLocalTimeZone, startOfWeek, startOfMonth } from '@internationalized/date'
import { I18nProvider } from 'react-aria-components'
import type { CalendarDate } from '@internationalized/date'
import Select from './Select.tsx'

interface CalendarPanelProps {
  value: CalendarDate | null
  onChange: (value: CalendarDate | null) => void
  // Fechas (YYYY-MM-DD) que llevan el punto naranja debajo del día.
  markedDates?: ReadonlySet<string>
  minValue?: CalendarDate
  maxValue?: CalendarDate
  ariaLabel?: string
  // Barra Hoy / Semana / Mes; solo la usa Citas.
  showShortcuts?: boolean
  // Versión más chica para los selectores de fecha dentro de modales.
  compact?: boolean
  className?: string
}

const SIZES = {
  regular: {
    card: 'max-w-[420px] p-lg gap-6',
    header: 'pb-4',
    gridHeader: 'mb-3',
    headCell: 'w-10 h-10 text-md',
    cell: 'h-9 w-9 text-md m-1',
    footer: 'pt-6',
    clear: 'px-6 py-2',
  },
  compact: {
    card: 'p-sm gap-1',
    header: 'pb-1',
    gridHeader: '',
    headCell: 'w-8 h-6 text-xs',
    cell: 'h-7 w-7 text-sm my-px',
    footer: '',
    clear: '',
  },
} as const

// Rango de años del selector cuando el campo no tiene mínimo o máximo.
const YEARS_BACK = 100
const YEARS_AHEAD = 10

const shortcutClassName =
  'rounded-2xl text-white font-medium hover:bg-green-400/40 transition-colors data-[pressed=true]:scale-95 px-8 py-2 disabled:opacity-50'

// Tarjeta de calendario compartida: la usan Citas y los selectores de fecha de los formularios.
function CalendarPanel({ value, onChange, markedDates, minValue, maxValue, ariaLabel, showShortcuts = true, compact = false, className = '' }: Readonly<CalendarPanelProps>) {
  const { t, i18n } = useTranslation()
  const size = SIZES[compact ? 'compact' : 'regular']
  const [focusedDate, setFocusedDate] = useState<CalendarDate>(value ?? today(getLocalTimeZone()))

  const isInRange = (date: CalendarDate) =>
    (!minValue || date.compare(minValue) >= 0) && (!maxValue || date.compare(maxValue) <= 0)

  const jumpTo = (date: CalendarDate) => {
    onChange(date)
    setFocusedDate(date)
  }

  const todayDate = today(getLocalTimeZone())
  const locale = i18n.resolvedLanguage ?? i18n.language ?? 'es'

  // Selectores de mes y año para saltar directo a fechas lejanas (p. ej. fechas de nacimiento)
  // sin tener que avanzar mes a mes con las flechas.
  const monthOptions = useMemo(() => {
    const format = new Intl.DateTimeFormat(locale, { month: 'long' })
    return Array.from({ length: 12 }, (_, index) => {
      const label = format.format(new Date(2000, index, 1))
      return { value: String(index + 1), label: label.charAt(0).toUpperCase() + label.slice(1) }
    })
  }, [locale])
  const firstYear = minValue?.year ?? todayDate.year - YEARS_BACK
  const lastYear = maxValue?.year ?? todayDate.year + YEARS_AHEAD
  const yearOptions = useMemo(
    () => Array.from({ length: lastYear - firstYear + 1 }, (_, index) => String(lastYear - index)).map((year) => ({ value: year, label: year })),
    [firstYear, lastYear],
  )
  const moveTo = (date: CalendarDate) => {
    if (minValue && date.compare(minValue) < 0) setFocusedDate(minValue)
    else if (maxValue && date.compare(maxValue) > 0) setFocusedDate(maxValue)
    else setFocusedDate(date)
  }
  const weekStart = startOfWeek(todayDate, i18n.language)
  const monthStart = startOfMonth(todayDate)

  return (
    <div className={`w-full rounded-2xl border border-neutral-200 bg-white shadow-sm flex flex-col items-center ${size.card} ${className}`}>
      {showShortcuts && (
        <ButtonGroup
          fullWidth
          size="sm"
          variant="tertiary"
          className="bg-green-500 text-white rounded-2xl p-1.5 shadow-inner flex justify-between w-full"
        >
          <Button className={shortcutClassName} isDisabled={!isInRange(todayDate)} onPress={() => jumpTo(todayDate)}>
            {t('teacherAppointments.calendar.today')}
          </Button>
          <Button className={shortcutClassName} isDisabled={!isInRange(weekStart)} onPress={() => jumpTo(weekStart)}>
            {t('teacherAppointments.calendar.week')}
          </Button>
          <Button className={shortcutClassName} isDisabled={!isInRange(monthStart)} onPress={() => jumpTo(monthStart)}>
            {t('teacherAppointments.calendar.month')}
          </Button>
        </ButtonGroup>
      )}

      <I18nProvider locale={i18n.resolvedLanguage ?? i18n.language ?? 'es'}>
        <Calendar
          aria-label={ariaLabel ?? t('teacherAppointments.calendar.ariaLabel')}
          focusedValue={focusedDate}
          value={value}
          onChange={onChange}
          onFocusChange={setFocusedDate}
          minValue={minValue}
          maxValue={maxValue}
          className="flex flex-col items-center w-full"
        >
          <Calendar.Header className={`w-full flex justify-between items-center gap-xs ${compact ? '' : 'px-2'} ${size.header}`}>
            <Calendar.Heading className="sr-only" />
            <div className="flex items-center gap-xs">
              <div className={compact ? 'w-[116px]' : 'w-[140px]'}>
                <Select
                  compact
                  value={String(focusedDate.month)}
                  onChange={(month) => moveTo(focusedDate.set({ month: Number(month) }))}
                  options={monthOptions}
                  aria-label={t('common.calendar.month')}
                  className="w-full rounded-lg border border-neutral-200 bg-white px-sm font-semibold text-heading"
                />
              </div>
              <div className={compact ? 'w-[90px]' : 'w-[96px]'}>
                <Select
                  compact
                  value={String(focusedDate.year)}
                  onChange={(year) => moveTo(focusedDate.set({ year: Number(year) }))}
                  options={yearOptions}
                  aria-label={t('common.calendar.year')}
                  className="w-full rounded-lg border border-neutral-200 bg-white px-sm font-semibold text-heading"
                />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Calendar.NavButton slot="previous" />
              <Calendar.NavButton slot="next" />
            </div>
          </Calendar.Header>
          <Calendar.Grid className="w-full border-collapse">
            <Calendar.GridHeader className={size.gridHeader}>
              {(day) => <Calendar.HeaderCell className={`text-center font-semibold text-neutral-500 ${size.headCell}`}>{day}</Calendar.HeaderCell>}
            </Calendar.GridHeader>
            <Calendar.GridBody>
              {(date) => {
                const isMarked = markedDates?.has(date.toString()) ?? false

                return (
                  <Calendar.Cell
                    date={date}
                    className={({ isOutsideMonth, isSelected, isDisabled }) =>
                      `relative flex shrink-0 items-center justify-center rounded-full transition-colors font-medium mx-auto ${size.cell}
                      ${isOutsideMonth || isDisabled ? 'text-neutral-300 opacity-60' : 'text-heading'}
                      ${isSelected ? 'bg-orange-500 shadow-md text-white' : 'hover:bg-neutral-100'}
                      ${isMarked && !isSelected ? 'after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:size-1.5 after:rounded-full after:bg-orange-500' : ''}`
                    }
                  />
                )
              }}
            </Calendar.GridBody>
          </Calendar.Grid>
        </Calendar>
      </I18nProvider>

      {compact && (
        <div className="flex w-full justify-end">
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded font-body text-caption font-semibold text-link underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-link"
          >
            {t('teacherAppointments.calendar.clear')}
          </button>
        </div>
      )}

      {!compact && (
        <div className={`flex flex-wrap justify-center gap-2 w-full border-t border-neutral-100 ${size.footer}`}>
          <Button
            size="sm"
            variant="tertiary"
            onPress={() => onChange(null)}
            className={`border-green-500 bg-white text-heading hover:bg-green-50 rounded-full border items-center justify-center font-body text-sm font-semibold transition-colors ${size.clear}`}
          >
            {t('teacherAppointments.calendar.clear')}
          </Button>
        </div>
      )}
    </div>
  )
}

export default CalendarPanel
