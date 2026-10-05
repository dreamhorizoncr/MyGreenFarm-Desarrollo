export type Relationship =
| 'FATHER'
| 'MOTHER'
| 'GRANDFATHER'
| 'GRANDMOTHER'
| 'LEGAL_GUARDIAN'
| 'OTHER'

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
}

export interface ChildRequest {
    parentIdentification: string
    relationship: Relationship
    firstName: string
    lastName: string
    birthDate: string
    medicalNotes: string
    clubIds: number[]
}

export interface ChildPage {
    content: Child[]
    totalElements: number
    totalPages: number
    number: number
    size: number
}