import { useMemo, useState, type ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { parseDate, type CalendarDate } from '@internationalized/date'
import AdminLayout from '../layout/AdminLayout.tsx'
import CalendarPanel from '../components/ui/CalendarPanel.tsx'
import {
  CalendarDaysIcon,
  CheckIcon,
  ChevronRightIcon,
  ClockIcon,
  FileTextIcon,
  RefreshCwIcon,
  UserIcon,
} from '@animateicons/react/lucide'
import { DASHBOARD_DATE, dashboardMock, type DashboardIconName } from './dashboard.mock.ts'

type Icon = ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean }>
type Period = 'today' | 'thisWeek' | 'thisMonth'

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
  const [period, setPeriod] = useState<Period>('today')
  const [selectedDate, setSelectedDate] = useState<CalendarDate | null>(() => parseDate('2026-10-31'))
  const locale = i18n.resolvedLanguage ?? i18n.language ?? 'es'
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }),
    [locale],
  )
  const shortDateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' }),
    [locale],
  )

  return (
    <AdminLayout>
      <header>
        <h1 className="m-0 font-heading text-page-title font-bold leading-[1.15] text-heading">
          {t('admin.dashboard.greeting', { name: t(`admin.dashboard.${dashboardMock.userName}`) })}
        </h1>
        <p className="mt-2 font-body text-body text-neutral-500">
          {dateFormatter.format(DASHBOARD_DATE)} · {t('admin.dashboard.pendingCount', { count: dashboardMock.pendingCount })}
        </p>
      </header>

      <div className="mt-xl flex flex-wrap items-center justify-between gap-sm" role="group" aria-label={t('admin.dashboard.periodLabel')}>
        <div className="flex flex-wrap gap-sm">
          {(['today', 'thisWeek', 'thisMonth'] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={period === option}
              onClick={() => setPeriod(option)}
              className={`rounded-full border px-md py-xs font-body text-body-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2 ${
                period === option
                  ? 'border-orange-500 bg-orange-500 text-white'
                  : 'border-green-500 bg-transparent text-heading hover:bg-green-50'
              }`}
            >
              {t(`admin.dashboard.filters.${option}`)}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-label={t('admin.dashboard.refresh')}
          className="inline-flex size-10 items-center justify-center rounded-full border border-green-500 text-heading transition-colors hover:bg-green-50 focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2"
        >
          <RefreshCwIcon size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="mt-xl grid gap-xl xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-xl">
          <section aria-labelledby="dashboard-summary-title" className="rounded-2xl border border-neutral-200 bg-white p-lg shadow-sm">
            <h2 id="dashboard-summary-title" className="m-0 font-heading text-h4 font-bold text-heading">{t('admin.dashboard.summaryTitle')}</h2>
            <p className="m-0 mt-sm font-body text-body text-neutral-500">{t(`admin.dashboard.${dashboardMock.summary}`)}</p>
          </section>

          <section aria-labelledby="dashboard-stats-title">
            <h2 id="dashboard-stats-title" className="sr-only">{t('admin.dashboard.statsTitle')}</h2>
            <div className="grid gap-md sm:grid-cols-2 lg:grid-cols-3">
              {dashboardMock.stats.map((stat) => {
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
                    <p className="m-0 mt-lg font-body text-body-sm font-semibold text-neutral-500">{t(`admin.dashboard.stats.${stat.key}.label`)}</p>
                    <p className="m-0 mt-2xs font-heading text-h2 font-bold text-heading">{stat.value}</p>
                    <span className="mt-md inline-block font-body text-body-sm font-semibold text-link underline-offset-2 group-hover:underline">{t('admin.dashboard.viewPending')}</span>
                  </Link>
                )
              })}
            </div>
          </section>

          <div className="grid gap-xl lg:grid-cols-2">
            <section aria-labelledby="dashboard-priority-title" className="rounded-2xl border border-neutral-200 bg-white p-lg shadow-sm">
              <h2 id="dashboard-priority-title" className="m-0 font-heading text-h4 font-bold text-heading">{t('admin.dashboard.pending')}</h2>
              <ul className="m-0 mt-md list-none space-y-sm p-0">
                {dashboardMock.priorities.map((item) => (
                  <li key={item.key}>
                    <Link to="/admin/citas" className="group flex items-center gap-sm rounded-xl border border-neutral-100 p-sm transition hover:border-orange-200 hover:bg-orange-50 focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2">
                      <span className={`shrink-0 rounded-full border px-sm py-2xs font-body text-caption font-bold ${priorityClasses[item.priority]}`}>{t(`admin.dashboard.priority.${item.priority}`)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-body text-body-sm font-semibold text-heading">{t(`admin.dashboard.items.${item.key}`)}</span>
                        <span className="block font-body text-caption text-neutral-500">{t('admin.dashboard.dueDate', { date: t(`admin.dashboard.${item.date}`) })}</span>
                      </span>
                      <ChevronRightIcon size={17} className="shrink-0 text-neutral-400 transition group-hover:translate-x-1" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="sr-only">{t('admin.dashboard.emptyState')}</p>
            </section>

            <section aria-labelledby="dashboard-activity-title" className="rounded-2xl border border-neutral-200 bg-white p-lg shadow-sm">
              <h2 id="dashboard-activity-title" className="m-0 font-heading text-h4 font-bold text-heading">{t('admin.dashboard.activity')}</h2>
              <ol className="m-0 mt-md list-none space-y-md p-0">
                {dashboardMock.activity.map((item, index) => {
                  const Icon = ICONS[item.icon]
                  return (
                    <li key={item.key} className="relative flex gap-sm">
                      {index < dashboardMock.activity.length - 1 && <span className="absolute left-4 top-9 h-full border-l border-dashed border-neutral-200" aria-hidden="true" />}
                      <span className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-green-50 text-heading"><Icon size={15} aria-hidden={true} /></span>
                      <span className="min-w-0">
                        <span className="block font-body text-body-sm text-heading">{t(`admin.dashboard.items.${item.key}`)}</span>
                        <span className="block font-body text-caption text-neutral-500">{t(`admin.dashboard.${item.time}`)}</span>
                      </span>
                    </li>
                  )
                })}
              </ol>
              <p className="sr-only">{t('admin.dashboard.emptyState')}</p>
            </section>
          </div>
        </div>

        <aside className="space-y-xl">
          <section aria-labelledby="dashboard-calendar-title" className="rounded-2xl border border-neutral-200 bg-white p-lg shadow-sm">
            <h2 id="dashboard-calendar-title" className="m-0 mb-md font-heading text-h4 font-bold text-heading">{t('admin.dashboard.calendar.title')}</h2>
            <CalendarPanel
              value={selectedDate}
              onChange={setSelectedDate}
              ariaLabel={t('admin.dashboard.calendar.ariaLabel')}
              showShortcuts={false}
              compact
              className="border-0 p-0 shadow-none"
            />
          </section>

          <section aria-labelledby="dashboard-agenda-title" className="rounded-2xl border border-neutral-200 bg-white p-lg shadow-sm">
            <h2 id="dashboard-agenda-title" className="m-0 font-heading text-h4 font-bold text-heading">{t('admin.dashboard.agenda.title')}</h2>
            <p className="m-0 mt-2xs font-body text-body-sm capitalize text-neutral-500">{shortDateFormatter.format(DASHBOARD_DATE)}</p>
            <ol className="m-0 mt-lg list-none space-y-md p-0">
              {dashboardMock.agenda.map((appointment) => (
                <li key={appointment.time} className="relative flex gap-sm">
                  <time className="w-12 shrink-0 pt-2xs font-body text-caption font-bold text-neutral-500">{appointment.time}</time>
                  <div className="relative flex-1 border-l-2 border-green-100 pl-md">
                    <span className="block font-body text-body-sm font-bold text-heading">{t(`admin.dashboard.agenda.${appointment.family}`)}</span>
                    <span className="block font-body text-caption text-neutral-500">{t(`admin.dashboard.agenda.${appointment.reason}`)}</span>
                    <span className={`mt-xs inline-block rounded-full px-sm py-2xs font-body text-caption font-bold ${appointment.status === 'confirmed' ? 'bg-success-50 text-success' : appointment.status === 'pending' ? 'bg-warning-50 text-warning' : 'bg-danger-50 text-danger'}`}>
                      {t(`admin.dashboard.agenda.status.${appointment.status}`)}
                    </span>
                  </div>
                </li>
              ))}
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