package taller.multimedia.backend.controller.gallery;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import taller.multimedia.backend.dto.MessageResponse;
import taller.multimedia.backend.exception.InvalidFieldException;

@RestControllerAdvice(basePackageClasses = GalleryController.class)
public class GalleryExceptionHandler {

    @ExceptionHandler(InvalidFieldException.class)
    public ResponseEntity<MessageResponse> handleInvalidField(InvalidFieldException exception) {
        return ResponseEntity.badRequest().body(new MessageResponse(exception.getMessage()));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<MessageResponse> handleResponseStatus(ResponseStatusException exception) {
        String reason = exception.getReason() != null ? exception.getReason() : "No se pudo completar la acción.";
        return ResponseEntity.status(exception.getStatusCode()).body(new MessageResponse(reason));
    }
}
