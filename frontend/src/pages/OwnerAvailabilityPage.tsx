import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CopyIcon, PencilIcon, PlusIcon, Trash2Icon } from '@animateicons/react/lucide'
import AdminLayout from '../layout/AdminLayout.tsx'
import ScheduleExceptionModal from '../components/ScheduleExceptionModal.tsx'
import DeleteConfirmModal from '../components/ui/DeleteConfirmModal.tsx'
import Skeleton from '../components/ui/Skeleton.tsx'
import Pagination from '../components/ui/Pagination.tsx'
import Select from '../components/ui/Select.tsx'
import { useAvailability } from '../hooks/useAvailability.ts'
import { useClientPagination } from '../hooks/useClientPagination.ts'
import { notify } from '../utils/notifications.ts'
import type { ScheduleException, WeeklySchedule } from '../types/availability.ts'
import { DEFAULT_END_TIME, DEFAULT_START_TIME, timeValue, toApiTime, WEEK_DAYS } from '../types/availability.ts'

const hours = Array.from({ length: 15 }, (_, index) => `${String(index + 6).padStart(2, '0')}:00`)

interface WeeklyDayRowProps {
  day?: WeeklySchedule
  hours?: string[]
  onUpdate?: (patch: Partial<WeeklySchedule>) => void
  onCopyToAll?: () => void
  loading?: boolean
}

function WeeklyDayRow({ day, hours, onUpdate, onCopyToAll, loading = false }: Readonly<WeeklyDayRowProps>) {
  const { t } = useTranslation()
  if (loading) {
    return (
      <article className="rounded-2xl border border-neutral-200 bg-white p-md md:grid md:grid-cols-[minmax(130px,1fr)_auto_1fr_auto] md:items-center md:gap-md">
        <Skeleton shape="line" className="h-5 w-24" />
        <Skeleton shape="line" className="mt-sm h-4 w-32 md:mt-0" />
        <Skeleton shape="line" className="mt-sm h-11 w-full md:mt-0" />
        <Skeleton shape="pill" className="mt-md h-11 w-32 md:mt-0" />
      </article>
    )
  }

  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-md transition hover:shadow-lg md:grid md:grid-cols-[minmax(130px,1fr)_auto_1fr_auto] md:items-center md:gap-md">
      <h3 className="m-0 font-heading text-lg font-bold text-heading">{t(`admin.availability.weekdays.${day!.dayOfWeek}`)}</h3>
      <label className="mt-sm flex min-h-11 cursor-pointer items-center gap-sm font-body text-body-sm font-semibold text-heading md:mt-0"><input type="checkbox" checked={day!.active} onChange={(event) => onUpdate!({ active: event.target.checked })} className="size-5 accent-green-500" /> {t('admin.availability.attendDay')}</label>
      <div className="mt-sm grid grid-cols-2 gap-sm md:mt-0"><label className="font-body text-body-sm font-semibold text-heading">{t('admin.availability.from')}<div className="mt-xs"><Select disabled={!day!.active} value={day!.startTime} onChange={(value) => onUpdate!({ startTime: value })} options={hours!.slice(0, -1).map((hour) => ({ value: hour, label: hour }))} className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-sm transition-colors hover:border-neutral-400 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:hover:border-neutral-200" aria-label={t('admin.availability.from')} /></div></label><label className="font-body text-body-sm font-semibold text-heading">{t('admin.availability.to')}<div className="mt-xs"><Select disabled={!day!.active} value={day!.endTime} onChange={(value) => onUpdate!({ endTime: value })} options={hours!.slice(1).map((hour) => ({ value: hour, label: hour }))} className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-sm transition-colors hover:border-neutral-400 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:hover:border-neutral-200" aria-label={t('admin.availability.to')} /></div></label></div>
      <button type="button" onClick={onCopyToAll} className="mt-md inline-flex min-h-11 items-center justify-center gap-xs rounded-full border border-heading px-md font-body text-body-sm font-semibold text-heading transition-colors hover:bg-heading hover:text-white focus-visible:outline-2 focus-visible:outline-link md:mt-0" title={t('admin.availability.copyToAllTitle')}><CopyIcon size={16} aria-hidden="true" /> {t('admin.availability.copyToAll')}</button>
      {day!.active && day!.endTime <= day!.startTime && <p className="m-0 mt-sm text-body-sm text-danger md:col-start-3">{t('admin.availability.invalidRange')}</p>}
    </article>
  )
}

interface ExceptionCardProps {
  exception?: ScheduleException
  onEdit?: () => void
  onDelete?: () => void
  loading?: boolean
}

