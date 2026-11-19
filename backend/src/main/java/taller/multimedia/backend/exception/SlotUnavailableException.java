package taller.multimedia.backend.exception;

/**
 * Thrown when an appointment time slot cannot be held or booked because it is not free; the API
 * answers 409 Conflict.
 */
public class SlotUnavailableException extends RuntimeException {

    /**
     * @param message explanation shown to the family
     */
    public SlotUnavailableException(String message) {
        super(message);
    }
}
