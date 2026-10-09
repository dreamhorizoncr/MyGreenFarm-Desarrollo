import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { XIcon } from '@animateicons/react/lucide'
import Select from './ui/Select.tsx'
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
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [date, setDate] = useState(exception?.exceptionDate ?? '')
  const [closed, setClosed] = useState(exception?.closed ?? true)
  const [startTime, setStartTime] = useState(timeValue(exception?.startTime ?? DEFAULT_START_TIME))
  const [endTime, setEndTime] = useState(timeValue(exception?.endTime ?? DEFAULT_END_TIME))
  const [reason, setReason] = useState(exception?.reason ?? '')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

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
      setFormError(t('admin.availability.modal.errSelectDate'))
      return
    }
    const selectedDate = new Date(`${date}T00:00:00`)
    const day = selectedDate.getDay()
    if (date < todayIso() || day === 0 || day === 6) {
      setFormError(t('admin.availability.modal.errWeekdayFuture'))
      return
    }
    if (!closed && endTime <= startTime) {
      setFormError(t('admin.availability.modal.errInvalidRange'))
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
      setFormError(t('admin.availability.modal.errSave'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose()
      }}
      aria-labelledby="exception-modal-title"
      className="m-0 mt-auto max-h-[92vh] w-full max-w-none scrollbar-none overflow-y-auto rounded-t-3xl bg-bg-card p-xl backdrop:bg-scrim md:m-auto md:w-[min(560px,92vw)] md:rounded-2xl"
    >
      <div className="relative p-xl">
        <div className="flex items-center justify-between gap-md">
          <h2 id="exception-modal-title" className="m-0 font-heading text-2xl font-bold text-heading">
            {exception ? t('admin.availability.modal.editTitle') : t('admin.availability.modal.addTitle')}
          </h2>

          <button type="button" onClick={onClose} aria-label={t('admin.availability.modal.close')} className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-heading shadow-sm transition hover:bg-neutral-100">
            <XIcon size={20} />
          </button>
        </div>
        <p className="mt-xs font-body text-body-sm text-neutral-500">{t('admin.availability.modal.hint')}</p>

        <div className="mt-lg flex flex-col gap-md">
          <div>
            <label htmlFor="exception-date" className="mb-xs block font-body text-body-sm font-semibold text-body-text">{t('admin.availability.modal.dateLabel')}</label>
            <input id="exception-date" type="date" min={todayIso()} value={date} onChange={(event) => { handleDateChange(event.target.value); setFormError(null) }} className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-md font-body text-body text-body-text focus:border-green-500 focus:outline-none" />
            {date && new Date(`${date}T00:00:00`).getDay() % 6 === 0 && <p className="mt-xs text-body-sm text-danger">{t('admin.availability.modal.weekendNotAvailable')}</p>}
            {existing && <p className="mt-xs text-body-sm text-link">{t('admin.availability.modal.alreadyExists')}</p>}
          </div>

          <fieldset className="flex flex-col gap-sm">
            <legend className="mb-xs font-body text-body-sm font-semibold text-body-text">{t('admin.availability.modal.howLabel')}</legend>
            <label className="flex min-h-12 cursor-pointer items-center gap-sm rounded-xl border border-neutral-200 px-md font-body text-body text-body-text">
              <input type="radio" name="exception-mode" checked={closed} onChange={() => setClosed(true)} className="size-5 accent-green-500" />
              <span>{t('admin.availability.modal.closedOption')}</span>
            </label>
            <label className="flex min-h-12 cursor-pointer items-center gap-sm rounded-xl border border-neutral-200 px-md font-body text-body text-body-text">
              <input type="radio" name="exception-mode" checked={!closed} onChange={() => setClosed(false)} className="size-5 accent-green-500" />
              <span>{t('admin.availability.modal.customOption')}</span>
            </label>
          </fieldset>

          {!closed && (
            <div className="grid grid-cols-2 gap-md">
              <label className="font-body text-body-sm font-semibold text-body-text">{t('admin.availability.from')}<div className="mt-xs"><Select value={startTime} onChange={setStartTime} options={hours.slice(0, -1).map((hour) => ({ value: hour, label: hour }))} className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-md" aria-label={t('admin.availability.from')} /></div></label>
              <label className="font-body text-body-sm font-semibold text-body-text">{t('admin.availability.to')}<div className="mt-xs"><Select value={endTime} onChange={setEndTime} options={hours.slice(1).map((hour) => ({ value: hour, label: hour }))} className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-md" aria-label={t('admin.availability.to')} /></div></label>
            </div>
          )}

          <div>
            <label htmlFor="exception-reason" className="mb-xs block font-body text-body-sm font-semibold text-body-text">{t('admin.availability.modal.reasonLabel')} <span className="font-normal text-neutral-500">{t('admin.availability.modal.reasonOptional')}</span></label>
            <input id="exception-reason" value={reason} maxLength={1000} onChange={(event) => setReason(event.target.value)} placeholder={t('admin.availability.modal.reasonPlaceholder')} className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-md font-body text-body focus:border-green-500 focus:outline-none" />
          </div>

          {formError && <p className="m-0 text-body-sm text-danger" role="alert">{formError}</p>}
          <div className="flex flex-wrap justify-end gap-sm">
            <button type="button" onClick={onClose} className="h-11 rounded-full border border-green-500 px-lg font-body text-body-sm font-semibold text-heading transition-colors hover:bg-green-50 focus-visible:outline-2 focus-visible:outline-link">{t('admin.availability.modal.cancel')}</button>
            <button type="button" onClick={() => void handleSubmit()} disabled={saving} className="inline-flex h-11 items-center justify-center gap-sm rounded-full bg-orange-500 px-lg font-body text-body-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-link">
              {saving && <span className="size-4 animate-spin rounded-full border-2 border-white border-r-transparent" aria-hidden="true" />}
              {exception ? t('admin.availability.modal.saveChanges') : t('admin.availability.modal.add')}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  )
}

export default ScheduleExceptionModal
