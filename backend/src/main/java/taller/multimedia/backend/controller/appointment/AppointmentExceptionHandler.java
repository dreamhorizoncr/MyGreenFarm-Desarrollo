package taller.multimedia.backend.controller.appointment;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import taller.multimedia.backend.dto.common.MessageResponse;
import taller.multimedia.backend.exception.InvalidFieldException;
import taller.multimedia.backend.exception.SlotUnavailableException;

/**
 * Error responses of the appointment endpoints.
 */
@RestControllerAdvice(basePackageClasses = AppointmentController.class)
public class AppointmentExceptionHandler {

    /**
     * @param exception invalid field
     * @return 400 with the message
     */
    @ExceptionHandler(InvalidFieldException.class)
    public ResponseEntity<MessageResponse> handleInvalidField(InvalidFieldException exception) {
        return ResponseEntity.badRequest().body(new MessageResponse(exception.getMessage()));
    }

    /**
     * @param exception the slot is not free
     * @return 409 with the message, pointing at the {@code appointmentDate} field
     */
    @ExceptionHandler(SlotUnavailableException.class)
    public ResponseEntity<MessageResponse> handleSlotUnavailable(SlotUnavailableException exception) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new MessageResponse(exception.getMessage(), "appointmentDate"));
    }

    /**
     * @param exception invalid data
     * @return 400 with the message
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<MessageResponse> handleIllegalArgument(IllegalArgumentException exception) {
        return ResponseEntity.badRequest().body(new MessageResponse(exception.getMessage()));
    }
}
