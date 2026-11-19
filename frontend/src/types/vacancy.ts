/** Fields of an application that each vacancy can make required. */
export type OptionalApplicationField = 'applicantPhone' | 'file' | 'certificates'

/** Data to create a vacancy. */
export interface VacancyInput {
  title: string
  description: string
  requiredFields: OptionalApplicationField[]
}

/** A job vacancy. */
export interface Vacancy {
  id: string
  title: string
  description: string
  isOpen: boolean
  createdAt: string
  /** Application that filled it, if any. */
  filledByApplicationId: string | null
  requiredFields: OptionalApplicationField[]
}
