export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED'

export interface AppointmentRequest {
  idType: string
  parentIdentification: string
  parentName: string
  parentEmail: string
  parentPhone: string
  parentOccupation: string
  childName: string
  appointmentDate: string
  parentNotes: string
  language: string
}

export interface Appointment {
  id: string
  parentIdentification: string
  parentName: string
  parentEmail: string
  parentPhone: string
  parentOccupation: string
  childName: string
  appointmentDate: string
  status: AppointmentStatus
  parentNotes: string
  teacherConclusion: string | null
  googleEventId: string | null
}

export type AvailableWeek = Record<string, string[]>