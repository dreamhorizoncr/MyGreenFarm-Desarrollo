package taller.multimedia.backend.controller.appointment;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import taller.multimedia.backend.dto.MessageResponse;
import taller.multimedia.backend.exception.InvalidFieldException;
import taller.multimedia.backend.exception.SlotUnavailableException;

@RestControllerAdvice(basePackageClasses = AppointmentController.class)
public class AppointmentExceptionHandler {

    @ExceptionHandler(InvalidFieldException.class)
    public ResponseEntity<MessageResponse> handleInvalidField(InvalidFieldException exception) {
        return ResponseEntity.badRequest().body(new MessageResponse(exception.getMessage()));
    }

    @ExceptionHandler(SlotUnavailableException.class)
    public ResponseEntity<MessageResponse> handleSlotUnavailable(SlotUnavailableException exception) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new MessageResponse(exception.getMessage(), "appointmentDate"));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<MessageResponse> handleIllegalArgument(IllegalArgumentException exception) {
        return ResponseEntity.badRequest().body(new MessageResponse(exception.getMessage()));
    }
}
