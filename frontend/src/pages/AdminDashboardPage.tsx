import StatusMessage from '../components/ui/StatusMessage.tsx'
import { CalendarX, Sparkles, UsersRound } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { getLocalTimeZone, today, type CalendarDate } from '@internationalized/date'
import AdminLayout from '../layout/AdminLayout.tsx'
import CalendarPanel from '../components/ui/CalendarPanel.tsx'
import { useCurriculums } from '../hooks/useCurriculums.ts'
import { useCalendarEvents } from '../hooks/useCalendarEvents.ts'
import type { CalendarEvent } from '../types/calendar.ts'
import { dashboardService } from '../services/dashboard.ts'
import { getErrorMessage } from '../utils/error.ts'
import { userStorage } from '../utils/userStorage.ts'
import type {
  AdminDashboardSummary,
  DashboardActivity,
  DashboardPriority,
  TeacherDashboardSummary,
} from '../types/dashboard.ts'
import {
  BookOpenTextIcon,
  CalendarDaysIcon,
  CheckIcon,
  ChevronRightIcon,
  ClockIcon,
  FileTextIcon,
  MessageSquarePlusIcon,
  RefreshCwIcon,
  UserIcon,
} from '@animateicons/react/lucide'

type Icon = ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean }>

interface StatCard {
  key: string
  label: string
  value: number | undefined
  icon: Icon
  href: string
  linkLabel: string
}

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

const ACTIVITY_ICONS: Record<DashboardActivity['type'], Icon> = {
  announcement: FileTextIcon,
  gallery: CalendarDaysIcon,
  forum: CheckIcon,
}

const priorityClasses = {
  high: 'border-danger-100 bg-danger-50 text-danger',
  medium: 'border-warning-200 bg-warning-50 text-warning',
  low: 'border-info-200 bg-info-50 text-info',
} as const

const cardClasses = 'rounded-2xl border border-neutral-200 bg-white p-lg shadow-sm'

/** Calendar month and selected day, shared by every dashboard. */
function useDashboardCalendar() {
  const [selectedDate, setSelectedDate] = useState<CalendarDate | null>(() => today(getLocalTimeZone()))
  const [calendarMonth, setCalendarMonth] = useState(() => today(getLocalTimeZone()).toString().slice(0, 7))
  const { events, error, fetchEvents } = useCalendarEvents()

  const reloadEvents = useCallback(() => {
    const range = monthRange(calendarMonth)
    void fetchEvents(range.from, range.to)
  }, [calendarMonth, fetchEvents])

  useEffect(() => {
    reloadEvents()
  }, [reloadEvents])

  const selectDate = (date: CalendarDate | null) => {
    setSelectedDate(date)
    if (date) setCalendarMonth(date.toString().slice(0, 7))
  }

  return { selectedDate, selectDate, setCalendarMonth, events, error, reloadEvents }
}

type DashboardCalendar = ReturnType<typeof useDashboardCalendar>

function DashboardHeader({ pendingCount, onRefresh }: Readonly<{ pendingCount: number; onRefresh: () => void }>) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage ?? i18n.language ?? 'es'
  const [dashboardDate] = useState(() => new Date())
  const firstName = userStorage.getUser()?.firstName?.trim()
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }),
    [locale],
  )

  return (
    <header className="flex items-start justify-between gap-lg">
      <div className="min-w-0">
        <h1 className="m-0 font-heading text-page-title font-bold leading-[1.15] text-heading">
          {firstName ? t('admin.dashboard.greeting', { name: firstName }) : t('admin.dashboard.title')}
        </h1>
        <p className="mt-2 font-body text-body text-neutral-500">
          {dateFormatter.format(dashboardDate)} · {t('admin.dashboard.pendingCount', { count: pendingCount })}
        </p>
      </div>
      <button
        type="button"
        aria-label={t('admin.dashboard.refresh')}
        onClick={onRefresh}
        className="mt-1 inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-green-500 text-heading transition-colors hover:bg-green-50 focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2"
      >
        <RefreshCwIcon size={18} aria-hidden="true" />
      </button>
    </header>
  )
}

