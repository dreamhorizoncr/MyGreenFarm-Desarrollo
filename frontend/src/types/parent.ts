/** Languages in which a parent receives the emails. */
export type ParentLanguage = 'es' | 'en' | 'fr'

/** Parent or guardian of one or more children. */
export interface Parent {
  id: number
  identification: string
  email: string
  phoneNumber: string
  address: string
  firstName: string
  lastName: string
  language: ParentLanguage
  isActive: boolean
  createdAt: string
}

/** Data to create or update a parent. */
export interface ParentRequest {
  identification: string
  email: string
  phoneNumber: string
  address: string
  firstName: string
  lastName: string
  isActive: boolean
  language: ParentLanguage
}
