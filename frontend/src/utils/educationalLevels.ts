import type { EducationalLevel } from "../types/expedient.ts";

export const educationalLevelKeys = {
  LACTANTES: "lactantes",
  MATERNAL: "maternal",
  INTERACTIVO: "interactivo",
  MATERNO: "materno",
  KINDER: "kinder",
  PRIMER_GRADO: "primerGrado",
  SEGUNDO_GRADO: "segundoGrado",
  TERCER_GRADO: "tercerGrado",
  CUARTO_GRADO: "cuartoGrado",
  QUINTO_GRADO: "quintoGrado",
  SEXTO_GRADO: "sextoGrado",
} as const satisfies Record<EducationalLevel, string>;
