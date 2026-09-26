import { useMemo, useRef, useState } from 'react'
import { XIcon } from '@animateicons/react/lucide'
import useDismiss from '../hooks/useDismiss.ts'
import type { ScheduleException } from '../types/availability.ts'
import { DEFAULT_END_TIME, DEFAULT_START_TIME, toApiTime, timeValue } from '../types/availability.ts'

interface ScheduleExceptionModalProps {
  exception?: ScheduleException | null
  exceptions: ScheduleException[]
  onSave: (exception: ScheduleException) => Promise<void>
  onClose: () => void
}

const hours = Array.from({ length: 15 }, (_, index) => `${String(index + 6).padStart(2, '0')}:00`)

function todayIso() {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

function ScheduleExceptionModal({ exception, exceptions, onSave, onClose }: Readonly<ScheduleExceptionModalProps>) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [date, setDate] = useState(exception?.exceptionDate ?? '')
  const [closed, setClosed] = useState(exception?.closed ?? true)
  const [startTime, setStartTime] = useState(timeValue(exception?.startTime ?? DEFAULT_START_TIME))
  const [endTime, setEndTime] = useState(timeValue(exception?.endTime ?? DEFAULT_END_TIME))
  const [reason, setReason] = useState(exception?.reason ?? '')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useDismiss({ ref: overlayRef, isOpen: true, onClose, includeClickOutside: false })

  const existing = useMemo(
    () => exceptions.find((item) => item.exceptionDate === date && item.id !== exception?.id),
    [date, exception?.id, exceptions],
  )

  const handleDateChange = (nextDate: string) => {
    setDate(nextDate)
    const nextExisting = exceptions.find((item) => item.exceptionDate === nextDate && item.id !== exception?.id)
    if (nextExisting) {
      setClosed(nextExisting.closed)
      setStartTime(timeValue(nextExisting.startTime))
      setEndTime(timeValue(nextExisting.endTime))
      setReason(nextExisting.reason ?? '')
    }
  }

  const handleSubmit = async () => {
    if (!date) {
      setFormError('Selecciona una fecha.')
      return
    }
    const selectedDate = new Date(`${date}T00:00:00`)
    const day = selectedDate.getDay()
    if (date < todayIso() || day === 0 || day === 6) {
      setFormError('Selecciona una fecha futura de lunes a viernes.')
      return
    }
    if (!closed && endTime <= startTime) {
      setFormError('La hora Hasta debe ser mayor que la hora Desde.')
      return
    }

    setSaving(true)
    setFormError(null)
    try {
      await onSave({
        id: existing?.id ?? exception?.id,
        exceptionDate: date,
        startTime: toApiTime(closed ? DEFAULT_START_TIME : startTime),
        endTime: toApiTime(closed ? DEFAULT_END_TIME : endTime),
        closed,
        reason: reason.trim() || null,
      })
      onClose()
    } catch {
      setFormError('No se pudo guardar el día especial. Inténtalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[100] flex items-end justify-center bg-scrim p-0 md:items-center md:p-lg" onClick={(event) => event.target === overlayRef.current && onClose()}>
      <div className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-bg-card p-xl md:w-[min(560px,92vw)] md:rounded-2xl" role="dialog" aria-modal="true" aria-labelledby="exception-modal-title">
        <button type="button" onClick={onClose} aria-label="Cerrar" className="absolute right-md top-md inline-flex size-11 items-center justify-center rounded-full text-body-text focus-visible:outline-2 focus-visible:outline-link">
          <XIcon size={20} />
        </button>
        <h2 id="exception-modal-title" className="m-0 pr-12 font-heading text-2xl font-bold text-heading">
          {exception ? 'Editar día especial' : 'Agregar día especial'}
        </h2>
        <p className="mt-2 font-body text-sm text-neutral-500">Este día reemplaza tu horario normal.</p>

        <div className="mt-lg flex flex-col gap-md">
          <div>
            <label htmlFor="exception-date" className="mb-xs block font-body text-sm font-semibold text-body-text">Fecha</label>
            <input id="exception-date" type="date" min={todayIso()} value={date} onChange={(event) => { handleDateChange(event.target.value); setFormError(null) }} className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-md font-body text-base text-body-text focus:border-green-500 focus:outline-none" />
            {date && new Date(`${date}T00:00:00`).getDay() % 6 === 0 && <p className="mt-xs text-sm text-danger">Los fines de semana no están disponibles.</p>}
            {existing && <p className="mt-xs text-sm text-link">Ya existe una excepción para esta fecha; se actualizará.</p>}
          </div>

          <fieldset className="flex flex-col gap-sm">
            <legend className="mb-xs font-body text-sm font-semibold text-body-text">¿Cómo será ese día?</legend>
            <label className="flex min-h-12 cursor-pointer items-center gap-sm rounded-xl border border-neutral-200 px-md font-body text-base text-body-text">
              <input type="radio" name="exception-mode" checked={closed} onChange={() => setClosed(true)} className="size-5 accent-green-500" />
              <span>Cerrado todo el día</span>
            </label>
            <label className="flex min-h-12 cursor-pointer items-center gap-sm rounded-xl border border-neutral-200 px-md font-body text-base text-body-text">
              <input type="radio" name="exception-mode" checked={!closed} onChange={() => setClosed(false)} className="size-5 accent-green-500" />
              <span>Atiende solo en un horario</span>
            </label>
          </fieldset>

          {!closed && (
            <div className="grid grid-cols-2 gap-md">
              <label className="font-body text-sm font-semibold text-body-text">Desde<select value={startTime} onChange={(event) => setStartTime(event.target.value)} className="mt-xs h-12 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal text-base focus:border-green-500 focus:outline-none">{hours.slice(0, -1).map((hour) => <option key={hour}>{hour}</option>)}</select></label>
              <label className="font-body text-sm font-semibold text-body-text">Hasta<select value={endTime} onChange={(event) => setEndTime(event.target.value)} className="mt-xs h-12 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal text-base focus:border-green-500 focus:outline-none">{hours.slice(1).map((hour) => <option key={hour}>{hour}</option>)}</select></label>
            </div>
          )}

          <div>
            <label htmlFor="exception-reason" className="mb-xs block font-body text-sm font-semibold text-body-text">Motivo <span className="font-normal text-neutral-500">(opcional)</span></label>
            <input id="exception-reason" value={reason} maxLength={1000} onChange={(event) => setReason(event.target.value)} placeholder="Ej. Cita médica o feriado" className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-md font-body text-base focus:border-green-500 focus:outline-none" />
          </div>

          {formError && <p className="m-0 text-sm text-danger" role="alert">{formError}</p>}
          <div className="flex flex-col-reverse gap-xl sm:flex-row sm:justify-between">
            <button type="button" onClick={onClose} className="h-12 rounded-full border border-heading px-xl font-body font-semibold text-heading focus-visible:outline-2 focus-visible:outline-link">Cancelar</button>
            <button type="button" onClick={() => void handleSubmit()} disabled={saving} className="inline-flex h-12 items-center justify-center gap-sm rounded-full bg-green-500 px-xl font-body font-semibold text-white disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-link">
              {saving && <span className="size-4 animate-spin rounded-full border-2 border-white border-r-transparent" aria-hidden="true" />}
              Guardar día especial
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScheduleExceptionModal
