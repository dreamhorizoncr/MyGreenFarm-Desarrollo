import { useMemo, useState } from 'react'
import { CopyIcon, PencilIcon, PlusIcon, Trash2Icon } from '@animateicons/react/lucide'
import AdminLayout from '../layout/AdminLayout.tsx'
import ScheduleExceptionModal from '../components/ScheduleExceptionModal.tsx'
import { useAvailability } from '../hooks/useAvailability.ts'
import type { ScheduleException, WeeklySchedule } from '../types/availability.ts'
import { DEFAULT_END_TIME, DEFAULT_START_TIME, timeValue, toApiTime, WEEK_DAYS } from '../types/availability.ts'

const hours = Array.from({ length: 15 }, (_, index) => `${String(index + 6).padStart(2, '0')}:00`)

function initialWeekly(): WeeklySchedule[] {
  return WEEK_DAYS.map(({ value }) => ({ dayOfWeek: value, startTime: DEFAULT_START_TIME, endTime: DEFAULT_END_TIME, active: false }))
}

function weeklyDraftFromSaved(weekly: WeeklySchedule[]): WeeklySchedule[] {
  return initialWeekly().map((day) => {
    const saved = weekly.find((item) => item.dayOfWeek === day.dayOfWeek)
    return saved ? { ...day, ...saved, startTime: timeValue(saved.startTime), endTime: timeValue(saved.endTime) } : day
  })
}

function dateLabel(date: string) {
  return new Intl.DateTimeFormat('es', { dateStyle: 'long' }).format(new Date(`${date}T00:00:00`))
}

function OwnerAvailabilityPage() {
  const { weekly, exceptions, loading, error, weeklySaving, weeklyError, exceptionError, weeklySuccess, saveWeekly, saveException, deleteException } = useAvailability()
  const [draft, setDraft] = useState<WeeklySchedule[] | null>(null)
  const [exceptionModal, setExceptionModal] = useState<ScheduleException | null | undefined>(undefined)

  const visibleDraft = draft ?? weeklyDraftFromSaved(weekly)

  const isDirty = useMemo(() => {
    const normalize = (item: WeeklySchedule) => ({
      dayOfWeek: item.dayOfWeek,
      startTime: timeValue(item.startTime),
      endTime: timeValue(item.endTime),
      active: item.active,
    })
    return JSON.stringify(visibleDraft.map(normalize)) !== JSON.stringify(weeklyDraftFromSaved(weekly).map(normalize))
  }, [visibleDraft, weekly])

  const updateDay = (dayOfWeek: WeeklySchedule['dayOfWeek'], changes: Partial<WeeklySchedule>) => {
    setDraft((current) => (current ?? visibleDraft).map((day) => day.dayOfWeek === dayOfWeek ? { ...day, ...changes } : day))
  }

  const copyToAll = (source: WeeklySchedule) => {
    setDraft((current) => (current ?? visibleDraft).map((day) => ({ ...day, startTime: source.startTime, endTime: source.endTime, active: source.active })))
  }

  const handleSaveWeekly = async () => {
    await saveWeekly(visibleDraft.map((day) => ({ ...day, startTime: toApiTime(day.startTime), endTime: toApiTime(day.endTime) })))
  }

  const futureExceptions = exceptions.filter((item) => item.exceptionDate >= new Date().toISOString().slice(0, 10)).sort((a, b) => a.exceptionDate.localeCompare(b.exceptionDate))

  const openException = (exception?: ScheduleException) => setExceptionModal(exception ?? null)

  return (
    <AdminLayout>
      <div className="pb-8">
        <h1 className="m-0 font-heading text-[34px] font-bold leading-[1.15] text-heading">Mi disponibilidad</h1>
        <p className="mt-2 font-body text-base text-neutral-500">Configura los días y horarios en los que atiendes.</p>

        {loading && <p className="mt-xl text-center font-body text-base text-neutral-500">Cargando disponibilidad...</p>}
        {error && !loading && <div className="mt-xl rounded-2xl border border-red-200 bg-red-50 p-lg text-center font-body text-danger"><p className="m-0">{error}</p><button type="button" onClick={() => window.location.reload()} className="mt-sm rounded-full bg-danger px-lg py-sm font-semibold text-white">Reintentar</button></div>}

        {!loading && !error && (
          <>
            <section className="mt-xl" aria-labelledby="weekly-title">
              <div className="flex flex-wrap items-end justify-between gap-md"><div><h2 id="weekly-title" className="m-0 font-heading text-2xl font-bold text-heading">Horario semanal</h2><p className="mt-xs m-0 font-body text-sm text-neutral-500">Elige un solo horario continuo para cada día.</p></div>{weeklySuccess && <p className="m-0 font-body text-sm font-semibold text-success" role="status">Horario guardado correctamente.</p>}</div>
              <div className="mt-md flex flex-col gap-sm">
                {visibleDraft.map((day) => (
                  <article key={day.dayOfWeek} className="rounded-2xl border border-neutral-200 bg-white p-md shadow-sm md:grid md:grid-cols-[minmax(130px,1fr)_auto_1fr_auto] md:items-center md:gap-md">
                    <h3 className="m-0 font-heading text-lg font-bold text-heading">{WEEK_DAYS.find((item) => item.value === day.dayOfWeek)?.label}</h3>
                    <label className="mt-sm flex min-h-11 cursor-pointer items-center gap-sm font-body text-sm font-semibold text-body-text md:mt-0"><input type="checkbox" checked={day.active} onChange={(event) => updateDay(day.dayOfWeek, { active: event.target.checked })} className="size-5 accent-green-500" /> Atiende este día</label>
                    <div className="mt-sm grid grid-cols-2 gap-sm md:mt-0"><label className="font-body text-sm text-neutral-600">Desde<select disabled={!day.active} value={day.startTime} onChange={(event) => updateDay(day.dayOfWeek, { startTime: event.target.value })} className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-sm font-body text-base text-body-text disabled:bg-neutral-100 disabled:text-neutral-400 focus:border-green-500 focus:outline-none">{hours.slice(0, -1).map((hour) => <option key={hour}>{hour}</option>)}</select></label><label className="font-body text-sm text-neutral-600">Hasta<select disabled={!day.active} value={day.endTime} onChange={(event) => updateDay(day.dayOfWeek, { endTime: event.target.value })} className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-sm font-body text-base text-body-text disabled:bg-neutral-100 disabled:text-neutral-400 focus:border-green-500 focus:outline-none">{hours.slice(1).map((hour) => <option key={hour}>{hour}</option>)}</select></label></div>
                    <button type="button" onClick={() => copyToAll(day)} className="mt-md inline-flex min-h-11 items-center justify-center gap-xs rounded-full border border-heading px-md font-body text-sm font-semibold text-heading focus-visible:outline-2 focus-visible:outline-link md:mt-0" title="Copiar a todos los días"><CopyIcon size={16} aria-hidden="true" /> Copiar a todos</button>
                    {day.active && day.endTime <= day.startTime && <p className="m-0 mt-sm text-sm text-danger md:col-start-3">La hora Hasta debe ser mayor que Desde.</p>}
                  </article>
                ))}
              </div>
              {weeklyError && <p className="mt-md font-body text-sm text-danger" role="alert">{weeklyError}</p>}
              <div className="sticky bottom-0 z-10 mt-lg flex items-center justify-between gap-md border-t border-neutral-200 bg-bg-page/95 py-md backdrop-blur"><span className="font-body text-sm text-neutral-600">{isDirty ? 'Tienes cambios sin guardar' : 'Todo está guardado'}</span><button type="button" disabled={!isDirty || weeklySaving || visibleDraft.some((day) => day.active && day.endTime <= day.startTime)} onClick={() => void handleSaveWeekly()} className="inline-flex min-h-12 items-center justify-center gap-sm rounded-full bg-green-500 px-xl font-body font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-link">{weeklySaving && <span className="size-4 animate-spin rounded-full border-2 border-white border-r-transparent" aria-hidden="true" />}Guardar</button></div>
            </section>

            <section className="mt-2xl" aria-labelledby="exceptions-title">
              <div className="flex flex-wrap items-end justify-between gap-md"><div><h2 id="exceptions-title" className="m-0 font-heading text-2xl font-bold text-heading">Días especiales</h2><p className="mt-xs m-0 font-body text-sm text-neutral-500">Estos días reemplazan tu horario semanal.</p></div><button type="button" onClick={() => openException()} className="inline-flex min-h-12 items-center justify-center gap-xs rounded-full bg-heading px-lg font-body font-semibold text-white focus-visible:outline-2 focus-visible:outline-link"><PlusIcon size={18} aria-hidden="true" /> Agregar día especial</button></div>
              {exceptionError && <p className="mt-md text-sm text-danger" role="alert">{exceptionError}</p>}
              {futureExceptions.length === 0 ? <p className="mt-lg rounded-2xl border border-dashed border-neutral-300 p-xl text-center font-body text-base text-neutral-500">Aún no tienes días especiales</p> : <div className="mt-md grid grid-cols-1 gap-md lg:grid-cols-2">{futureExceptions.map((exception) => <article key={exception.id ?? exception.exceptionDate} className="rounded-2xl border border-neutral-200 bg-white p-lg shadow-sm"><div className="flex items-start justify-between gap-md"><div><h3 className="m-0 font-heading text-lg font-bold text-heading">{dateLabel(exception.exceptionDate)}</h3><p className="mt-sm m-0 font-body text-base font-semibold text-body-text">{exception.closed ? 'Cerrado todo el día' : `Atiende solo de ${timeValue(exception.startTime)} a ${timeValue(exception.endTime)}`}</p>{exception.reason && <p className="mt-xs m-0 font-body text-sm text-neutral-500">{exception.reason}</p>}</div><div className="flex gap-xs"><button type="button" onClick={() => openException(exception)} aria-label={`Editar ${dateLabel(exception.exceptionDate)}`} title="Editar" className="inline-flex size-11 items-center justify-center rounded-full text-link focus-visible:outline-2 focus-visible:outline-link"><PencilIcon size={18} /></button><button type="button" onClick={() => { if (exception.id && window.confirm('¿Eliminar este día especial?')) void deleteException(exception.id) }} aria-label={`Eliminar ${dateLabel(exception.exceptionDate)}`} title="Eliminar" className="inline-flex size-11 items-center justify-center rounded-full text-danger focus-visible:outline-2 focus-visible:outline-link"><Trash2Icon size={18} /></button></div></div></article>)}</div>}
            </section>
          </>
        )}
      </div>
      {exceptionModal !== undefined && <ScheduleExceptionModal exception={exceptionModal} exceptions={exceptions} onSave={async (exception) => { await saveException(exception) }} onClose={() => setExceptionModal(undefined)} />}
    </AdminLayout>
  )
}

export default OwnerAvailabilityPage
