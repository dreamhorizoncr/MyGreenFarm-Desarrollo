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
}
