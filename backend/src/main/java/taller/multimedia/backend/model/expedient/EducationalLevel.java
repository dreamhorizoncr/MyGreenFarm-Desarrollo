package taller.multimedia.backend.model.expedient;

/**
 * Educational level of a child. The values are the official names of the levels in Costa Rica, from
 * infants ({@code LACTANTES}) to sixth grade, so they are kept in Spanish; they are stored and sent
 * to the frontend as they are.
 */
public enum EducationalLevel {
    LACTANTES,
    MATERNAL,
    INTERACTIVO,
    MATERNO,
    KINDER,
    PRIMER_GRADO,
    SEGUNDO_GRADO,
    TERCER_GRADO,
    CUARTO_GRADO,
    QUINTO_GRADO,
    SEXTO_GRADO
}
