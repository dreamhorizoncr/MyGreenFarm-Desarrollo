import type { PageResponse } from './page.ts'

/** Status of a visit appointment. */
export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED'
/** How the family heard about the school. */
export type ReferralSource = 'FRIEND' | 'SOCIAL_MEDIA' | 'GOOGLE_SEARCH' | 'FLYER_OR_AD' | 'OTHER'

/** Data of a visit booked by a family. */
export interface AppointmentRequest {
  /** Type of identification, `Costarricense` or a foreign document. */
  idType: string
  parentIdentification: string
  parentName: string
  parentEmail: string
  parentPhone: string
  parentOccupation: string
  childName: string
  /** Start of the slot, ISO date and time. */
  appointmentDate: string
  parentNotes: string
  referralSource: ReferralSource
  referralOtherDetail?: string
  /** Language of the confirmation emails. */
  language: string
  /** ID of the form that holds the slot, so the booking uses that hold. */
  holdId?: string
}

/** A visit appointment, as the owner and admins see it. */
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
  /** Notes written after the visit. */
  teacherConclusion: string | null
}

/** A page of appointments. */
export type AppointmentPage = PageResponse<Appointment>

/** Free slots of a day. */
export interface AvailableDay {
  /** Start times of the free slots, `HH:mm:ss`. */
  slots: string[]
  /** Whether the day has an exception to the usual hours. */
  specialDay: boolean
  /** Name of the exception, for example a holiday. */
  eventName: string | null
}

/** Free slots of a week, by day (`yyyy-MM-dd`). */
export type AvailableWeek = Record<string, AvailableDay>
