import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SearchIcon } from '@animateicons/react/lucide'
import { today, getLocalTimeZone } from '@internationalized/date'
import type { CalendarDate } from '@internationalized/date'
import ChangeAppointmentStatusModal from './ChangeAppointmentStatusModal.tsx'
import RescheduleAppointmentModal from './RescheduleAppointmentModal.tsx'
import AppointmentDetailsModal from './AppointmentDetailsModal.tsx'
import Skeleton from './ui/Skeleton.tsx'
import CalendarPanel from './ui/CalendarPanel.tsx'
import CardActionButton from './ui/CardActionButton.tsx'
import Pagination from './ui/Pagination.tsx'
import { useAppointments } from '../hooks/useAppointments.ts'
import { useClientPagination } from '../hooks/useClientPagination.ts'
import { useSkeletonCount } from '../hooks/useSkeletonCount.ts'
import SkeletonList from './ui/SkeletonList.tsx'
import { notify } from '../utils/notifications.ts'
import type { Appointment, AppointmentStatus } from '../types/appointment.ts'
import { useAvailability } from '../hooks/useAvailability.ts'
import TabHighlight from './ui/TabHighlight.tsx'

type StatusFilter = 'ALL' | 'BY_DATE' | AppointmentStatus

const STATUS_FILTERS: StatusFilter[] = ['ALL', 'BY_DATE', 'PENDING', 'CONFIRMED', 'CANCELLED']

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
          <div className="flex items-center gap-xs">
            <Skeleton shape="circle" className="size-10" />
            <Skeleton shape="circle" className="size-10" />
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
      className={`flex flex-col rounded-2xl border border-neutral-200 bg-white p-lg shadow-sm card-hover ${
        disabled ? 'opacity-60' : ''
      }`}
    >
      <header className="flex items-center justify-between gap-sm">
        <span className={`inline-flex rounded-full px-sm py-2xs font-body text-caption font-semibold ${badgeClassName}`}>
          {statusLabel}
        </span>

        <div className="flex items-center gap-xs">
          <CardActionButton
            action="reschedule"
            label={t('teacherAppointments.rescheduleTitle')}
            title={t('teacherAppointments.rescheduleTitle')}
            disabled={disabled || appointment!.status === 'CANCELLED'}
            onClick={() => onReschedule?.()}
          />

          <CardActionButton
            action="edit"
            label={t('teacherAppointments.changeStatus')}
            title={t('teacherAppointments.changeStatus')}
            disabled={disabled}
            onClick={() => onChangeStatus?.()}
          />
        </div>
      </header>

      <h3 className="m-0 mt-sm font-heading text-h5 font-bold leading-snug text-heading">
        {appointment!.childName}
      </h3>
      <p className="m-0 font-body text-body-sm text-neutral-500">
        {formattedDate}
      </p>

      <button
        type="button"
        onClick={onView}
        className="mt-md self-start rounded font-body text-body-sm font-semibold text-link underline-offset-2 transition-colors hover:underline focus-visible:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
      >
        {t('teacherAppointments.viewDetails')}
      </button>
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

  const { exceptions, reload: loadExceptions } = useAvailability()

  useEffect(() => {
    loadExceptions(i18n.language)
  }, [loadExceptions, i18n.language])

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('BY_DATE')
  const [selectedDate, setSelectedDate] = useState<CalendarDate | null>(today(getLocalTimeZone()))
  const [searchTerm, setSearchTerm] = useState('')
  const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null)
  const [appointmentToReschedule, setAppointmentToReschedule] = useState<Appointment | null>(null)
  const [appointmentToView, setAppointmentToView] = useState<Appointment | null>(null)

  const specialScheduleDates = useMemo(() => {
    return new Set(exceptions.map((item) => item.exceptionDate))
  }, [exceptions])

  useEffect(() => {
    fetchAppointments()
  }, [])

  const filteredAppointments = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    return appointments.filter((appointment) => {
      const isPast = new Date(appointment.appointmentDate) < startOfToday
      if (isPast && statusFilter !== 'PENDING') return false

      if (statusFilter === 'BY_DATE') {
        if (!selectedDate) return false
        const appDate = new Date(appointment.appointmentDate)
        if (
          appDate.getFullYear() !== selectedDate.year ||
          appDate.getMonth() + 1 !== selectedDate.month ||
          appDate.getDate() !== selectedDate.day
        ) {
          return false
        }
      } else if (statusFilter !== 'ALL' && appointment.status !== statusFilter) {
        return false
      }

      if (!term) return true
      return [appointment.childName, appointment.parentName, appointment.parentEmail, appointment.parentPhone]
        .some((field) => field.toLowerCase().includes(term))
    })
  }, [appointments, statusFilter, selectedDate, searchTerm])

  const { currentPage, setPage, totalPages, pageItems: pagedAppointments } = useClientPagination(filteredAppointments)
  const isDayView = statusFilter === 'BY_DATE'
  const daySkeletonCount = useSkeletonCount('appointments-day', loading || !isDayView, pagedAppointments.length, 2)
  const statusSkeletonCount = useSkeletonCount('appointments-status', loading || isDayView, pagedAppointments.length, 4)

  const statusLabel = (filter: StatusFilter): string => {
    if (filter === 'BY_DATE') return t('teacherAppointments.byDate')
    return filter === 'ALL'
      ? t('teacherAppointments.all')
      : t(`teacherAppointments.status.${filter.toLowerCase()}` as 'teacherAppointments.status.pending')
  }

  const filterClassName = (active: boolean) =>
    `relative rounded-full border px-md py-xs font-body text-body-sm font-semibold transition-colors duration-300 ${
      active
        ? 'border-green-500 text-white'
        : 'border-green-500 bg-transparent text-heading hover:bg-green-50'
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

        <div className="isolate flex flex-wrap items-center gap-sm">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              aria-pressed={statusFilter === filter}
              onClick={() => setStatusFilter(filter)}
              className={filterClassName(statusFilter === filter)}
            >
              {statusFilter === filter && <TabHighlight layoutId="appointments-status-tab" className="bg-green-500" />}
              {statusLabel(filter)}
            </button>
          ))}
        </div>
      </div>

      {actionError && (
        <p className="m-0 mb-md text-left font-body text-body-sm text-danger">{actionError}</p>
      )}

      {statusFilter === 'BY_DATE' ? (
        <div className="grid grid-cols-1 gap-xl lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] items-start">
          <CalendarPanel value={selectedDate} onChange={setSelectedDate} markedDates={specialScheduleDates} />

          <div className="flex flex-col gap-md">
            <h2 className="m-0 font-heading text-h4 font-bold text-heading">
              {t('teacherAppointments.calendar.appointmentsForDay')}: <span className="text-green-600">{selectedDate?.toString()}</span>
            </h2>

            {loading && (
              <div className="grid grid-cols-1 gap-md">
                <SkeletonList count={daySkeletonCount}>{() => <AppointmentCard loading />}</SkeletonList>
              </div>
            )}

            {error && <p className="m-0 p-xl text-center font-body text-body text-danger">{error}</p>}

            {!loading && !error && (
              filteredAppointments.length === 0 ? (
                <div className="rounded-2xl border border-neutral-200 bg-white p-2xl text-center shadow-sm">
                  <p className="m-0 font-body text-body text-neutral-500">
                    {t('teacherAppointments.calendar.noAppointmentsForDay')}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-md">
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
          </div>
        </div>
      ) : (
        <>
          {loading && (
            <div className="grid grid-cols-1 gap-md xl:grid-cols-2">
              <SkeletonList count={statusSkeletonCount}>{() => <AppointmentCard loading />}</SkeletonList>
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
        </>
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