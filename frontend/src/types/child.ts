import type { PageResponse } from './page.ts'

/** Relationship of the parent or guardian with the child. */
export type Relationship =
| 'FATHER'
| 'MOTHER'
| 'GRANDFATHER'
| 'GRANDMOTHER'
| 'LEGAL_GUARDIAN'
| 'OTHER'

/** Which children to list. */
export type ChildStatusFilter = 'ACTIVE' | 'INACTIVE' | 'ALL'

/** A child enrolled at the school. */
export interface Child {
    id: number
    /** Identification of the parent the child belongs to. */
    parentIdentification: string
    parentName: string
    /** Student ID given by the school. */
    studentId: string
    relationship: Relationship
    firstName: string
    lastName: string
    birthDate: string
    medicalNotes: string | null
    clubNames: string[]
    isActive: boolean
}

/** A child as an option of a selector. */
export interface ChildOption {
    id: number
    studentId: string
    childName: string
    fullName: string
}

/** Data to create or update a child. */
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

/** A page of children. */
export type ChildPage = PageResponse<Child>