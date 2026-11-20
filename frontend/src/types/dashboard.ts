import type { AppointmentStatus } from './appointment.ts'

/** Appointment of the day shown on the dashboard. */
export interface DashboardAppointment {
  id: string
  appointmentDate: string
  parentName: string
  childName: string
  status: AppointmentStatus
}

/** Dashboard of the owner and admins for a day. */
export interface AdminDashboardSummary {
  appointments: DashboardAppointment[]
  pendingAppointmentCount: number
  activeChildrenCount: number
  activities: DashboardActivity[]
  priorities: DashboardPriority[]
  /** Summary of the day written by the AI. */
  aiSummary: string
}

/** Dashboard of a teacher. */
export interface TeacherDashboardSummary {
  groups: TeacherDashboardGroup[]
  childrenCount: number
  articleCount: number
  /** Evaluations the teacher still has to write. */
  pendingCount: number
  priorities: DashboardPriority[]
  activities: DashboardActivity[]
  aiSummary: string
}

/** A group led by the teacher. */
export interface TeacherDashboardGroup {
  id: number
  name: string
  childCount: number
}

/** Recent content published on the site. */
export interface DashboardActivity {
  id: string
  type: 'announcement' | 'gallery' | 'forum'
  title: string
  createdAt: string
  /** Admin route to open it. */
  href: string
}

/** Pending task, sorted by urgency. */
export interface DashboardPriority {
  id: string
  type: 'appointment' | 'curriculum' | 'expedient' | 'evaluation'
  title: string
  dueAt: string | null
  priority: 'high' | 'medium' | 'low'
  href: string
}
