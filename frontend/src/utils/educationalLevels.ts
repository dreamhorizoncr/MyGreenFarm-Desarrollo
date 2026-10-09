import type { EducationalLevel } from "../types/expedient.ts";

// Relaciona los niveles del backend (enum) con las claves de traducción
// admin.expedients.levels.* — i18n estático, no Cloud Translation.
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
