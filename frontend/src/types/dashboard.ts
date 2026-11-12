import type { AppointmentStatus } from './appointment.ts'

export interface DashboardAppointment {
  id: string
  appointmentDate: string
  parentName: string
  childName: string
  status: AppointmentStatus
}

export interface AdminDashboardSummary {
  appointments: DashboardAppointment[]
  pendingAppointmentCount: number
  activeChildrenCount: number
  activities: DashboardActivity[]
  priorities: DashboardPriority[]
  aiSummary: string
}

/** Dashboard of a teacher: only their groups, the children in them and their forum articles. */
export interface TeacherDashboardSummary {
  groups: TeacherDashboardGroup[]
  childrenCount: number
  articleCount: number
  /** All pending tasks; `priorities` holds only the first six. */
  pendingCount: number
  priorities: DashboardPriority[]
  activities: DashboardActivity[]
}

export interface TeacherDashboardGroup {
  id: number
  name: string
  childCount: number
}

export interface DashboardActivity {
  id: string
  type: 'announcement' | 'gallery' | 'forum'
  title: string
  createdAt: string
  href: string
}

export interface DashboardPriority {
  id: string
  type: 'appointment' | 'curriculum' | 'expedient' | 'evaluation'
  title: string
  /** Missing when the task has no date, such as a child who still needs an expedient. */
  dueAt: string | null
  priority: 'high' | 'medium' | 'low'
  href: string
}
