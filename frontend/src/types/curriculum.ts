export type CurriculumStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

// Mismo patrón que AnnouncementRequest/Announcement en types/announcement.ts:
// ApplicationInput es lo que se envía (con file: File, sin id) y Curriculum
// es la entidad completa que devuelve el backend (con fileUrl en vez de
// file). No hay que tocar estos tipos cuando exista el endpoint real; ver
// services/curriculum.ts para lo que sí cambia.
export interface ApplicationInput {
  vacancyId: string
  applicantName: string
  applicantEmail: string
  applicantPhone: string | null
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
  vacancyId: string
  applicantName: string
  applicantEmail: string
  applicantPhone: string | null
  fileName: string | null
  fileUrl: string | null
  certificates: CertificateFile[]
  submittedAt: string
  status: CurriculumStatus
}
