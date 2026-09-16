// Mismo patrón que AnnouncementRequest/Announcement en types/announcement.ts:
// VacancyInput es lo que se envía (sin id) y Vacancy es la entidad completa
// que devuelve el backend. No hay que tocar estos tipos cuando exista el
// endpoint real; ver services/vacancy.ts para lo que sí cambia.
export type OptionalApplicationField = 'applicantPhone' | 'file' | 'certificates'

export interface VacancyInput {
  title: string
  description: string
  requiredFields: OptionalApplicationField[]
}

export interface Vacancy {
  id: string
  title: string
  description: string
  isOpen: boolean
  createdAt: string
  filledByApplicationId: string | null
  requiredFields: OptionalApplicationField[]
}
