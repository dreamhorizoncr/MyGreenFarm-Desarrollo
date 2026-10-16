import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarDaysIcon } from '@animateicons/react/lucide'
import { parseDate } from '@internationalized/date'
import type { CalendarDate } from '@internationalized/date'
import CalendarPanel from './CalendarPanel.tsx'
import { usePopoverPosition } from '../../hooks/usePopoverPosition.ts'

interface DatePickerFieldProps {
  value: string
  onChange: (value: string) => void
  min?: string
  max?: string
  id?: string
  ariaLabel?: string
  disabled?: boolean
  className?: string
}

const toCalendarDate = (value?: string): CalendarDate | undefined => {
  if (!value) return undefined
  try {
    return parseDate(value.slice(0, 10))
  } catch {
    return undefined
  }
}

const PANEL_WIDTH = 300
const PANEL_HEIGHT = 290

const defaultTriggerClassName =
  'mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading'

function DatePickerField({
  value,
  onChange,
  min,
  max,
  id,
  ariaLabel,
  disabled = false,
  className = defaultTriggerClassName,
}: Readonly<DatePickerFieldProps>) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const position = usePopoverPosition({ triggerRef, open, width: PANEL_WIDTH, height: PANEL_HEIGHT })
  const selected = toCalendarDate(value) ?? null

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown, true)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [open])

  const handleChange = (date: CalendarDate | null) => {
    onChange(date ? date.toString() : '')
    setOpen(false)
  }

  const label = selected
    ? new Intl.DateTimeFormat(i18n.resolvedLanguage ?? i18n.language ?? 'es', { dateStyle: 'medium' }).format(
        new Date(selected.year, selected.month - 1, selected.day),
      )
    : t('common.selectDate')

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`flex items-center justify-between gap-sm text-left disabled:cursor-not-allowed disabled:bg-neutral-100 ${className}`}
      >
        <span className={`truncate ${selected ? 'text-body-text' : 'text-neutral-400'}`}>{label}</span>
        <CalendarDaysIcon size={18} className="shrink-0 text-neutral-500" aria-hidden="true" />
      </button>

      {open && position && (
        <dialog
          open
          aria-label={ariaLabel}
          style={{ top: position.top, bottom: position.bottom, left: position.left, width: PANEL_WIDTH }}
          className="fixed z-[9000] m-0 max-w-[calc(100vw-1rem)] border-0 bg-transparent p-0 text-inherit"
        >
          <CalendarPanel
            value={selected}
            onChange={handleChange}
            minValue={toCalendarDate(min)}
            maxValue={toCalendarDate(max)}
            ariaLabel={ariaLabel}
            showShortcuts={false}
            compact
            className="shadow-lg"
          />
        </dialog>
      )}
    </div>
  )
}

export default DatePickerField
