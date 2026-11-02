export type Relationship =
| 'FATHER'
| 'MOTHER'
| 'GRANDFATHER'
| 'GRANDMOTHER'
| 'LEGAL_GUARDIAN'
| 'OTHER'

export type ChildStatusFilter = 'ACTIVE' | 'INACTIVE' | 'ALL'

export interface Child {
    id: number
    parentIdentification: string
    parentName: string
    studentId: string
    relationship: Relationship
    firstName: string
    lastName: string
    birthDate: string
    medicalNotes: string | null
    clubNames: string[]
    isActive: boolean
}

export interface ChildRequest {
    parentIdentification: string
    relationship: Relationship
    firstName: string
    lastName: string
    birthDate: string
    medicalNotes: string
    clubIds: number[]
    isActive: boolean
}

export interface ChildPage {
    content: Child[]
    totalElements: number
    totalPages: number
    number: number
    size: number
}