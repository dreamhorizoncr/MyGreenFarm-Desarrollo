package taller.multimedia.backend.controller.announcement;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import taller.multimedia.backend.dto.MessageResponse;
import taller.multimedia.backend.exception.InvalidFieldException;

@RestControllerAdvice(basePackageClasses = AnnouncementController.class)
public class AnnouncementExceptionHandler {

    @ExceptionHandler(InvalidFieldException.class)
    public ResponseEntity<MessageResponse> handleInvalidField(InvalidFieldException exception) {
        return ResponseEntity.badRequest().body(new MessageResponse(exception.getMessage()));
    }
}
