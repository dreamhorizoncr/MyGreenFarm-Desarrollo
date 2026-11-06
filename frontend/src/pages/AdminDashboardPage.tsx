import StatusMessage from '../components/ui/StatusMessage.tsx'
import { CalendarX, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState, type ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { getLocalTimeZone, today, type CalendarDate } from '@internationalized/date'
import AdminLayout from '../layout/AdminLayout.tsx'
import CalendarPanel from '../components/ui/CalendarPanel.tsx'
import { useAppointments } from '../hooks/useAppointments.ts'
import { useCurriculums } from '../hooks/useCurriculums.ts'
import { useCalendarEvents } from '../hooks/useCalendarEvents.ts'
import type { CalendarEvent } from '../types/calendar.ts'
import { dashboardService } from '../services/dashboard.ts'
import { getErrorMessage } from '../utils/error.ts'
import type { AdminDashboardSummary } from '../types/dashboard.ts'
import {
  CalendarDaysIcon,
  CheckIcon,
  ChevronRightIcon,
  ClockIcon,
  FileTextIcon,
  RefreshCwIcon,
  UserIcon,
} from '@animateicons/react/lucide'
import { dashboardMock, type DashboardIconName } from './dashboard.mock.ts'

type Icon = ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean }>
function monthRange(month: string) {
  const [year, monthNumber] = month.split('-').map(Number)
  const lastDay = new Date(year, monthNumber, 0).getDate()
  return {
    from: `${month}-01`,
    to: `${month}-${String(lastDay).padStart(2, '0')}`,
  }
}

function eventTime(event: CalendarEvent, locale: string) {
  if (event.allDay) return null
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(event.start))
}

