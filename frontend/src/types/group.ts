/** A child of a group. */
export interface GroupChild {
  id: number
  studentId: string
  fullName: string
}

/** Group of children with its teachers. */
export interface Group {
  id: number
  name: string
  description: string | null
  /** Most children it can have; `null` for no limit. */
  maxCapacity: number | null
  enrolledChildren: number
  /** Free places; `null` when there is no limit. */
  availableSpots: number | null
  teacherIds: string[]
  teacherNames: string[]
  children: GroupChild[]
}

/** Data to create or update a group. */
export interface GroupRequest {
  name: string
  description: string | null
  maxCapacity: number | null
  teacherIds: string[]
  childIds?: number[]
}
