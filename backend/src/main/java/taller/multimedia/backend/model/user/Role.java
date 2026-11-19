package taller.multimedia.backend.model.user;

/**
 * Role of a staff user. The owner can do everything, admins manage the daily work, and teachers
 * only see their groups.
 */
public enum Role {
    ADMIN,
    OWNER,
    TEACHER
}