function relativeTime(value: string, locale: string) {
  const difference = new Date(value).getTime() - Date.now()
  const minutes = Math.round(difference / 60000)
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  if (Math.abs(minutes) < 60) return formatter.format(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return formatter.format(hours, 'hour')
  return formatter.format(Math.round(hours / 24), 'day')
}

const ICONS: Record<DashboardIconName, Icon> = {
  calendar: CalendarDaysIcon,
  clock: ClockIcon,
  file: FileTextIcon,
  check: CheckIcon,
  user: UserIcon,
}

const priorityClasses = {
  high: 'border-danger-100 bg-danger-50 text-danger',
  medium: 'border-warning-200 bg-warning-50 text-warning',
  low: 'border-info-200 bg-info-50 text-info',
} as const

function AdminDashboardPage() {
  const { t, i18n } = useTranslation()
  const [selectedDate, setSelectedDate] = useState<CalendarDate | null>(() => today(getLocalTimeZone()))
  const [calendarMonth, setCalendarMonth] = useState(() => today(getLocalTimeZone()).toString().slice(0, 7))
  const [dashboardDate] = useState(() => new Date())
  const { appointments, fetchAppointments } = useAppointments()
  const { curriculums, fetchCurriculums } = useCurriculums()
  const { events, error: calendarError, fetchEvents } = useCalendarEvents()
  const [dashboardData, setDashboardData] = useState<AdminDashboardSummary | null>(null)
  const [dashboardLoadedKey, setDashboardLoadedKey] = useState<string | null>(null)
  const [dashboardError, setDashboardError] = useState<{ key: string; message: string } | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const locale = i18n.resolvedLanguage ?? i18n.language ?? 'es'
  const currentDate = today(getLocalTimeZone()).toString()
  const pendingCount = appointments.filter((appointment) => appointment.status === 'PENDING').length
    + curriculums.filter((curriculum) => curriculum.status === 'PENDING').length

  useEffect(() => {
    void fetchAppointments()
    void fetchCurriculums()
  }, [fetchAppointments, fetchCurriculums])

  useEffect(() => {
    const range = monthRange(calendarMonth)
    void fetchEvents(range.from, range.to)
  }, [calendarMonth, fetchEvents])

  const selectedDateEvents = events.filter((event) => event.date === selectedDate?.toString())
  const markedDates = new Set(events.map((event) => event.date))
  const handleCalendarChange = (date: CalendarDate | null) => {
    setSelectedDate(date)
    if (date) setCalendarMonth(date.toString().slice(0, 7))
  }

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }),
    [locale],
  )
  const shortDateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' }),
    [locale],
  )
  const selectedDateString = (selectedDate ?? today(getLocalTimeZone())).toString()
  const dashboardRequestKey = `${selectedDateString}:${refreshKey}`
  const dashboardLoading = dashboardLoadedKey !== dashboardRequestKey
  const currentDashboardError = dashboardError?.key === dashboardRequestKey ? dashboardError.message : null

  useEffect(() => {
    let isCurrentRequest = true

    dashboardService.getSummary(selectedDateString)
      .then((summary) => {
        if (isCurrentRequest) {
          setDashboardData(summary)
          setDashboardLoadedKey(dashboardRequestKey)
          setDashboardError(null)
        }
      })
      .catch((requestError: unknown) => {
        if (isCurrentRequest) {
          setDashboardData(null)
          setDashboardLoadedKey(dashboardRequestKey)
          setDashboardError({ key: dashboardRequestKey, message: getErrorMessage(requestError) })
        }
      })

    return () => {
      isCurrentRequest = false
    }
  }, [dashboardRequestKey, selectedDateString])

  const stats = [
    { key: 'todayAppointments', label: 'admin.dashboard.stats.todayAppointments.label', value: dashboardData?.appointments.length, icon: 'calendar', href: '/admin/citas' },
    { key: 'appointmentsToConfirm', label: 'admin.dashboard.stats.appointmentsToConfirm.label', value: dashboardData?.pendingAppointmentCount, icon: 'clock', href: '/admin/citas' },
    { key: 'activeChildren', label: 'admin.dashboard.stats.activeChildren.label', value: dashboardData?.activeChildrenCount, icon: 'user', href: '/admin/children' },
  ] as const

  return (
    <AdminLayout>
      <header className="flex items-start justify-between gap-lg">
        <div className="min-w-0">
          <h1 className="m-0 font-heading text-page-title font-bold leading-[1.15] text-heading">
            {t('admin.dashboard.greeting', { name: t(`admin.dashboard.${dashboardMock.userName}`) })}
          </h1>
          <p className="mt-2 font-body text-body text-neutral-500">
            {dateFormatter.format(dashboardDate)} · {t('admin.dashboard.pendingCount', { count: pendingCount })}
          </p>
        </div>
        <button
          type="button"
          aria-label={t('admin.dashboard.refresh')}
          onClick={() => {
            void fetchAppointments()
            void fetchCurriculums()
            const range = monthRange(calendarMonth)
            void fetchEvents(range.from, range.to)
            setRefreshKey((key) => key + 1)
          }}
          className="mt-1 inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-green-500 text-heading transition-colors hover:bg-green-50 focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2"
        >
          <RefreshCwIcon size={18} aria-hidden="true" />
        </button>
      </header>
      {currentDashboardError && <StatusMessage variant="error" description={t('admin.dashboard.loadError', { error: currentDashboardError })} className="mt-md" />}

      <div className="mt-xl grid gap-xl xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-xl">

          <section aria-labelledby="dashboard-summary-title" className="rounded-2xl border border-neutral-200 bg-white p-lg shadow-sm">
        <h2 id="dashboard-summary-title" className="m-0 font-heading text-h4 font-bold text-heading">{t('admin.dashboard.summaryTitle')}</h2>
        {dashboardLoading || dashboardData?.aiSummary ? (
          <p className="m-0 mt-sm font-body text-body text-neutral-500">
            {dashboardLoading ? t('admin.dashboard.summaryLoading') : dashboardData?.aiSummary}
          </p>
        ) : (
          <StatusMessage
            compact
            variant={currentDashboardError ? 'error' : 'empty'}
            icon={currentDashboardError ? undefined : Sparkles}
            description={t('admin.dashboard.summaryUnavailable')}
            className="mt-md"
          />
        )}
      </section>
      
          <section aria-labelledby="dashboard-stats-title">
            <h2 id="dashboard-stats-title" className="sr-only">{t('admin.dashboard.statsTitle')}</h2>
            <div className="grid gap-md sm:grid-cols-2 lg:grid-cols-3">
              {stats.map((stat) => {
                const Icon = ICONS[stat.icon]
                return (
                  <Link
                    key={stat.key}
                    to={stat.href}
                    className="group rounded-2xl border border-neutral-200 bg-white p-lg shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2"
                  >
                    <div className="flex items-start justify-between gap-sm">
                      <span className="flex size-11 items-center justify-center rounded-full bg-green-50 text-heading"><Icon size={21} aria-hidden={true} /></span>
                      <ChevronRightIcon size={18} className="text-neutral-400 transition group-hover:translate-x-1 group-hover:text-link" aria-hidden="true" />
                    </div>
                    <p className="m-0 mt-lg font-body text-body-sm font-semibold text-neutral-500">{t(stat.label)}</p>
                    <p className="m-0 mt-2xs font-heading text-h2 font-bold text-heading">{stat.value ?? '—'}</p>
                    <span className="mt-md inline-block font-body text-body-sm font-semibold text-link underline-offset-2 group-hover:underline">{t(stat.key === 'activeChildren' ? 'admin.dashboard.viewChildren' : 'admin.dashboard.viewPending')}</span>
                  </Link>
                )
              })}
            </div>
          </section>

          <div className="grid gap-xl lg:grid-cols-2">
            <section aria-labelledby="dashboard-priority-title" className="rounded-2xl border border-neutral-200 bg-white p-lg shadow-sm">
              <h2 id="dashboard-priority-title" className="m-0 font-heading text-h4 font-bold text-heading">{t('admin.dashboard.pending')}</h2>
              <ul className="m-0 mt-md list-none space-y-sm p-0">
                {dashboardData?.priorities.map((item) => (
                  <li key={`${item.type}-${item.id}`}>
                    <Link to={item.href} className="group flex items-center gap-sm rounded-xl border border-neutral-100 p-sm transition hover:border-orange-200 hover:bg-orange-50 focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2">
                      <span className={`shrink-0 rounded-full border px-sm py-2xs font-body text-caption font-bold ${priorityClasses[item.priority]}`}>{t(`admin.dashboard.priority.${item.priority}`)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-body text-body-sm font-semibold text-heading">{item.title}</span>
                        <span className="block font-body text-caption text-neutral-500">{t('admin.dashboard.dueDate', { date: new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.dueAt)) })}</span>
                      </span>
                      <ChevronRightIcon size={17} className="shrink-0 text-neutral-400 transition group-hover:translate-x-1" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
              {!dashboardLoading && !dashboardData?.priorities.length && <p className="mt-md font-body text-body-sm text-neutral-500">{t('admin.dashboard.emptyState')}</p>}
            </section>

            <section aria-labelledby="dashboard-activity-title" className="rounded-2xl border border-neutral-200 bg-white p-lg shadow-sm">
              <h2 id="dashboard-activity-title" className="m-0 font-heading text-h4 font-bold text-heading">{t('admin.dashboard.activity')}</h2>
              <ol className="m-0 mt-md list-none space-y-md p-0">
                {dashboardData?.activities.map((item, index) => {
                  const iconName: DashboardIconName = item.type === 'announcement' ? 'file' : item.type === 'gallery' ? 'calendar' : 'check'
                  const Icon = ICONS[iconName]
                  return (
                    <li key={`${item.type}-${item.id}`} className="relative flex gap-sm">
                      {index < (dashboardData?.activities.length ?? 0) - 1 && <span className="absolute left-4 top-9 h-full border-l border-dashed border-neutral-200" aria-hidden="true" />}
                      <span className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-green-50 text-heading"><Icon size={15} aria-hidden={true} /></span>
                      <Link to={item.href} className="min-w-0">
                        <span className="block truncate font-body text-body-sm text-heading hover:text-link">{item.title}</span>
                        <span className="block font-body text-caption text-neutral-500">{relativeTime(item.createdAt, locale)}</span>
                      </Link>
                    </li>
                  )
                })}
              </ol>
              {!dashboardLoading && !dashboardData?.activities.length && <p className="mt-md font-body text-body-sm text-neutral-500">{t('admin.dashboard.emptyState')}</p>}
            </section>
          </div>
        </div>

        <aside className="space-y-xl">
          <section aria-labelledby="dashboard-calendar-title" className="rounded-2xl border border-neutral-200 bg-white p-lg shadow-sm">
            <h2 id="dashboard-calendar-title" className="m-0 mb-md font-heading text-h4 font-bold text-heading">{t('admin.dashboard.calendar.title')}</h2>
            {calendarError && <StatusMessage compact variant="error" description={t('admin.dashboard.calendar.loadError')} className="mb-md" />}
            <CalendarPanel
              value={selectedDate}
              onChange={handleCalendarChange}
              onFocusChange={(date) => setCalendarMonth(date.toString().slice(0, 7))}
              markedDates={markedDates}
              ariaLabel={t('admin.dashboard.calendar.ariaLabel')}
              showShortcuts={false}
              compact
              className="border-0 p-0 shadow-none"
            />
          </section>

          <section aria-labelledby="dashboard-agenda-title" className="rounded-2xl border border-neutral-200 bg-white p-lg shadow-sm">
            <h2 id="dashboard-agenda-title" className="m-0 font-heading text-h4 font-bold text-heading">{t('admin.dashboard.agenda.title')}</h2>
            <p className="m-0 mt-2xs font-body text-body-sm capitalize text-neutral-500">
              {shortDateFormatter.format(selectedDate ? new Date(selectedDate.year, selectedDate.month - 1, selectedDate.day) : dashboardDate)}
            </p>
            <ol className="m-0 mt-lg list-none space-y-md p-0">
              {selectedDateEvents.map((event) => (
                <li
                  key={event.id}
                  className={`relative flex gap-sm ${event.date < currentDate ? 'opacity-60' : ''}`}
                >
                  <time className="w-12 shrink-0 pt-2xs font-body text-caption font-bold text-neutral-500">{eventTime(event, locale) ?? '—'}</time>
                  <div className="relative flex-1 border-l-2 border-green-100 pl-md">
                    <span className="block font-body text-body-sm font-bold text-heading">{event.title}</span>
                    <span className={`mt-xs inline-block rounded-full px-sm py-2xs font-body text-caption font-bold ${event.type === 'BIRTHDAY' ? 'bg-info-50 text-info' : 'bg-warning-50 text-warning'}`}>
                      {t(`admin.dashboard.calendar.eventTypes.${event.type}`)}
                    </span>
                  </div>
                </li>
              ))}
              {selectedDateEvents.length === 0 && (
                <li><StatusMessage compact icon={CalendarX} description={t('admin.dashboard.calendar.emptyDay')} /></li>
              )}
            </ol>
          </section>
          <Link to="/admin/citas" className="inline-flex w-full items-center justify-center rounded-full bg-orange-500 px-lg py-sm font-body text-body-sm font-bold text-white transition hover:bg-orange-600 focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2">
            {t('admin.dashboard.agenda.viewAll')}
          </Link>
        </aside>
      </div>
    </AdminLayout>
  )
}

export default AdminDashboardPage