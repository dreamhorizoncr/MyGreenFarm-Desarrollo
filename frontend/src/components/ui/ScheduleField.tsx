import { useTranslation } from 'react-i18next'
import TimePickerField from './TimePickerField.tsx'
import { WEEK_DAYS, dayName, type ScheduleValue } from '../../utils/schedule.ts'

interface ScheduleFieldProps {
  id: string
  label: string
  value: ScheduleValue
  onChange: (value: ScheduleValue) => void
  error?: string | null
}

const dayClassName = (active: boolean) =>
  `flex h-10 min-w-10 flex-1 items-center justify-center rounded-full border px-sm font-body text-body-sm font-semibold capitalize transition-colors focus-visible:outline-2 focus-visible:outline-link ${
    active ? 'border-green-500 bg-green-500 text-white' : 'border-neutral-200 bg-white text-heading hover:border-green-500'
  }`

function ScheduleField({ id, label, value, onChange, error }: Readonly<ScheduleFieldProps>) {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? i18n.language ?? 'es'

  const toggleDay = (day: number) => {
    const days = value.days.includes(day) ? value.days.filter((item) => item !== day) : [...value.days, day]
    onChange({ ...value, days: days.sort((a, b) => a - b) })
  }

  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="p-0 font-body text-body-sm font-semibold text-heading">{label}</legend>

      <div id={`${id}-days`} className="mt-xs flex flex-wrap gap-xs">
        {WEEK_DAYS.map((day) => {
          const active = value.days.includes(day)
          return (
            <button
              key={day}
              type="button"
              aria-pressed={active}
              aria-label={dayName(day, language)}
              title={dayName(day, language)}
              onClick={() => toggleDay(day)}
              className={dayClassName(active)}
            >
              {dayName(day, language, 'short').replace('.', '')}
            </button>
          )
        })}
      </div>

      <div className="mt-sm grid grid-cols-2 gap-sm">
        <label htmlFor={`${id}-start`} className="font-body text-body-sm font-normal text-neutral-500">
          {t('common.schedule.from')}
          <TimePickerField
            id={`${id}-start`}
            value={value.start}
            onChange={(start) => onChange({ ...value, start })}
            ariaLabel={`${label} — ${t('common.schedule.from')}`}
          />
        </label>
        <label htmlFor={`${id}-end`} className="font-body text-body-sm font-normal text-neutral-500">
          {t('common.schedule.to')}
          <TimePickerField
            id={`${id}-end`}
            value={value.end}
            onChange={(end) => onChange({ ...value, end })}
            ariaLabel={`${label} — ${t('common.schedule.to')}`}
          />
        </label>
      </div>

      {error && <span className="mt-xs block font-body text-body-sm font-normal text-danger">{error}</span>}
    </fieldset>
  )
}

export default ScheduleField
