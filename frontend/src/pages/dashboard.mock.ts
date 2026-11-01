export const DASHBOARD_DATE = new Date(2026, 9, 31)

export const dashboardMock = {
  userName: 'userName',
  pendingCount: 8,
  summary: 'summaryText',
  stats: [
    { key: 'todayAppointments', value: 6, icon: 'calendar', href: '/admin/citas' },
    { key: 'appointmentsToConfirm', value: 3, icon: 'clock', href: '/admin/citas' },
    { key: 'curriculumsToReview', value: 4, icon: 'file', href: '/admin/curriculums' },
  ],
  priorities: [
    { key: 'priorityOne', priority: 'high', date: 'priorityDateOne' },
    { key: 'priorityTwo', priority: 'medium', date: 'priorityDateTwo' },
    { key: 'priorityThree', priority: 'low', date: 'priorityDateThree' },
    { key: 'priorityFour', priority: 'high', date: 'priorityDateFour' },
  ],
  activity: [
    { key: 'activityOne', icon: 'check', time: 'activityTimeOne' },
    { key: 'activityTwo', icon: 'file', time: 'activityTimeTwo' },
    { key: 'activityThree', icon: 'calendar', time: 'activityTimeThree' },
    { key: 'activityFour', icon: 'user', time: 'activityTimeFour' },
    { key: 'activityFive', icon: 'check', time: 'activityTimeFive' },
  ],
  agenda: [
    { time: '08:00', family: 'familyOne', reason: 'reasonOne', status: 'confirmed' },
    { time: '11:00', family: 'familyTwo', reason: 'reasonTwo', status: 'pending' },
    { time: '14:00', family: 'familyThree', reason: 'reasonThree', status: 'cancelled' },
    { time: '16:00', family: 'familyFour', reason: 'reasonFour', status: 'confirmed' },
  ],
} as const

export type DashboardIconName = 'calendar' | 'clock' | 'file' | 'check' | 'user'
