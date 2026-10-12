import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarDaysIcon } from '@animateicons/react/lucide'
import { parseDate } from '@internationalized/date'
import type { CalendarDate } from '@internationalized/date'
import CalendarPanel from './CalendarPanel.tsx'
import { placementClassName, placementFor, type PopoverPlacement } from '../../utils/popoverPlacement.ts'

interface DatePickerFieldProps {
  // Fecha en formato YYYY-MM-DD, o '' si no hay fecha.
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

// Alto aproximado del calendario compacto, para decidir si se abre hacia arriba.
const PANEL_HEIGHT = 290

const defaultTriggerClassName =
  'mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading'

// Reemplaza al input type="date" nativo: abre el mismo calendario que se usa en Citas.
// El panel se renderiza en linea (sin portal) para que funcione dentro de <dialog> con showModal().
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
  const [placement, setPlacement] = useState<PopoverPlacement>('bottom')
  const containerRef = useRef<HTMLDivElement>(null)
  const selected = toCalendarDate(value) ?? null

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
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
    <div
      ref={containerRef}
      className="relative"
      onKeyDown={(event) => {
        // Escape cierra solo el calendario, no el modal que lo contiene.
        if (event.key === 'Escape' && open) {
          event.preventDefault()
          event.stopPropagation()
          setOpen(false)
        }
      }}
    >
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={(event) => {
          if (!open) setPlacement(placementFor(event.currentTarget, PANEL_HEIGHT))
          setOpen((current) => !current)
        }}
        className={`flex items-center justify-between gap-sm text-left disabled:cursor-not-allowed disabled:bg-neutral-100 ${className}`}
      >
        <span className={`truncate ${selected ? 'text-body-text' : 'text-neutral-400'}`}>{label}</span>
        <CalendarDaysIcon size={18} className="shrink-0 text-neutral-500" aria-hidden="true" />
      </button>

      {open && (
        <div role="dialog" aria-label={ariaLabel} className={`absolute left-0 z-30 w-[300px] max-w-[calc(100vw-2rem)] ${placementClassName(placement)}`}>
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
        </div>
      )}
    </div>
  )
}

export default DatePickerField
