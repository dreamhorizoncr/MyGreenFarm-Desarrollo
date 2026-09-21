export type EducationalLevel=
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

export interface Expedient{
    id:string
    childName: string
    admisionDate: string
    educationalLevel: EducationalLevel
    generalObservations: string|null
    photoUrl: string|null
}

export interface ExpedientRequest{
    childName: string
    admisionDate: string
    educationalLevel: EducationalLevel
    generalObservations?: string
}