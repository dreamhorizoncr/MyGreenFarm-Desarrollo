package taller.multimedia.backend.dto.common;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.Data;

/**
 * Response with a message for the user, used for confirmations and errors. When the error is about
 * a form field, {@code field} names it.
 */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MessageResponse {
    private String message;
    private String field;

    /**
     * @param message text for the user
     */
    public MessageResponse(String message) {
        this.message = message;
    }

    /**
     * @param message text for the user
     * @param field form field the message refers to
     */
    public MessageResponse(String message, String field) {
        this.message = message;
        this.field = field;
    }

}
