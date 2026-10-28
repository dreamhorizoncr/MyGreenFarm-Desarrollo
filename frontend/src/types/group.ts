
    export interface GroupChild {
    id: number
    studentId: string
    fullName: string
    }

    export interface Group {
    id: number
    name: string
    description: string | null
    maxCapacity: number | null
    enrolledChildren: number
    availableSpots: number | null
    teacherId: string
    teacherName: string
    children: GroupChild[]
    }

    export interface GroupRequest {
    name: string
    description: string | null
    maxCapacity: number | null
    teacherId: string
    }
