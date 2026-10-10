import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarClockIcon, PencilIcon, SearchIcon } from '@animateicons/react/lucide'
import { Calendar, Button, ButtonGroup } from '@heroui/react'
import { today, getLocalTimeZone, startOfWeek, startOfMonth } from '@internationalized/date'
import { I18nProvider } from 'react-aria-components'
import type { CalendarDate } from '@internationalized/date'
import ChangeAppointmentStatusModal from './ChangeAppointmentStatusModal.tsx'
import RescheduleAppointmentModal from './RescheduleAppointmentModal.tsx'
import AppointmentDetailsModal from './AppointmentDetailsModal.tsx'
import Skeleton from './ui/Skeleton.tsx'
import Pagination from './ui/Pagination.tsx'
import { useAppointments } from '../hooks/useAppointments.ts'
import { useClientPagination } from '../hooks/useClientPagination.ts'
import { notify } from '../utils/notifications.ts'
import type { Appointment, AppointmentStatus } from '../types/appointment.ts'
import { useAvailability } from '../hooks/useAvailability.ts'

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
      className={`group relative flex cursor-pointer flex-col rounded-2xl border border-neutral-200 bg-white p-lg shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
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

  const { exceptions } = useAvailability()

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('BY_DATE')
  const [selectedDate, setValue] = useState<CalendarDate | null>(today(getLocalTimeZone()))
  const [focusedDate, setFocusedDate] = useState<CalendarDate>(today(getLocalTimeZone()))
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
    return appointments.filter((appointment) => {
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

  const statusLabel = (filter: StatusFilter): string => {
    if (filter === 'BY_DATE') return t('teacherAppointments.byDate')
    return filter === 'ALL'
      ? t('teacherAppointments.all')
      : t(`teacherAppointments.status.${filter.toLowerCase()}` as 'teacherAppointments.status.pending')
  }

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

      {/* Barra superior de búsqueda y filtros */}
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

        <div className="flex flex-wrap items-center gap-sm">
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

      {statusFilter === 'BY_DATE' ? (
        <div className="grid grid-cols-1 gap-xl lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] items-start">
          {/* El calendario conserva su ancho máximo y las citas usan el espacio restante. */}
          <div className="w-full max-w-[420px] rounded-2xl border border-neutral-200 bg-white p-lg shadow-sm flex flex-col items-center gap-6">
            <ButtonGroup
              fullWidth
              size="sm"
              variant="tertiary"
              className="bg-green-500 text-white rounded-2xl p-1.5 shadow-inner flex justify-between w-full"
            >
              <Button
                className="rounded-2xl text-white font-medium hover:bg-green-400/40 transition-colors data-[pressed=true]:scale-95 px-8 py-2"
                onPress={() => {
                  const todayDate = today(getLocalTimeZone())
                  setValue(todayDate)
                  setFocusedDate(todayDate)
                }}
              >
                {t('teacherAppointments.calendar.today')}
              </Button>
              <Button
                className="rounded-2xl text-white font-medium hover:bg-green-400/40 transition-colors data-[pressed=true]:scale-95 px-8 py-2"
                onPress={() => {
                  const nextWeekStart = startOfWeek(today(getLocalTimeZone()), i18n.language)
                  setValue(nextWeekStart)
                  setFocusedDate(nextWeekStart)
                }}
              >
                {t('teacherAppointments.calendar.week')}
              </Button>
              <Button
                className="rounded-2xl text-white font-medium hover:bg-green-400/40 transition-colors data-[pressed=true]:scale-95 px-8 py-2"
                onPress={() => {
                  const nextMonthStart = startOfMonth(today(getLocalTimeZone()))
                  setValue(nextMonthStart)
                  setFocusedDate(nextMonthStart)
                }}
              >
                {t('teacherAppointments.calendar.month')}
              </Button>
            </ButtonGroup>

            <I18nProvider locale={i18n.resolvedLanguage ?? i18n.language ?? 'es'}>
              <Calendar
                aria-label={t('teacherAppointments.calendar.ariaLabel')}
                focusedValue={focusedDate}
                value={selectedDate}
                onChange={setValue}
                onFocusChange={setFocusedDate}
                className="flex flex-col items-center w-full"
              >
                <Calendar.Header className="w-full flex justify-between items-center px-2 pb-4">
                  <Calendar.Heading className="font-heading font-bold text-xl capitalize text-heading" />
                  <div className="flex gap-2">
                    <Calendar.NavButton slot="previous" />
                    <Calendar.NavButton slot="next" />
                  </div>
                </Calendar.Header>
                <Calendar.Grid className="w-full border-collapse">
                  <Calendar.GridHeader className="mb-3">
                    {(day) => <Calendar.HeaderCell className="w-10 h-10 text-center font-semibold text-md text-neutral-500">{day}</Calendar.HeaderCell>}
                  </Calendar.GridHeader>
                  <Calendar.GridBody>
                    {(date) => {
                      const dateString = date.toString()
                      const isSpecial = specialScheduleDates.has(dateString)

                      return (
                        <Calendar.Cell
                          date={date}
                          className={({ isOutsideMonth, isSelected }) =>
                            `relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors text-md font-medium mx-auto m-1 
                            ${isOutsideMonth ? 'text-neutral-300 opacity-60' : 'text-heading'} 
                            ${isSelected ? 'bg-orange-500 shadow-md text-white' : 'hover:bg-neutral-100'} 
                            ${isSpecial && !isSelected ? 'after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:size-1.5 after:rounded-full after:bg-orange-500' : ''}`
                          }
                        />
                      )
                    }}
                  </Calendar.GridBody>
                </Calendar.Grid>
              </Calendar>
            </I18nProvider>

            <div className="flex flex-wrap justify-center gap-2 w-full pt-6 border-t border-neutral-100">
              <Button
                size="sm"
                variant="tertiary"
                onPress={() => setValue(null)}
                className="border-green-500 bg-white text-heading hover:bg-green-50 px-6 py-2 rounded-full border items-center justify-center font-body text-sm font-semibold transition-colors"
              >
                {t('teacherAppointments.calendar.clear')}
              </Button>
            </div>
          </div>

          {/* Columna Derecha: Tarjetas de citas con mejor espaciado */}
          <div className="flex flex-col gap-md">
            <h2 className="m-0 font-heading text-xl font-bold text-heading">
              {t('teacherAppointments.calendar.appointmentsForDay')}: <span className="text-green-600">{selectedDate?.toString()}</span>
            </h2>

            {loading && (
              <div className="grid grid-cols-1 gap-md">
                <AppointmentCard loading />
                <AppointmentCard loading />
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
        /* Vista de Estados (Todas, Pendiente, Confirmada, Cancelada) */
        <>
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