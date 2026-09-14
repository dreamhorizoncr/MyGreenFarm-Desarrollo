import type { Vacancy } from '../types/vacancy.ts'

export const SEED_VACANCIES: Vacancy[] = [
  {
    id: 'vac-1',
    title: 'Maestra/o de Preescolar',
    description: 'Buscamos una persona docente para el grupo de preescolar (3-5 años), con experiencia en educación inicial y valores afines a nuestra metodología.',
    isOpen: true,
    createdAt: '2026-08-20T09:00:00.000Z',
    filledByApplicationId: null,
  },
  {
    id: 'vac-2',
    title: 'Auxiliar de Guardería',
    description: 'Apoyo en el cuidado y actividades diarias de niños de 3 meses a 2 años. Se valora experiencia previa con primera infancia.',
    isOpen: true,
    createdAt: '2026-08-25T09:00:00.000Z',
    filledByApplicationId: null,
  },
  {
    id: 'vac-3',
    title: 'Coordinador(a) Administrativo',
    description: 'Gestión de matrículas, facturación y atención a familias.',
    isOpen: false,
    createdAt: '2026-07-10T09:00:00.000Z',
    filledByApplicationId: 'cv-6',
  },
  {
    id: 'vac-4',
    title: 'Docente de Primaria',
    description: 'Impartir lecciones a estudiantes de primer y segundo grado, dando seguimiento individualizado y comunicación constante con las familias.',
    isOpen: true,
    createdAt: '2026-09-02T09:00:00.000Z',
    filledByApplicationId: null,
  },
  {
    id: 'vac-5',
    title: 'Psicólogo(a) Escolar',
    description: 'Acompañamiento emocional y conductual de los estudiantes, apoyo a docentes y comunicación con padres de familia sobre el desarrollo de cada niño.',
    isOpen: true,
    createdAt: '2026-09-06T09:00:00.000Z',
    filledByApplicationId: null,
  },
  {
    id: 'vac-6',
    title: 'Encargado(a) de Cocina',
    description: 'Preparación de alimentos balanceados para los estudiantes, control de inventario y cumplimiento de normas de higiene y manipulación de alimentos.',
    isOpen: false,
    createdAt: '2026-06-18T09:00:00.000Z',
    filledByApplicationId: null,
  },
]
