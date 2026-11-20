package taller.multimedia.backend.controller.gallery;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import taller.multimedia.backend.dto.common.MessageResponse;
import taller.multimedia.backend.exception.InvalidFieldException;

/**
 * Error responses of the gallery endpoints.
 */
@RestControllerAdvice(basePackageClasses = GalleryController.class)
public class GalleryExceptionHandler {

    /**
     * @param exception invalid field
     * @return 400 with the message
     */
    @ExceptionHandler(InvalidFieldException.class)
    public ResponseEntity<MessageResponse> handleInvalidField(InvalidFieldException exception) {
        return ResponseEntity.badRequest().body(new MessageResponse(exception.getMessage()));
    }

    /**
     * @param exception error with an HTTP status, for example 409 when there are too many featured
     *     galleries
     * @return that status with its reason
     */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<MessageResponse> handleResponseStatus(ResponseStatusException exception) {
        String reason = exception.getReason() != null ? exception.getReason() : "The action could not be completed.";
        return ResponseEntity.status(exception.getStatusCode()).body(new MessageResponse(reason));
    }
}
