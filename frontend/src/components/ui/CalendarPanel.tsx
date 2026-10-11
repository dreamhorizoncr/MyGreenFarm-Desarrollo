import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Calendar, Button, ButtonGroup } from '@heroui/react'
import { today, getLocalTimeZone, startOfWeek, startOfMonth } from '@internationalized/date'
import { I18nProvider } from 'react-aria-components'
import type { CalendarDate } from '@internationalized/date'

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
  className?: string
}

const shortcutClassName =
  'rounded-2xl text-white font-medium hover:bg-green-400/40 transition-colors data-[pressed=true]:scale-95 px-8 py-2 disabled:opacity-50'

// Tarjeta de calendario compartida: la usan Citas y los selectores de fecha de los formularios.
function CalendarPanel({ value, onChange, markedDates, minValue, maxValue, ariaLabel, showShortcuts = true, className = '' }: Readonly<CalendarPanelProps>) {
  const { t, i18n } = useTranslation()
  const [focusedDate, setFocusedDate] = useState<CalendarDate>(value ?? today(getLocalTimeZone()))

  const isInRange = (date: CalendarDate) =>
    (!minValue || date.compare(minValue) >= 0) && (!maxValue || date.compare(maxValue) <= 0)

  const jumpTo = (date: CalendarDate) => {
    onChange(date)
    setFocusedDate(date)
  }

  const todayDate = today(getLocalTimeZone())
  const weekStart = startOfWeek(todayDate, i18n.language)
  const monthStart = startOfMonth(todayDate)

  return (
    <div className={`w-full max-w-[420px] rounded-2xl border border-neutral-200 bg-white p-lg shadow-sm flex flex-col items-center gap-6 ${className}`}>
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
          <Calendar.Header className="w-full flex justify-between items-center px-2 pb-4">
            <Calendar.Heading className="font-heading font-bold text-xl capitalize text-heading" />
            <div className="flex gap-2">
              <Calendar.NavButton slot="previous" />
              <Calendar.NavButton slot="next" />
            </div>
          </Calendar.Header>
          <Calendar.Grid className="w-full border-collapse">
            <Calendar.GridHeader className="mb-3">
              {(day) => <Calendar.HeaderCell className="w-10 h-10 text-center font-semibold text-md text-neutral-500">{day}</Calendar.HeaderCell>}
            </Calendar.GridHeader>
            <Calendar.GridBody>
              {(date) => {
                const isMarked = markedDates?.has(date.toString()) ?? false

                return (
                  <Calendar.Cell
                    date={date}
                    className={({ isOutsideMonth, isSelected, isDisabled }) =>
                      `relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors text-md font-medium mx-auto m-1
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

      <div className="flex flex-wrap justify-center gap-2 w-full pt-6 border-t border-neutral-100">
        <Button
          size="sm"
          variant="tertiary"
          onPress={() => onChange(null)}
          className="border-green-500 bg-white text-heading hover:bg-green-50 px-6 py-2 rounded-full border items-center justify-center font-body text-sm font-semibold transition-colors"
        >
          {t('teacherAppointments.calendar.clear')}
        </Button>
      </div>
    </div>
  )
}

export default CalendarPanel
