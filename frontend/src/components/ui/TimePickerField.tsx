import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ClockIcon } from '@animateicons/react/lucide'
import { usePopoverPosition } from '../../hooks/usePopoverPosition.ts'

interface TimePickerFieldProps {
  // Hora en formato HH:mm (24 h), o '' si no hay hora.
  value: string
  onChange: (value: string) => void
  id?: string
  ariaLabel?: string
  disabled?: boolean
  className?: string
}

type View = 'hours' | 'minutes'

const CLOCK_SIZE = 200
const CENTER = CLOCK_SIZE / 2
// Tamaño aproximado del panel (cabecera + esfera), para decidir hacia dónde abrirlo.
const PANEL_WIDTH = 260
const PANEL_HEIGHT = 290
const NUMBER_RADIUS = 76
const HOUR_LABELS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
const MINUTE_LABELS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

const pad = (value: number) => String(value).padStart(2, '0')

const parseTime = (value: string) => {
  const match = /^(\d{2}):(\d{2})/.exec(value)
  if (!match) return { hours: 12, minutes: 0 }
  return { hours: Number(match[1]), minutes: Number(match[2]) }
}

// Posición de un número en la esfera; el paso 0 queda arriba y avanza en sentido horario.
const pointAt = (step: number, steps: number, radius = NUMBER_RADIUS) => {
  const angle = (step / steps) * 2 * Math.PI
  return { x: CENTER + radius * Math.sin(angle), y: CENTER - radius * Math.cos(angle) }
}

const defaultTriggerClassName =
  'mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading'

