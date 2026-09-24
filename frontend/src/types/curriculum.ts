export type CurriculumStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface ApplicationInput {
  vacancyId: string | null
  applicantName: string
  applicantEmail: string
  applicantPhone: string | null
  language: string
  file: File | null
  certificates: File[]
}

export interface CertificateFile {
  id: string
  fileName: string
  fileUrl: string
}

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
