package taller.multimedia.backend.model.appointment;

/**
 * Status of an appointment. Pending appointments whose date passes are cancelled automatically.
 */
public enum AppointmentStatus {
    CONFIRMED,
    PENDING,
    CANCELLED
}
