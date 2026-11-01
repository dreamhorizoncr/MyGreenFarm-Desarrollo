export const dashboardMock = {
  userName: 'userName',
  summary: 'summaryText',
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
} as const

export type DashboardIconName = 'calendar' | 'clock' | 'file' | 'check' | 'user'
