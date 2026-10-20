import { useTranslation } from 'react-i18next'
import { PlusIcon, Trash2Icon } from '@animateicons/react/lucide'
import TimePickerField from './TimePickerField.tsx'
import { WEEK_DAYS, dayName, emptyScheduleBlock, type ScheduleBlock, type ScheduleValue } from '../../utils/schedule.ts'

interface ScheduleFieldProps {
  id: string
  label: string
  value: ScheduleValue
  onChange: (value: ScheduleValue) => void
  error?: string | null
}

const dayClassName = (active: boolean) =>
  `flex h-10 min-w-0 items-center justify-center rounded-full border px-0 font-body text-caption font-semibold capitalize sm:text-body-sm transition duration-300 focus-visible:outline-2 focus-visible:outline-link disabled:cursor-not-allowed disabled:border-neutral-100 disabled:bg-neutral-50 disabled:text-neutral-300 ${
    active ? 'border-green-500 bg-green-500 text-white' : 'border-green-500 bg-white text-heading hover:bg-green-50'
  }`

function ScheduleField({ id, label, value, onChange, error }: Readonly<ScheduleFieldProps>) {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? i18n.language ?? 'es'
  const usedDays = new Set(value.flatMap((block) => block.days))
  const canAddBlock = usedDays.size < WEEK_DAYS.length

  const updateBlock = (index: number, block: ScheduleBlock) =>
    onChange(value.map((item, position) => (position === index ? block : item)))

  const toggleDay = (index: number, day: number) => {
    const block = value[index]
    const days = block.days.includes(day) ? block.days.filter((item) => item !== day) : [...block.days, day]
    updateBlock(index, { ...block, days: days.toSorted((a, b) => a - b) })
  }

  const removeBlock = (index: number) => onChange(value.filter((_, position) => position !== index))

  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="p-0 font-body text-body-sm font-semibold text-heading">{label}</legend>

      <div className="mt-xs flex flex-col gap-sm">
        {value.map((block, index) => {
          const blockId = `${id}-${index}`
          return (
            <div key={blockId} className="rounded-xl border border-neutral-200 p-sm">
              <div className="flex items-start gap-xs">
                <div id={`${blockId}-days`} className="grid min-w-0 flex-1 grid-cols-7 gap-1 sm:gap-xs">
                  {WEEK_DAYS.map((day) => {
                    const active = block.days.includes(day)
                    return (
                      <button
                        key={day}
                        type="button"
                        aria-pressed={active}
                        aria-label={dayName(day, language)}
                        title={dayName(day, language)}
                        disabled={!active && usedDays.has(day)}
                        onClick={() => toggleDay(index, day)}
                        className={dayClassName(active)}
                      >
                        {dayName(day, language, 'short').replace('.', '')}
                      </button>
                    )
                  })}
                </div>
                {value.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeBlock(index)}
                    aria-label={t('common.schedule.removeBlock')}
                    title={t('common.schedule.removeBlock')}
                    className="flex size-10 shrink-0 items-center justify-center rounded-full border border-danger text-danger transition-colors hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-link"
                  >
                    <Trash2Icon size={16} aria-hidden="true" />
                  </button>
                )}
              </div>

              <div className="mt-sm grid grid-cols-2 gap-sm">
                <label htmlFor={`${blockId}-start`} className="font-body text-body-sm font-semibold text-heading">
                  {t('common.schedule.from')}
                  <TimePickerField
                    id={`${blockId}-start`}
                    value={block.start}
                    onChange={(start) => updateBlock(index, { ...block, start })}
                    ariaLabel={`${label} — ${t('common.schedule.from')}`}
                  />
                </label>
                <label htmlFor={`${blockId}-end`} className="font-body text-body-sm font-semibold text-heading">
                  {t('common.schedule.to')}
                  <TimePickerField
                    id={`${blockId}-end`}
                    value={block.end}
                    onChange={(end) => updateBlock(index, { ...block, end })}
                    ariaLabel={`${label} — ${t('common.schedule.to')}`}
                  />
                </label>
              </div>
            </div>
          )
        })}
      </div>

      {canAddBlock && (
        <button
          type="button"
          onClick={() => onChange([...value, emptyScheduleBlock()])}
          className="mt-sm inline-flex items-center gap-xs rounded-full border border-green-500 px-md py-xs font-body text-body-sm font-semibold text-green-600 transition-colors hover:bg-green-50 focus-visible:outline-2 focus-visible:outline-link"
        >
          <PlusIcon size={16} aria-hidden="true" />
          {t('common.schedule.addBlock')}
        </button>
      )}

      {error && <span className="mt-xs block font-body text-body-sm font-normal text-danger">{error}</span>}
    </fieldset>
  )
}

export default ScheduleField
