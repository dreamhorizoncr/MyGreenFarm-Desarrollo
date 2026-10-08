import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarClockIcon, PencilIcon, SearchIcon } from '@animateicons/react/lucide'
import ChangeAppointmentStatusModal from './ChangeAppointmentStatusModal.tsx'
import RescheduleAppointmentModal from './RescheduleAppointmentModal.tsx'
import AppointmentDetailsModal from './AppointmentDetailsModal.tsx'
import Skeleton from './ui/Skeleton.tsx'
import Pagination from './ui/Pagination.tsx'
import { useAppointments } from '../hooks/useAppointments.ts'
import { useClientPagination } from '../hooks/useClientPagination.ts'
import { notify } from '../utils/notifications.ts'
import type { Appointment, AppointmentStatus } from '../types/appointment.ts'

type StatusFilter = 'ALL' | AppointmentStatus

const STATUS_FILTERS: StatusFilter[] = ['ALL', 'PENDING', 'CONFIRMED', 'CANCELLED']

interface AppointmentCardProps {
  appointment?: Appointment
  statusLabel?: string
  badgeClassName?: string
  formattedDate?: string
  disabled?: boolean
  onView?: () => void
  onReschedule?: () => void
  onChangeStatus?: () => void
  loading?: boolean
}

function AppointmentCard({
  appointment,
  statusLabel,
  badgeClassName,
  formattedDate,
  disabled,
  onView,
  onReschedule,
  onChangeStatus,
  loading = false,
}: Readonly<AppointmentCardProps>) {
  const { t } = useTranslation()

  if (loading) {
    return (
      <div className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-lg shadow-sm">
        <div className="flex items-center justify-between gap-sm">
          <Skeleton shape="pill" className="h-6 w-24" />
          <div className="flex items-center gap-2xs">
            <Skeleton shape="circle" className="h-[38px] w-[38px]" />
            <Skeleton shape="circle" className="h-[38px] w-[38px]" />
          </div>
        </div>
        <Skeleton shape="line" className="mt-sm h-5 w-1/2" />
        <Skeleton shape="line" className="mt-2 h-3 w-1/3" />
        <Skeleton shape="line" className="mt-md h-4 w-2/5" />
      </div>
    )
  }

  return (
    <div
      className={`group relative flex cursor-pointer flex-col rounded-2xl border border-neutral-200 bg-white p-lg shadow-sm transition hover:shadow-lg ${
        disabled ? 'opacity-60' : ''
      }`}
    >
      <button
        type="button"
        onClick={onView}
        aria-label={t('teacherAppointments.viewDetails')}
        className="absolute inset-0 z-0 rounded-2xl focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2"
      />

      <header className="relative z-10 flex items-center justify-between gap-sm">
        <span className={`inline-flex rounded-full px-sm py-2xs font-body text-caption font-semibold ${badgeClassName}`}>
          {statusLabel}
        </span>

        <div className="flex items-center gap-2xs">
          <button
            type="button"
            className="inline-flex size-[38px] items-center justify-center rounded-full text-link transition-colors hover:bg-(--grey-100) focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={(event) => {
              event.stopPropagation()
              onReschedule?.()
            }}
            disabled={disabled || appointment!.status === 'CANCELLED'}
            aria-label={t('teacherAppointments.rescheduleTitle')}
            title={t('teacherAppointments.rescheduleTitle')}
          >
            <CalendarClockIcon size={18} />
          </button>

          <button
            type="button"
            className="inline-flex size-[38px] items-center justify-center rounded-full text-link transition-colors hover:bg-(--grey-100) focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={(event) => {
              event.stopPropagation()
              onChangeStatus?.()
            }}
            disabled={disabled}
            aria-label={t('teacherAppointments.changeStatus')}
            title={t('teacherAppointments.changeStatus')}
          >
            <PencilIcon size={18} />
          </button>
        </div>
      </header>

      <h3 className="m-0 mt-sm font-heading text-lg font-bold leading-snug text-heading">
        {appointment!.childName}
      </h3>
      <p className="m-0 font-body text-body-sm text-neutral-500">
        {formattedDate}
      </p>

      <p className="m-0 mt-md font-body text-body-sm font-semibold text-link underline-offset-2 transition-colors group-hover:underline">
        {t('teacherAppointments.viewDetails')}
      </p>
    </div>
  )
}

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
  const [appointmentToView, setAppointmentToView] = useState<Appointment | null>(null)

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

  const { currentPage, setPage, totalPages, pageItems: pagedAppointments } = useClientPagination(filteredAppointments)

  const statusLabel = (filter: StatusFilter): string =>
    filter === 'ALL'
      ? t('teacherAppointments.all')
      : t(`teacherAppointments.status.${filter.toLowerCase()}` as 'teacherAppointments.status.pending')

  const filterClassName = (active: boolean) =>
    `rounded-full border px-md py-xs font-body text-body-sm font-semibold transition-colors ${
      active
        ? 'border-green-500 bg-green-500 text-white'
        : 'border-green-500 bg-white text-heading hover:bg-green-50'
    }`

  const badgeClassName = (status: AppointmentStatus) => {
    if (status === 'CONFIRMED') return 'bg-green-100 text-green-700'
    if (status === 'CANCELLED') return 'bg-red-100 text-red-700'
    return 'bg-[var(--info-100)] text-[var(--info-700)]'
  }

  const formatDate = (iso: string) => {
    const locale = i18n.resolvedLanguage ?? i18n.language ?? 'es'
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
  }

  const handleChangeStatus = async (id: string, status: AppointmentStatus, conclusion?: string) => {
    try {
      await changeStatus(id, status, conclusion)
      notify.success(t('teacherAppointments.statusUpdatedToastTitle'))
    } catch (err) {
      notify.error(t('teacherAppointments.statusUpdateErrorToastTitle'))
      throw err
    }
  }

  const handleReschedule = async (id: string, newDate: string) => {
    try {
      await rescheduleAppointment(id, newDate)
      notify.success({
        title: t('teacherAppointments.rescheduledToastTitle'),
        description: t('teacherAppointments.rescheduledToastDescription'),
      })
    } catch (err) {
      notify.error(t('teacherAppointments.rescheduleErrorToastTitle'))
      throw err
    }
  }

  return (
    <div id="appointments-section">
      <h1 className="m-0 font-heading text-page-title font-bold leading-[1.15] text-heading">
        {t('teacherAppointments.title')}
      </h1>
      <p className="mt-2 font-body text-body text-neutral-500">
        {t('teacherAppointments.subtitle')}
      </p>

      <div className="mb-[var(--spacing-lg)] mt-[var(--spacing-xl)] flex flex-wrap items-center justify-between gap-md">
        <div className="flex h-11 min-w-[240px] max-w-[420px] flex-1 items-center gap-sm rounded-full border border-neutral-200 bg-white px-md transition-colors focus-within:border-green-500">
          <SearchIcon size={18} className="shrink-0 text-neutral-500" aria-hidden="true" />
          <input
            type="search"
            className="h-full min-w-0 flex-1 border-none bg-transparent font-body text-body-sm text-body-text outline-none placeholder:text-neutral-400"
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
        <p className="m-0 mb-md text-left font-body text-body-sm text-danger">{actionError}</p>
      )}

      {loading && (
        <div className="grid grid-cols-1 gap-md xl:grid-cols-2">
          <AppointmentCard loading />
          <AppointmentCard loading />
          <AppointmentCard loading />
          <AppointmentCard loading />
        </div>
      )}

      {error && <p className="m-0 p-xl text-center font-body text-body text-danger">{error}</p>}

      {!loading && !error && (
        filteredAppointments.length === 0 ? (
          <p className="m-0 p-xl text-center font-body text-body text-neutral-500">
            {searchTerm.trim() || statusFilter !== 'ALL'
              ? t('teacherAppointments.noResults')
              : t('teacherAppointments.empty')}
          </p>
        ) : (
          <>
          <div className="grid grid-cols-1 gap-md xl:grid-cols-2">
            {pagedAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                statusLabel={statusLabel(appointment.status)}
                badgeClassName={badgeClassName(appointment.status)}
                formattedDate={formatDate(appointment.appointmentDate)}
                disabled={actionId === appointment.id}
                onView={() => setAppointmentToView(appointment)}
                onReschedule={() => setAppointmentToReschedule(appointment)}
                onChangeStatus={() => setAppointmentToEdit(appointment)}
              />
            ))}
          </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
          </>
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

      {appointmentToView && (
        <AppointmentDetailsModal
          appointment={appointmentToView}
          onClose={() => setAppointmentToView(null)}
        />
      )}
    </div>
  )
}

export default AppointmentsSection