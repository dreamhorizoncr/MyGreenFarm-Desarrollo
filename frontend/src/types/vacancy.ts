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
