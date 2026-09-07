import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarClock, Pencil, Search } from 'lucide-react'
import { formatPhoneNumberIntl } from 'react-phone-number-input'
import ChangeAppointmentStatusModal from './ChangeAppointmentStatusModal.tsx'
import RescheduleAppointmentModal from './RescheduleAppointmentModal.tsx'
import { useAppointments } from '../hooks/useAppointments.ts'
import type { Appointment, AppointmentStatus } from '../types/appointment.ts'

type StatusFilter = 'ALL' | AppointmentStatus

const STATUS_FILTERS: StatusFilter[] = ['ALL', 'PENDING', 'CONFIRMED', 'CANCELLED']

function AppointmentsSection() {
  const { t, i18n } = useTranslation()
  const {
    appointments,
    loading,
    error,
    actionId,
    actionError,
    fetchAppointments,
    changeStatus,
    rescheduleAppointment,
  } = useAppointments()

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('PENDING')
  const [searchTerm, setSearchTerm] = useState('')
  const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null)
  const [appointmentToReschedule, setAppointmentToReschedule] = useState<Appointment | null>(null)

  useEffect(() => {
    fetchAppointments()
  }, [])

  const filteredAppointments = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return appointments.filter((appointment) => {
      if (statusFilter !== 'ALL' && appointment.status !== statusFilter) return false
      if (!term) return true
      return [appointment.childName, appointment.parentName, appointment.parentEmail, appointment.parentPhone]
        .some((field) => field.toLowerCase().includes(term))
    })
  }, [appointments, statusFilter, searchTerm])

  const statusLabel = (filter: StatusFilter): string =>
    filter === 'ALL'
      ? t('teacherAppointments.all')
      : t(`teacherAppointments.status.${filter.toLowerCase()}` as 'teacherAppointments.status.pending')

  const filterClassName = (active: boolean) =>
    `rounded-full px-md py-sm font-body text-sm font-semibold transition-colors ${
      active
        ? 'bg-green-500 text-white'
        : 'bg-[var(--grey-100)] text-body-text hover:bg-[var(--grey-200)]'
    }`

  const badgeClassName = (status: AppointmentStatus) =>
    status === 'CONFIRMED'
      ? 'bg-green-100 text-green-700'
      : status === 'CANCELLED'
        ? 'bg-red-100 text-red-700'
        : 'bg-amber-100 text-amber-700'

  const formatDate = (iso: string) => {
    const locale = i18n.resolvedLanguage ?? i18n.language ?? 'es'
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
  }

  const formatPhone = (phone: string) => {
    if (!phone) return phone
    try {
      return formatPhoneNumberIntl(phone)
    } catch {
      return phone
    }
  }

  const infoRows = (appointment: Appointment) => [
    { label: t('booking.fullName'), value: appointment.parentName },
    { label: t('booking.idNumber'), value: appointment.parentIdentification },
    { label: t('booking.email'), value: appointment.parentEmail },
    { label: t('booking.phone'), value: formatPhone(appointment.parentPhone) },
    { label: t('booking.occupation'), value: appointment.parentOccupation },
    { label: t('booking.reason'), value: appointment.parentNotes },
  ]

  const handleChangeStatus = async (id: string, status: AppointmentStatus, conclusion?: string) => {
    await changeStatus(id, status, conclusion)
  }

  const handleReschedule = async (id: string, newDate: string) => {
    await rescheduleAppointment(id, newDate)
  }

  return (
    <div id="appointments-section">
      <h1 className="m-0 font-heading text-[34px] font-bold leading-[1.15] text-heading">
        {t('teacherAppointments.title')}
      </h1>
      <p className="mt-2 font-body text-base text-neutral-500">
        {t('teacherAppointments.subtitle')}
      </p>

      <div className="mb-[var(--spacing-lg)] mt-[var(--spacing-xl)] flex flex-wrap items-center justify-between gap-md">
        <div className="flex h-[44px] min-w-[240px] max-w-[420px] flex-1 items-center gap-sm rounded-full border border-neutral-200 bg-white px-md transition-colors focus-within:border-green-500">
          <Search size={18} className="shrink-0 text-neutral-500" aria-hidden="true" />
          <input
            type="search"
            className="h-full min-w-0 flex-1 border-none bg-transparent font-body text-[15px] text-body-text outline-none placeholder:text-neutral-400"
            placeholder={t('teacherAppointments.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label={t('teacherAppointments.searchPlaceholder')}
          />
        </div>

        <div className="flex flex-wrap gap-sm">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              aria-pressed={statusFilter === filter}
              onClick={() => setStatusFilter(filter)}
              className={filterClassName(statusFilter === filter)}
            >
              {statusLabel(filter)}
            </button>
          ))}
        </div>
      </div>

      {actionError && (
        <p className="m-0 mb-md text-left font-body text-sm text-danger">{actionError}</p>
      )}

      {loading && <p className="m-0 p-xl text-center font-body text-base text-neutral-500">{t('common.loading')}</p>}

      {error && <p className="m-0 p-xl text-center font-body text-base text-danger">{error}</p>}

      {!loading && !error && (
        filteredAppointments.length === 0 ? (
          <p className="m-0 p-xl text-center font-body text-base text-neutral-500">
            {searchTerm.trim() || statusFilter !== 'ALL'
              ? t('teacherAppointments.noResults')
              : t('teacherAppointments.empty')}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-md xl:grid-cols-2">
            {filteredAppointments.map((appointment) => (
              <article
                key={appointment.id}
                className={`flex flex-col rounded-2xl border border-neutral-200 bg-white p-lg shadow-sm transition-opacity ${
                  actionId === appointment.id ? 'opacity-60' : ''
                }`}
              >
                <header className="flex items-center justify-between gap-sm">
                  <span className={`inline-flex rounded-full px-sm py-2xs font-body text-xs font-semibold ${badgeClassName(appointment.status)}`}>
                    {statusLabel(appointment.status)}
                  </span>

                  <div className="flex items-center gap-2xs">
                    <button
                      type="button"
                      className="inline-flex size-[38px] items-center justify-center rounded-full text-link transition-colors hover:bg-[var(--grey-100)] focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => setAppointmentToReschedule(appointment)}
                      disabled={actionId === appointment.id || appointment.status === 'CANCELLED'}
                      aria-label={t('teacherAppointments.rescheduleTitle')}
                      title={t('teacherAppointments.rescheduleTitle')}
                    >
                      <CalendarClock size={18} />
                    </button>

                    <button
                      type="button"
                      className="inline-flex size-[38px] items-center justify-center rounded-full text-link transition-colors hover:bg-[var(--grey-100)] focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => setAppointmentToEdit(appointment)}
                      disabled={actionId === appointment.id}
                      aria-label={t('teacherAppointments.changeStatus')}
                      title={t('teacherAppointments.changeStatus')}
                    >
                      <Pencil size={18} />
                    </button>
                  </div>
                </header>

                <h3 className="m-0 mt-sm font-heading text-lg font-bold leading-snug text-heading">
                  {appointment.childName}
                </h3>
                <p className="m-0 font-body text-body-sm text-neutral-500">
                  {formatDate(appointment.appointmentDate)}
                </p>

                <dl className="mt-md grid grid-cols-1 gap-x-lg gap-y-sm sm:grid-cols-2">
                  {infoRows(appointment).map(({ label, value }) => (
                    <div key={label}>
                      <dt className="font-body text-xs font-semibold uppercase tracking-[0.4px] text-neutral-default">
                        {label}
                      </dt>
                      <dd className="m-0 mt-2xs break-words font-body text-[15px] text-body-text">
                        {value || '—'}
                      </dd>
                    </div>
                  ))}
                  <div>
                    <dt className="font-body text-xs font-semibold uppercase tracking-[0.4px] text-neutral-default">
                      {t('teacherAppointments.conclusion')}
                    </dt>
                    <dd className="m-0 mt-2xs break-words font-body text-[15px] text-body-text">
                      {appointment.teacherConclusion ?? '—'}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )
      )}

      {appointmentToEdit && (
        <ChangeAppointmentStatusModal
          appointment={appointmentToEdit}
          onConfirm={handleChangeStatus}
          onClose={() => setAppointmentToEdit(null)}
        />
      )}

      {appointmentToReschedule && (
        <RescheduleAppointmentModal
          appointment={appointmentToReschedule}
          onConfirm={handleReschedule}
          onClose={() => setAppointmentToReschedule(null)}
        />
      )}
    </div>
  )
}

export default AppointmentsSection