function StatCards({ stats }: Readonly<{ stats: StatCard[] }>) {
  const { t } = useTranslation()
  return (
    <section aria-labelledby="dashboard-stats-title">
      <h2 id="dashboard-stats-title" className="sr-only">{t('admin.dashboard.statsTitle')}</h2>
      <div className="grid gap-md sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(({ key, label, value, icon: StatIcon, href, linkLabel }) => (
          <Link
            key={key}
            to={href}
            className="group rounded-2xl border border-neutral-200 bg-white p-lg shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2"
          >
            <div className="flex items-start justify-between gap-sm">
              <span className="flex size-11 items-center justify-center rounded-full bg-green-50 text-heading"><StatIcon size={21} aria-hidden={true} /></span>
              <ChevronRightIcon size={18} className="text-neutral-400 transition group-hover:translate-x-1 group-hover:text-link" aria-hidden="true" />
            </div>
            <p className="m-0 mt-lg font-body text-body-sm font-semibold text-neutral-500">{label}</p>
            <p className="m-0 mt-2xs font-heading text-h2 font-bold text-heading">{value ?? '—'}</p>
            <span className="mt-md inline-block font-body text-body-sm font-semibold text-link underline-offset-2 group-hover:underline">{linkLabel}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

function PriorityList({ items, loading }: Readonly<{ items: DashboardPriority[] | undefined; loading: boolean }>) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage ?? i18n.language ?? 'es'
  return (
    <section aria-labelledby="dashboard-priority-title" className={cardClasses}>
      <h2 id="dashboard-priority-title" className="m-0 font-heading text-h4 font-bold text-heading">{t('admin.dashboard.pending')}</h2>
      <ul className="m-0 mt-md list-none space-y-sm p-0">
        {items?.map((item) => (
          <li key={`${item.type}-${item.id}`}>
            <Link to={item.href} className="group flex items-center gap-sm rounded-xl border border-neutral-100 p-sm transition hover:border-orange-200 hover:bg-orange-50 focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2">
              <span className={`shrink-0 rounded-full border px-sm py-2xs font-body text-caption font-bold ${priorityClasses[item.priority]}`}>{t(`admin.dashboard.priority.${item.priority}`)}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-body text-body-sm font-semibold text-heading">{item.title}</span>
                {item.dueAt && (
                  <span className="block font-body text-caption text-neutral-500">{t('admin.dashboard.dueDate', { date: new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.dueAt)) })}</span>
                )}
              </span>
              <ChevronRightIcon size={17} className="shrink-0 text-neutral-400 transition group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
      {!loading && !items?.length && <p className="mt-md font-body text-body-sm text-neutral-500">{t('admin.dashboard.emptyState')}</p>}
    </section>
  )
}

function ActivityList({ title, items, loading }: Readonly<{ title: string; items: DashboardActivity[] | undefined; loading: boolean }>) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage ?? i18n.language ?? 'es'
  return (
    <section aria-labelledby="dashboard-activity-title" className={cardClasses}>
      <h2 id="dashboard-activity-title" className="m-0 font-heading text-h4 font-bold text-heading">{title}</h2>
      <ol className="m-0 mt-md list-none space-y-md p-0">
        {items?.map((item, index) => {
          const ActivityIcon = ACTIVITY_ICONS[item.type] ?? CheckIcon
          return (
            <li key={`${item.type}-${item.id}`} className="relative flex gap-sm">
              {index < items.length - 1 && <span className="absolute left-4 top-9 h-full border-l border-dashed border-neutral-200" aria-hidden="true" />}
              <span className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-green-50 text-heading"><ActivityIcon size={15} aria-hidden={true} /></span>
              <Link to={item.href} className="min-w-0">
                <span className="block truncate font-body text-body-sm text-heading hover:text-link">{item.title}</span>
                <span className="block font-body text-caption text-neutral-500">{relativeTime(item.createdAt, locale)}</span>
              </Link>
            </li>
          )
        })}
      </ol>
      {!loading && !items?.length && <p className="mt-md font-body text-body-sm text-neutral-500">{t('admin.dashboard.emptyState')}</p>}
    </section>
  )
}

function CalendarAside({ calendar, showAppointmentsLink }: Readonly<{ calendar: DashboardCalendar; showAppointmentsLink: boolean }>) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage ?? i18n.language ?? 'es'
  const { selectedDate, selectDate, setCalendarMonth, events, error } = calendar
  const currentDate = today(getLocalTimeZone()).toString()
  const selectedDateEvents = events.filter((event) => event.date === selectedDate?.toString())
  const markedDates = new Set(events.map((event) => event.date))
  const shortDateFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' }), [locale])
  const shownDate = selectedDate ?? today(getLocalTimeZone())

  return (
    <aside className="space-y-xl">
      <section aria-labelledby="dashboard-calendar-title" className={cardClasses}>
        <h2 id="dashboard-calendar-title" className="m-0 mb-md font-heading text-h4 font-bold text-heading">{t('admin.dashboard.calendar.title')}</h2>
        {error && <StatusMessage compact variant="error" description={t('admin.dashboard.calendar.loadError')} className="mb-md" />}
        <CalendarPanel
          value={selectedDate}
          onChange={selectDate}
          onFocusChange={(date) => setCalendarMonth(date.toString().slice(0, 7))}
          markedDates={markedDates}
          ariaLabel={t('admin.dashboard.calendar.ariaLabel')}
          showShortcuts={false}
          compact
          className="border-0 p-0 shadow-none"
        />
      </section>

      <section aria-labelledby="dashboard-agenda-title" className={cardClasses}>
        <h2 id="dashboard-agenda-title" className="m-0 font-heading text-h4 font-bold text-heading">{t('admin.dashboard.agenda.title')}</h2>
        <p className="m-0 mt-2xs font-body text-body-sm capitalize text-neutral-500">
          {shortDateFormatter.format(new Date(shownDate.year, shownDate.month - 1, shownDate.day))}
        </p>
        <ol className="m-0 mt-lg list-none space-y-md p-0">
          {selectedDateEvents.map((event) => (
            <li key={event.id} className={`relative flex gap-sm ${event.date < currentDate ? 'opacity-60' : ''}`}>
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
      {showAppointmentsLink && (
        <Link to="/admin/appointments" className="inline-flex w-full items-center justify-center rounded-full bg-orange-500 px-lg py-sm font-body text-body-sm font-bold text-white transition hover:bg-orange-600 focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2">
          {t('admin.dashboard.agenda.viewAll')}
        </Link>
      )}
    </aside>
  )
}

/**
 * Dashboard of the owner and the admin. The backend leaves the forum activity out for the admin,
 * who has no forum in the sidebar; everything else here is in both sidebars.
 */
function ManagerDashboard() {
  const { t } = useTranslation()
  const calendar = useDashboardCalendar()
  const { curriculums, fetchCurriculums } = useCurriculums()
  const [dashboardData, setDashboardData] = useState<AdminDashboardSummary | null>(null)
  const [dashboardLoadedKey, setDashboardLoadedKey] = useState<string | null>(null)
  const [dashboardError, setDashboardError] = useState<{ key: string; message: string } | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const pendingCount = (dashboardData?.pendingAppointmentCount ?? 0)
    + curriculums.filter((curriculum) => curriculum.status === 'PENDING').length

  useEffect(() => {
    void fetchCurriculums()
  }, [fetchCurriculums])

  const selectedDateString = (calendar.selectedDate ?? today(getLocalTimeZone())).toString()
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

  const stats: StatCard[] = [
    { key: 'todayAppointments', label: t('admin.dashboard.stats.todayAppointments.label'), value: dashboardData?.appointments.length, icon: CalendarDaysIcon, href: '/admin/appointments', linkLabel: t('admin.dashboard.viewPending') },
    { key: 'appointmentsToConfirm', label: t('admin.dashboard.stats.appointmentsToConfirm.label'), value: dashboardData?.pendingAppointmentCount, icon: ClockIcon, href: '/admin/appointments', linkLabel: t('admin.dashboard.viewPending') },
    { key: 'activeChildren', label: t('admin.dashboard.stats.activeChildren.label'), value: dashboardData?.activeChildrenCount, icon: UserIcon, href: '/admin/children', linkLabel: t('admin.dashboard.viewChildren') },
  ]

  return (
    <AdminLayout>
      <DashboardHeader
        pendingCount={pendingCount}
        onRefresh={() => {
          void fetchCurriculums()
          calendar.reloadEvents()
          setRefreshKey((key) => key + 1)
        }}
      />
      {currentDashboardError && <StatusMessage variant="error" description={t('admin.dashboard.loadError', { error: currentDashboardError })} className="mt-md" />}

      <div className="mt-xl grid grid-cols-1 gap-xl xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-xl">
          <section aria-labelledby="dashboard-summary-title" className={cardClasses}>
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

          <StatCards stats={stats} />

          <div className="grid gap-xl lg:grid-cols-2">
            <PriorityList items={dashboardData?.priorities} loading={dashboardLoading} />
            <ActivityList title={t('admin.dashboard.activity')} items={dashboardData?.activities} loading={dashboardLoading} />
          </div>
        </div>

        <CalendarAside calendar={calendar} showAppointmentsLink />
      </div>
    </AdminLayout>
  )
}

/**
 * Dashboard of a teacher. Their sidebar has only the forum and the children module (groups,
 * expedients, evaluations), so there are no appointments, curriculums or AI summary here.
 */
function TeacherDashboard() {
  const { t } = useTranslation()
  const calendar = useDashboardCalendar()
  const [data, setData] = useState<TeacherDashboardSummary | null>(null)
  const [loadedKey, setLoadedKey] = useState<number | null>(null)
  const [error, setError] = useState<{ key: number; message: string } | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const loading = loadedKey !== refreshKey
  const currentError = error?.key === refreshKey ? error.message : null

  useEffect(() => {
    let isCurrentRequest = true
    dashboardService.getTeacherSummary()
      .then((summary) => {
        if (!isCurrentRequest) return
        setData(summary)
        setLoadedKey(refreshKey)
        setError(null)
      })
      .catch((requestError: unknown) => {
        if (!isCurrentRequest) return
        setData(null)
        setLoadedKey(refreshKey)
        setError({ key: refreshKey, message: getErrorMessage(requestError) })
      })
    return () => {
      isCurrentRequest = false
    }
  }, [refreshKey])

  const stats: StatCard[] = [
    { key: 'myGroups', label: t('admin.dashboard.teacher.stats.myGroups'), value: data?.groups.length, icon: BookOpenTextIcon, href: '/admin/groups', linkLabel: t('admin.dashboard.teacher.viewGroups') },
    { key: 'groupChildren', label: t('admin.dashboard.teacher.stats.groupChildren'), value: data?.childrenCount, icon: UserIcon, href: '/admin/expedients', linkLabel: t('admin.dashboard.teacher.viewExpedients') },
    { key: 'forumArticles', label: t('admin.dashboard.teacher.stats.forumArticles'), value: data?.articleCount, icon: MessageSquarePlusIcon, href: '/admin/forum', linkLabel: t('admin.dashboard.teacher.viewArticles') },
  ]

  return (
    <AdminLayout>
      <DashboardHeader
        pendingCount={data?.pendingCount ?? 0}
        onRefresh={() => {
          calendar.reloadEvents()
          setRefreshKey((key) => key + 1)
        }}
      />
      {currentError && <StatusMessage variant="error" description={t('admin.dashboard.loadError', { error: currentError })} className="mt-md" />}

      <div className="mt-xl grid grid-cols-1 gap-xl xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-xl">
          <section aria-labelledby="dashboard-groups-title" className={cardClasses}>
            <h2 id="dashboard-groups-title" className="m-0 font-heading text-h4 font-bold text-heading">{t('admin.dashboard.teacher.groupsTitle')}</h2>
            {loading && <p className="m-0 mt-sm font-body text-body text-neutral-500">{t('admin.dashboard.loading')}</p>}
            {!loading && data && data.groups.length > 0 && (
              <ul className="m-0 mt-md flex list-none flex-wrap gap-sm p-0">
                {data.groups.map((group) => (
                  <li key={group.id}>
                    <Link
                      to="/admin/groups"
                      className="inline-flex items-center gap-xs rounded-full border border-green-100 bg-green-50 px-md py-xs font-body text-body-sm font-semibold text-heading transition hover:border-green-300 focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2"
                    >
                      {group.name}
                      <span className="font-normal text-neutral-500">· {t('admin.dashboard.teacher.groupChildren', { count: group.childCount })}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {!loading && data?.groups.length === 0 && (
              <StatusMessage compact variant="empty" icon={UsersRound} description={t('admin.dashboard.teacher.noGroups')} className="mt-md" />
            )}
          </section>

          <StatCards stats={stats} />

          <div className="grid gap-xl lg:grid-cols-2">
            <PriorityList items={data?.priorities} loading={loading} />
            <ActivityList title={t('admin.dashboard.teacher.articlesTitle')} items={data?.activities} loading={loading} />
          </div>
        </div>

        <CalendarAside calendar={calendar} showAppointmentsLink={false} />
      </div>
    </AdminLayout>
  )
}

function AdminDashboardPage() {
  return userStorage.getUser()?.role === 'TEACHER' ? <TeacherDashboard /> : <ManagerDashboard />
}

export default AdminDashboardPage
