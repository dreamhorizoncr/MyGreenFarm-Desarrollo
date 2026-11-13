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

export interface TeacherDashboardSummary {
  groups: TeacherDashboardGroup[]
  childrenCount: number
  articleCount: number
  pendingCount: number
  priorities: DashboardPriority[]
  activities: DashboardActivity[]
  aiSummary: string
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
  dueAt: string | null
  priority: 'high' | 'medium' | 'low'
  href: string
}
