package taller.multimedia.backend.controller.vacancy;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import taller.multimedia.backend.dto.MessageResponse;
import taller.multimedia.backend.exception.InvalidFieldException;

@RestControllerAdvice(basePackageClasses = VacancyController.class)
public class VacancyExceptionHandler {

    @ExceptionHandler(InvalidFieldException.class)
    public ResponseEntity<MessageResponse> handleInvalidField(InvalidFieldException exception) {
        return ResponseEntity.badRequest().body(new MessageResponse(exception.getMessage()));
    }
}
