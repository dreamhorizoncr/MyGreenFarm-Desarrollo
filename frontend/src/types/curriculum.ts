/** Status of a job application. */
export type CurriculumStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

/** Job application sent from the vacancies page. */
export interface ApplicationInput {
  /** Vacancy applied for; `null` for a spontaneous application. */
  vacancyId: string | null
  applicantName: string
  applicantEmail: string
  applicantPhone: string | null
  language: string
  /** The CV. */
  file: File | null
  certificates: File[]
}

/** A certificate attached to an application. */
export interface CertificateFile {
  id: string
  fileName: string
  fileUrl: string
}

/** A job application, as the owner and admins see it. */
export interface Curriculum {
  id: string
  vacancyId: string | null
  applicantName: string
  applicantEmail: string
  applicantPhone: string | null
  fileName: string | null
  fileUrl: string | null
  certificates: CertificateFile[]
  submittedAt: string
  status: CurriculumStatus
}
