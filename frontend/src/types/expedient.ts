/** Educational levels of the Costa Rican system, as the backend names them. */
export type EducationalLevel =
  | 'LACTANTES'
  | 'MATERNAL'
  | 'INTERACTIVO'
  | 'MATERNO'
  | 'KINDER'
  | 'PRIMER_GRADO'
  | 'SEGUNDO_GRADO'
  | 'TERCER_GRADO'
  | 'CUARTO_GRADO'
  | 'QUINTO_GRADO'
  | 'SEXTO_GRADO'

/** Record of a child at the school. */
export interface Expedient {
  id: string
  childName: string
  studentId: string
  /** Day the child joined the school, `yyyy-MM-dd`. */
  admissionDate: string
  educationalLevel: EducationalLevel
  generalObservations: string | null
  photoUrl: string | null
}

/** Data to create or update a record. */
export interface ExpedientRequest {
  studentId: string
  admissionDate: string
  educationalLevel: EducationalLevel
  generalObservations?: string
}
