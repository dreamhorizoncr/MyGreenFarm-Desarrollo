export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED'
export type ReferralSource = 'FRIEND' | 'SOCIAL_MEDIA' | 'GOOGLE_SEARCH' | 'FLYER_OR_AD' | 'OTHER'

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
  referralSource: ReferralSource
  referralOtherDetail?: string
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
  referralSource: ReferralSource
  referralOtherDetail: string | null
  teacherConclusion: string | null
  googleEventId: string | null
}

export interface AvailableDay {
  slots: string[]
  specialDay: boolean
  eventName: string | null
}

export type AvailableWeek = Record<string, AvailableDay>