// Reloj analógico para elegir la hora: primero la hora y después los minutos.
// Igual que DatePickerField, el panel va en línea (fixed) para funcionar dentro de modales sin que lo recorten.
function TimePickerField({
  value,
  onChange,
  id,
  ariaLabel,
  disabled = false,
  className = defaultTriggerClassName,
}: Readonly<TimePickerFieldProps>) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<View>('hours')
  const [dragging, setDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const position = usePopoverPosition({ triggerRef, open, width: PANEL_WIDTH, height: PANEL_HEIGHT, align: 'end' })
  const clockRef = useRef<HTMLDivElement>(null)

  const { hours, minutes } = parseTime(value)
  const isPm = hours >= 12
  const hours12 = hours % 12 === 0 ? 12 : hours % 12

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    // Escape cierra solo el reloj, no el modal que lo contiene: se escucha en captura,
    // antes que los manejadores del modal, y se cancela el evento.
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

  const emit = (nextHours: number, nextMinutes: number) => onChange(`${pad(nextHours)}:${pad(nextMinutes)}`)

  const setHour12 = (hour: number) => emit((hour % 12) + (isPm ? 12 : 0), minutes)
  const setMinutes = (minute: number) => emit(hours, minute)
  const setPeriod = (pm: boolean) => {
    if (pm !== isPm) emit((hours + 12) % 24, minutes)
  }

  const openPanel = () => {
    setView('hours')
    setOpen((current) => !current)
    if (!value) emit(12, 0)
  }

  // Convierte la posición del puntero en una hora o un minuto según la vista.
  const selectFromPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = clockRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = event.clientX - rect.left - rect.width / 2
    const y = event.clientY - rect.top - rect.height / 2
    const degrees = (Math.atan2(x, -y) * 180) / Math.PI
    const angle = (degrees + 360) % 360
    if (view === 'hours') {
      setHour12(Math.round(angle / 30) % 12 || 12)
    } else {
      setMinutes(Math.round(angle / 6) % 60)
    }
  }

  const finishSelection = () => {
    if (!dragging) return
    setDragging(false)
    if (view === 'hours') setView('minutes')
    else setOpen(false)
  }

  const handPoint = view === 'hours' ? pointAt(hours12 % 12, 12) : pointAt(minutes, 60)
  const handOnLabel = view === 'hours' || minutes % 5 === 0

  const label = value
    ? new Intl.DateTimeFormat(i18n.resolvedLanguage ?? i18n.language ?? 'es', { hour: 'numeric', minute: '2-digit', hour12: true }).format(
        new Date(2000, 0, 1, hours, minutes),
      )
    : '--:--'

  const headerSegmentClassName = (active: boolean) =>
    `rounded-lg px-1 font-heading text-4xl font-bold leading-none transition-colors ${active ? 'text-white' : 'text-white/60 hover:text-white/80'}`

  const periodClassName = (active: boolean) =>
    `rounded-lg px-2 py-0.5 font-body text-body-sm font-semibold transition-colors ${active ? 'bg-white text-green-600' : 'text-white/70 hover:text-white'}`

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
        onClick={openPanel}
        className={`flex items-center justify-between gap-sm text-left disabled:cursor-not-allowed disabled:bg-neutral-100 ${className}`}
      >
        <span className={`truncate ${value ? 'text-body-text' : 'text-neutral-400'}`}>{label}</span>
        <ClockIcon size={18} className="shrink-0 text-neutral-500" aria-hidden="true" />
      </button>

      {open && position && (
        // dialog no modal (open): margen y padding por defecto del navegador anulados.
        <dialog
          open
          aria-label={ariaLabel}
          style={{ top: position.top, bottom: position.bottom, left: position.left, width: PANEL_WIDTH }}
          className="fixed z-[9000] m-0 max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl border border-neutral-200 bg-white p-0 text-inherit shadow-lg"
        >
          <div className="flex items-center justify-center gap-md bg-green-500 px-md py-sm">
            <div className="flex items-center text-white">
              <button type="button" onClick={() => setView('hours')} className={headerSegmentClassName(view === 'hours')} aria-label={t('common.timePicker.hours')}>
                {pad(hours12)}
              </button>
              <span className="font-heading text-4xl font-bold leading-none text-white/60">:</span>
              <button type="button" onClick={() => setView('minutes')} className={headerSegmentClassName(view === 'minutes')} aria-label={t('common.timePicker.minutes')}>
                {pad(minutes)}
              </button>
            </div>
            <div className="flex flex-col gap-1">
              <button type="button" aria-pressed={!isPm} onClick={() => setPeriod(false)} className={periodClassName(!isPm)}>AM</button>
              <button type="button" aria-pressed={isPm} onClick={() => setPeriod(true)} className={periodClassName(isPm)}>PM</button>
            </div>
          </div>

          <div className="flex justify-center p-md">
            <div
              ref={clockRef}
              className={`relative shrink-0 touch-none select-none rounded-full bg-neutral-100 ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              style={{ width: CLOCK_SIZE, height: CLOCK_SIZE }}
              // La esfera recibe todo el puntero: se agarra la aguja desde cualquier punto y sigue al arrastrar.
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId)
                setDragging(true)
                selectFromPointer(event)
              }}
              onPointerMove={(event) => {
                if (dragging) selectFromPointer(event)
              }}
              onPointerUp={finishSelection}
              onPointerCancel={() => setDragging(false)}
            >
              <svg width={CLOCK_SIZE} height={CLOCK_SIZE} className="pointer-events-none absolute inset-0" aria-hidden="true">
                <line x1={CENTER} y1={CENTER} x2={handPoint.x} y2={handPoint.y} className="stroke-orange-500" strokeWidth={2} />
                <circle cx={CENTER} cy={CENTER} r={4} className="fill-orange-500" />
                <circle cx={handPoint.x} cy={handPoint.y} r={15} className="fill-orange-500" />
                {!handOnLabel && <circle cx={handPoint.x} cy={handPoint.y} r={3} className="fill-white" />}
              </svg>

              {(view === 'hours' ? HOUR_LABELS : MINUTE_LABELS).map((number, index) => {
                const point = pointAt(index, 12)
                const selected = view === 'hours' ? number === hours12 : number === minutes
                return (
                  <button
                    key={number}
                    type="button"
                    tabIndex={0}
                    aria-label={view === 'hours' ? `${number}` : pad(number)}
                    aria-pressed={selected}
                    // Con mouse/touch los maneja la esfera (pointer-events-none); el click queda para teclado.
                    onClick={() => {
                      if (view === 'hours') {
                        setHour12(number)
                        setView('minutes')
                      } else {
                        setMinutes(number)
                        setOpen(false)
                      }
                    }}
                    className={`pointer-events-none absolute flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-body text-body-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-link ${
                      selected ? 'text-white' : 'text-heading'
                    }`}
                    style={{ left: point.x, top: point.y }}
                  >
                    {view === 'hours' ? number : pad(number)}
                  </button>
                )
              })}
            </div>
          </div>
        </dialog>
      )}
    </div>
  )
}

export default TimePickerField
