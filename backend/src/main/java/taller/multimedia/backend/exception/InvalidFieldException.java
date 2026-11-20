package taller.multimedia.backend.exception;

/**
 * Thrown when a form field is invalid or unsafe; the API answers 400 with the field name so the
 * frontend can show the error next to it.
 */
public class InvalidFieldException extends RuntimeException {

    private final String field;

    /**
     * @param field name of the invalid field
     * @param message explanation shown to the user
     */
    public InvalidFieldException(String field, String message) {
        super(message);
        this.field = field;
    }

    /**
     * @return name of the invalid field
     */
    public String getField() {
        return field;
    }
}