function ExceptionCard({ exception, onEdit, onDelete, loading = false }: Readonly<ExceptionCardProps>) {
  const { t, i18n } = useTranslation()
  if (loading) {
    return (
      <article className="rounded-2xl border border-neutral-200 bg-white p-lg">
        <div className="flex items-start justify-between gap-md">
          <div className="min-w-0 flex-1">
            <Skeleton shape="line" className="h-5 w-1/2" />
            <Skeleton shape="line" className="mt-sm h-4 w-2/3" />
          </div>
          <div className="flex gap-xs">
            <Skeleton shape="circle" className="size-11" />
            <Skeleton shape="circle" className="size-11" />
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-lg transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between gap-md">
        <div>
          <h3 className="m-0 font-heading text-lg font-bold text-heading">{dateLabel(exception!.exceptionDate, i18n.language)}</h3>
          <p className="mt-sm m-0 font-body text-body font-semibold text-body-text">{exception!.closed ? t('admin.availability.closedAllDay') : t('admin.availability.openOnly', { from: timeValue(exception!.startTime), to: timeValue(exception!.endTime) })}</p>
          {exception!.reason && <p className="mt-xs m-0 font-body text-body-sm text-neutral-500">{exception!.reason}</p>}
        </div>
        <div className="flex gap-xs">
          <button type="button" onClick={onEdit} aria-label={t('admin.availability.editDayLabel', { date: dateLabel(exception!.exceptionDate, i18n.language) })} title={t('admin.availability.editAction')} className="inline-flex size-11 items-center justify-center rounded-full text-link transition-colors hover:bg-(--grey-100) focus-visible:outline-2 focus-visible:outline-link"><PencilIcon size={18} /></button>
          <button type="button" onClick={onDelete} aria-label={t('admin.availability.deleteDayLabel', { date: dateLabel(exception!.exceptionDate, i18n.language) })} title={t('admin.availability.deleteAction')} className="inline-flex size-11 items-center justify-center rounded-full text-danger transition-colors hover:bg-danger-100 focus-visible:outline-2 focus-visible:outline-link"><Trash2Icon size={18} /></button>
        </div>
      </div>
    </article>
  )
}

function initialWeekly(): WeeklySchedule[] {
  return WEEK_DAYS.map(({ value }) => ({ dayOfWeek: value, startTime: DEFAULT_START_TIME, endTime: DEFAULT_END_TIME, active: false }))
}

function weeklyDraftFromSaved(weekly: WeeklySchedule[]): WeeklySchedule[] {
  return initialWeekly().map((day) => {
    const saved = weekly.find((item) => item.dayOfWeek === day.dayOfWeek)
    return saved ? { ...day, ...saved, startTime: timeValue(saved.startTime), endTime: timeValue(saved.endTime) } : day
  })
}

function dateLabel(date: string, language: string) {
  return new Intl.DateTimeFormat(language, { dateStyle: 'long' }).format(new Date(`${date}T00:00:00`))
}

function OwnerAvailabilityPage() {
  const { t, i18n } = useTranslation()
  const { weekly, exceptions, loading, error, weeklySaving, weeklyError, exceptionError, weeklySuccess, saveWeekly, saveException, deleteException } = useAvailability()
  const [draft, setDraft] = useState<WeeklySchedule[] | null>(null)
  const [exceptionModal, setExceptionModal] = useState<ScheduleException | null | undefined>(undefined)
  const [exceptionToDelete, setExceptionToDelete] = useState<ScheduleException | null>(null)

  const confirmDeleteException = async () => {
    if (!exceptionToDelete?.id) return
    try {
      await deleteException(exceptionToDelete.id)
      notify.success(t('admin.availability.deleteExceptionSuccessToastTitle'))
    } catch (err) {
      notify.error(t('admin.availability.deleteExceptionErrorToastTitle'))
      throw err
    }
  }

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
    try {
      await saveWeekly(visibleDraft.map((day) => ({ ...day, startTime: toApiTime(day.startTime), endTime: toApiTime(day.endTime) })))
      notify.success(t('admin.availability.saveWeeklySuccessToastTitle'))
    } catch {
      notify.error(t('admin.availability.saveWeeklyErrorToastTitle'))
    }
  }

  const futureExceptions = exceptions.filter((item) => item.exceptionDate >= new Date().toISOString().slice(0, 10)).sort((a, b) => a.exceptionDate.localeCompare(b.exceptionDate))
  const { currentPage, setPage, totalPages, pageItems: pagedExceptions } = useClientPagination(futureExceptions)

  const openException = (exception?: ScheduleException) => setExceptionModal(exception ?? null)

  return (
    <AdminLayout>
      <div className="pb-8">
        <h1 className="m-0 font-heading text-page-title font-bold leading-[1.15] text-heading">{t('admin.availability.title')}</h1>
        <p className="mt-2 font-body text-body text-neutral-500">{t('admin.availability.subtitle')}</p>

        {loading && (
          <div className="mt-xl">
            <div className="flex flex-col gap-sm">
              <WeeklyDayRow loading />
              <WeeklyDayRow loading />
              <WeeklyDayRow loading />
            </div>
            <div className="mt-2xl grid grid-cols-1 gap-md lg:grid-cols-2">
              <ExceptionCard loading />
              <ExceptionCard loading />
            </div>
          </div>
        )}
        {error && !loading && <div className="mt-xl rounded-2xl border border-red-200 bg-red-50 p-lg text-center font-body text-danger"><p className="m-0">{error}</p><button type="button" onClick={() => window.location.reload()} className="mt-sm rounded-full bg-danger px-lg py-sm font-semibold text-white transition-opacity hover:opacity-90">{t('admin.availability.retry')}</button></div>}

        {!loading && !error && (
          <>
            <section className="mt-xl" aria-labelledby="weekly-title">
              <div className="flex flex-wrap items-end justify-between gap-md"><div><h2 id="weekly-title" className="m-0 font-heading text-2xl font-bold text-heading">{t('admin.availability.weeklyTitle')}</h2><p className="mt-xs m-0 font-body text-body-sm text-neutral-500">{t('admin.availability.weeklyHint')}</p></div>{weeklySuccess && <output className="m-0 font-body text-body-sm font-semibold text-success">{t('admin.availability.savedMessage')}</output>}</div>
              <div className="mt-md flex flex-col gap-sm">
                {visibleDraft.map((day) => (
                  <WeeklyDayRow
                    key={day.dayOfWeek}
                    day={day}
                    hours={hours}
                    onUpdate={(patch) => updateDay(day.dayOfWeek, patch)}
                    onCopyToAll={() => copyToAll(day)}
                  />
                ))}
              </div>
              {weeklyError && <p className="mt-md font-body text-body-sm text-danger" role="alert">{weeklyError}</p>}
              <div className="sticky bottom-0 z-10 mt-lg flex items-center justify-between gap-md border-t border-neutral-200 bg-bg-page/95 py-md backdrop-blur"><span className="font-body text-body-sm text-neutral-600">{isDirty ? t('admin.availability.unsavedChanges') : t('admin.availability.allSaved')}</span><div className="flex gap-sm"><button type="button" disabled={!isDirty || weeklySaving} onClick={() => setDraft(null)} className="inline-flex h-11 items-center justify-center rounded-full border border-green-500 px-lg font-body text-body-sm font-semibold text-heading transition-colors hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:outline-link">{t('admin.availability.discard')}</button><button type="button" disabled={!isDirty || weeklySaving || visibleDraft.some((day) => day.active && day.endTime <= day.startTime)} onClick={() => void handleSaveWeekly()} className="inline-flex h-11 items-center justify-center gap-sm rounded-full bg-orange-500 px-lg font-body text-body-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-orange-500 focus-visible:outline-2 focus-visible:outline-link">{weeklySaving && <span className="size-4 animate-spin rounded-full border-2 border-white border-r-transparent" aria-hidden="true" />}{t('admin.availability.save')}</button></div></div>
            </section>

            <section className="mt-2xl" aria-labelledby="exceptions-title">
              <div className="flex flex-wrap items-end justify-between gap-md"><div><h2 id="exceptions-title" className="m-0 font-heading text-2xl font-bold text-heading">{t('admin.availability.specialTitle')}</h2><p className="mt-xs m-0 font-body text-body-sm text-neutral-500">{t('admin.availability.specialHint')}</p></div><button type="button" onClick={() => openException()} className="inline-flex min-h-11 items-center justify-center gap-xs rounded-full bg-orange-500 px-lg font-body text-button font-semibold text-white transition-colors hover:bg-orange-600 focus-visible:outline-2 focus-visible:outline-link"><PlusIcon size={18} aria-hidden="true" /> {t('admin.availability.addSpecial')}</button></div>
              {exceptionError && <p className="mt-md text-body-sm text-danger" role="alert">{exceptionError}</p>}
              {futureExceptions.length === 0 ? <p className="mt-lg rounded-2xl border border-dashed border-neutral-300 p-xl text-center font-body text-body text-neutral-500">{t('admin.availability.emptySpecial')}</p> : <><div className="mt-md grid grid-cols-1 gap-md lg:grid-cols-2">{pagedExceptions.map((exception) => <ExceptionCard key={exception.id ?? exception.exceptionDate} exception={exception} onEdit={() => openException(exception)} onDelete={() => setExceptionToDelete(exception)} />)}</div><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} /></>}
            </section>
          </>
        )}
      </div>
      {exceptionModal !== undefined && (
        <ScheduleExceptionModal
          exception={exceptionModal}
          exceptions={exceptions}
          onSave={async (exception) => {
            try {
              await saveException(exception)
              notify.success(t('admin.availability.saveExceptionSuccessToastTitle'))
            } catch (err) {
              notify.error(t('admin.availability.saveExceptionErrorToastTitle'))
              throw err
            }
          }}
          onClose={() => setExceptionModal(undefined)}
        />
      )}

      {exceptionToDelete && (
        <DeleteConfirmModal
          title={t('admin.availability.deleteModalTitle')}
          message={t('admin.availability.deleteConfirmMessage', { date: dateLabel(exceptionToDelete.exceptionDate, i18n.language) })}
          onConfirm={confirmDeleteException}
          onClose={() => setExceptionToDelete(null)}
        />
      )}
    </AdminLayout>
  )
}

export default OwnerAvailabilityPage
